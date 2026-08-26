"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";

/**
 * The gallery — every town anyone has published, and the place a build goes to
 * be seen rather than to be scored.
 *
 * Two orders, because they answer different questions. "All time" is the
 * most-liked, which is what a hall of fame is for. "Newest" is what somebody
 * just finished, which is the only way a new build ever gets its first like.
 * A gallery with only the first order is a gallery where nothing new can climb.
 */

type Town = {
  id: string;
  name: string;
  ownerName: string | null;
  brickCount: number;
  thumb: string | null;
  updatedAt: string;
  likes: number;
  liked: boolean;
  mine: boolean;
};

const PAGE = 24;

const makeVoterId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

function voterId(): string {
  try {
    let id = window.localStorage.getItem("bricklab-voter");
    if (!id) {
      id = makeVoterId();
      window.localStorage.setItem("bricklab-voter", id);
    }
    return id;
  } catch {
    /* a blocked store just means likes will not be remembered between visits */
    return makeVoterId();
  }
}

const when = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days)) return "";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? "last month" : `${months} months ago`;
};

export default function Gallery() {
  const [sort, setSort] = useState<"likes" | "recent">("likes");
  const [towns, setTowns] = useState<Town[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (which: "likes" | "recent", from: number, append: boolean) => {
    if (!append) setState("loading");
    try {
      const url = `/api/towns?scope=public&sort=${which}&limit=${PAGE}&offset=${from}&voterId=${voterId()}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { items: Town[] };
      const items = Array.isArray(data.items) ? data.items : [];
      setTowns((current) => (append ? [...current, ...items] : items));
      setMore(items.length === PAGE);
      setState("ready");
    } catch {
      if (!append) setState("failed");
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    load(sort, 0, false);
  }, [sort, load]);

  const toggleLike = async (town: Town) => {
    if (busy) return;
    setBusy(town.id);
    const next = !town.liked;
    /* Move the heart immediately; put it back if the server disagrees. */
    setTowns((list) =>
      list.map((t) => (t.id === town.id ? { ...t, liked: next, likes: t.likes + (next ? 1 : -1) } : t)),
    );
    try {
      const response = await fetch(`/api/towns/${town.id}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voterId: voterId(), liked: next }),
      });
      const data = (await response.json()) as { count?: number; liked?: boolean };
      if (response.ok && typeof data.count === "number") {
        setTowns((list) =>
          list.map((t) => (t.id === town.id ? { ...t, likes: data.count!, liked: !!data.liked } : t)),
        );
      } else {
        throw new Error("rejected");
      }
    } catch {
      setTowns((list) =>
        list.map((t) => (t.id === town.id ? { ...t, liked: town.liked, likes: town.likes } : t)),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="gallery-shell">
      <nav className="welcome-nav">
        <a className="logo" href="/" aria-label="BrickLab home">
          <span className="logo-mark"><i /><i /><i /><i /></span>
          <span>BrickLab</span>
        </a>
        <div className="welcome-links" aria-label="Game modes">
          <a href="/">Dream Cities</a>
          <a href="/frontier.html">Frontier RPG</a>
          <a href="/worldforge.html">Open World</a>
          <a href="/infinite-plots.html">Infinite Plots</a>
        </div>
        <span className="beta-pill">Community gallery</span>
      </nav>

      <header className="gallery-head">
        <p className="eyebrow"><span /> Built by players</p>
        <h1>The gallery.</h1>
        <p className="gallery-lede">
          Every town anyone has published. Like the ones you would want to walk through — the all-time
          board is ordered by exactly that.
        </p>
        <div className="gallery-tabs" role="tablist" aria-label="Order the gallery">
          {([["likes", "All time"], ["recent", "Newest"]] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={sort === key}
              className={sort === key ? "on" : ""}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {state === "loading" && <p className="gallery-note">Loading the gallery…</p>}

      {state === "failed" && (
        <p className="gallery-note">
          The gallery could not be reached. It needs the saved-towns database —{" "}
          <button className="gallery-retry" onClick={() => load(sort, 0, false)}>try again</button>.
        </p>
      )}

      {state === "ready" && towns.length === 0 && (
        <div className="gallery-empty">
          <h2>Nothing published yet.</h2>
          <p>
            Build a town in Dream Cities, save it, and set it to public. It will show up here, and
            the first like anyone gives it puts it on the all-time board.
          </p>
          <a className="cta primary-cta" href="/">Open the builder <span>→</span></a>
        </div>
      )}

      {towns.length > 0 && (
        <>
          <ol className="gallery-grid">
            {towns.map((town, index) => (
              <li key={town.id} className="gallery-card">
                <div className="gallery-art">
                  {town.thumb ? (
                    <img src={town.thumb} alt={`${town.name}, built by ${town.ownerName || "a builder"}`} loading={index < 6 ? "eager" : "lazy"} />
                  ) : (
                    <span className="gallery-noshot">No picture yet</span>
                  )}
                  {sort === "likes" && index < 3 && <span className={`gallery-medal m${index + 1}`}>{index + 1}</span>}
                </div>
                <div className="gallery-copy">
                  <h3>{town.name}</h3>
                  <p>
                    {town.ownerName || "A builder"}
                    {town.mine && " · yours"} · {town.brickCount.toLocaleString()} pieces · {when(town.updatedAt)}
                  </p>
                </div>
                <button
                  className={`gallery-like ${town.liked ? "liked" : ""}`}
                  onClick={() => toggleLike(town)}
                  disabled={busy === town.id}
                  aria-pressed={town.liked}
                  aria-label={town.liked ? `Unlike ${town.name}` : `Like ${town.name}`}
                >
                  ♥ <strong>{town.likes}</strong>
                </button>
              </li>
            ))}
          </ol>

          {more && (
            <button
              className="gallery-more"
              onClick={() => {
                const next = offset + PAGE;
                setOffset(next);
                load(sort, next, true);
              }}
            >
              Show more
            </button>
          )}
        </>
      )}

      <footer className="gallery-foot">
        BrickLab is an original building and adventure game universe. It is not affiliated with the
        LEGO Group or any other block-building game.
      </footer>
    </main>
  );
}
