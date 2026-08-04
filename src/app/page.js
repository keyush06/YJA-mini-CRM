// Author: Keyush
// Description: Public view page - shows the latest YJA content as a card grid.

import { supabase } from "@/lib/supabase";

export const revalidate = 0; // this will make sure that new data is being rendered automatically

// this si dummy, posts within last hr will come here.  I can tweak this to increase/decr time.
const NEW_RELEASE_WINDOW_MS = 60 * 60 * 1000;

function PostCard({ post }) {
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
    >
      <div className="card-image">
        {post.image_url ? (

          <img src={post.image_url} alt={post.title} />
        ) : (
  
          <img
            className="placeholder-img"
            src="/placeholder.jpg"
            alt="YJA - meditating Tirthankara"
          />
        )}
      </div>
      <div className="card-body">
        <h3>{post.title}</h3>
        {post.description && <p>{post.description}</p>}
        <span className="card-cta">Read more →</span>
      </div>
    </a>
  );
}

export default async function Home() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const cutoff = Date.now() - NEW_RELEASE_WINDOW_MS;
  const newReleases =
    posts?.filter((p) => new Date(p.created_at).getTime() >= cutoff) ?? [];
  const earlierPosts =
    posts?.filter((p) => new Date(p.created_at).getTime() < cutoff) ?? [];

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">Jai Jinendra 🙏</p>
        <h1>Explore Our Community</h1>
        <p className="subtitle">
          The latest publications, events, and resources from Young Jains of
          America
        </p>
      </header>

      {error && <p className="notice">Could not load posts: {error.message}</p>}

      {posts?.length === 0 && (
        <p className="notice">No posts yet - add one from the Manage page.</p>
      )}

      {newReleases.length > 0 && (
        <>
          <div className="section-title">
            <h2>New Releases</h2>
            <span className="section-count">
              {newReleases.length} {newReleases.length === 1 ? "post" : "posts"}
            </span>
          </div>
          <section className="grid">
            {newReleases.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        </>
      )}

      {earlierPosts.length > 0 && (
        <>
          <div className="section-title section-title-spaced">
            <h2>Earlier Posts</h2>
            <span className="section-count">
              {earlierPosts.length}{" "}
              {earlierPosts.length === 1 ? "post" : "posts"}
            </span>
          </div>
          <section className="grid">
            {earlierPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
