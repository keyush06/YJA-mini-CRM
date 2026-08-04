"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Must match the bucket name in Supabase -> Storage exactly.
const IMAGE_BUCKET = "post-images-yja";

export default function ManagePage() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: "ok" | "err", msg }
  const [busy, setBusy] = useState(false);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts(data);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    // basic validation
    if (!title.trim() || !link.trim()) {
      setStatus({ type: "err", msg: "Title and link are required." });
      return;
    }
    try {
      new URL(link); // throws if not a valid URL
    } catch {
      setStatus({ type: "err", msg: "Link must be a valid URL (include https://)." });
      return;
    }

    setBusy(true);
    let imageUrl = null;

    // 1) upload image if provided
    if (imageFile) {
      const path = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, imageFile);
      if (uploadError) {
        setStatus({ type: "err", msg: `Image upload failed: ${uploadError.message}` });
        setBusy(false);
        return;
      }
      imageUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    // 2) insert the post row
    const { error: insertError } = await supabase.from("posts").insert({
      title: title.trim(),
      link: link.trim(),
      description: description.trim() || null,
      image_url: imageUrl,
    });

    if (insertError) {
      setStatus({ type: "err", msg: `Could not create post: ${insertError.message}` });
    } else {
      setStatus({ type: "ok", msg: "Post created." });
      setTitle("");
      setLink("");
      setDescription("");
      setImageFile(null);
      e.target.reset(); // clears the file input
      loadPosts();
    }
    setBusy(false);
  }

  async function handleDelete(post) {
    if (!confirm(`Delete "${post.title}"?`)) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      setStatus({ type: "err", msg: `Delete failed: ${error.message}` });
      return;
    }

    // best-effort: remove the stored image too, so the bucket doesn't collect orphans
    if (post.image_url) {
      const path = post.image_url.split(`/${IMAGE_BUCKET}/`)[1];
      if (path) await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    }

    setStatus({ type: "ok", msg: "Post deleted." });
    loadPosts();
  }

  // Export all posts as a CSV file - this is also how a board member
  // (e.g. Director of Events) can download submission data without SQL.
  function downloadCsv() {
    if (!posts.length) return;
    const cols = ["id", "title", "link", "description", "image_url", "created_at"];
    const escapeCell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = [
      cols.join(","),
      ...posts.map((p) => cols.map((c) => escapeCell(p[c])).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yja-posts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <header className="hero hero-small">
        <h1>Manage Posts</h1>
        <p className="subtitle">Create and remove YJA content posts</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Title *
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Young Minds - Fall Edition"
          />
        </label>

        <label>
          Link *
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://yja.org/..."
          />
        </label>

        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two lines about this content"
          />
        </label>

        <label>
          Image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create Post"}
        </button>

        {status && (
          <p className={status.type === "ok" ? "status-ok" : "status-err"}>
            {status.msg}
          </p>
        )}
      </form>

      <section className="post-list">
        <div className="post-list-header">
          <h2>Existing posts ({posts.length})</h2>
          <button
            type="button"
            className="csv-btn"
            onClick={downloadCsv}
            disabled={!posts.length}
            title="Download all posts as a CSV spreadsheet"
          >
            ⬇ Download CSV
          </button>
        </div>
        {posts.map((post) => (
          <div key={post.id} className="post-row">
            <div>
              <strong>{post.title}</strong>
              {post.description && <p>{post.description}</p>}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(post)}>
              Delete
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
