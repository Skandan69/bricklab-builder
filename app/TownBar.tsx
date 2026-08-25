"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";

/** The slice of window.brickforge this bar needs. */
export type SaveableForge = {
  exportTown?: () => unknown;
  importTown?: (data: unknown) => boolean;
  snapshot?: (width?: number) => string;
};

type TownCard = {
  id: string;
  name: string;
  ownerName: string | null;
  brickCount: number;
  thumb: string | null;
  visibility: "private" | "unlisted" | "public";
  updatedAt: string;
  likes: number;
  liked: boolean;
  mine: boolean;
};

const VOTER_KEY = "bricklab-voter-id";

function voterId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VOTER_KEY);
    if (existing) return existing;
    const made = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(VOTER_KEY, made);
    return made;
  } catch {
    return "anon";
  }
}

export default function TownBar({
  getApi,
  ready,
}: {
  getApi: () => SaveableForge | undefined;
  ready: boolean;
}) {
  const [name, setName] = useState("My town");
  const [townId, setTownId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<TownCard["visibility"]>("private");
  const [status, setStatus] = useState("");
  const [signInPath, setSignInPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<null | "mine" | "public">(null);
  const [items, setItems] = useState<TownCard[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const autoLoaded = useRef(false);

  const note = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus((current) => (current === message ? "" : current)), 4000);
  }, []);

  const loadTown = useCallback(
    async (id: string) => {
      const api = getApi();
      if (!api?.importTown) return note("Builder is still loading");
      setBusy(true);
      try {
        const response = await fetch(`/api/towns/${id}`);
        const payload = (await response.json()) as { data?: unknown; name?: string; visibility?: TownCard["visibility"]; error?: string };
        if (!response.ok) return note(payload.error ?? "Could not open that town");
        if (!api.importTown(payload.data)) return note("That town could not be loaded");
        setTownId(id);
        if (payload.name) setName(payload.name);
        if (payload.visibility) setVisibility(payload.visibility);
        setPanel(null);
        note(`Opened ${payload.name ?? "town"}`);
      } catch {
        note("Network problem opening that town");
      } finally {
        setBusy(false);
      }
    },
    [getApi, note],
  );

  /* A ?town=<id> link opens that town as soon as the builder is up. */
  useEffect(() => {
    if (!ready || autoLoaded.current) return;
    const id = new URLSearchParams(window.location.search).get("town");
    if (!id) return;
    autoLoaded.current = true;
    void loadTown(id);
  }, [ready, loadTown]);

  async function save() {
    const api = getApi();
    if (!api?.exportTown) return note("Builder is still loading");
    setBusy(true);
    setSignInPath(null);
    try {
      const data = api.exportTown();
      const thumb = api.snapshot ? api.snapshot(480) : undefined;
      const response = await fetch("/api/towns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: townId, name, data, thumb, visibility }),
      });
      const payload = (await response.json()) as { id?: string; error?: string; signInPath?: string };
      if (response.status === 401) {
        setSignInPath(payload.signInPath ?? "/signin-with-chatgpt");
        return note("Sign in to keep your town online");
      }
      if (!response.ok || !payload.id) return note(payload.error ?? "Save failed");
      setTownId(payload.id);
      note(townId ? "Town updated" : "Town saved to your account");
    } catch {
      note("Network problem while saving");
    } finally {
      setBusy(false);
    }
  }

  async function openPanel(scope: "mine" | "public") {
    setPanel(scope);
    setLoadingList(true);
    try {
      const response = await fetch(`/api/towns?scope=${scope}&voterId=${voterId()}&limit=24`);
      const payload = (await response.json()) as { items?: TownCard[]; signedIn?: boolean };
      setItems(payload.items ?? []);
      if (scope === "mine" && payload.signedIn === false) {
        setSignInPath("/signin-with-chatgpt");
      }
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }

  async function toggleLike(card: TownCard) {
    const response = await fetch(`/api/towns/${card.id}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ voterId: voterId(), liked: !card.liked }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { count: number; liked: boolean };
    setItems((list) =>
      list.map((item) =>
        item.id === card.id ? { ...item, likes: payload.count, liked: payload.liked } : item,
      ),
    );
  }

  function share() {
    if (!townId) return note("Save the town first");
    const url = `${window.location.origin}${window.location.pathname}?town=${townId}`;
    if (visibility === "private") note("Heads up: this town is private, so only you can open the link");
    navigator.clipboard?.writeText(url).then(
      () => note("Share link copied"),
      () => note(url),
    );
  }

  return (
    <div className="bl-townbar">
      <style>{`
        .bl-townbar{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;z-index:6;
          display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:14px;
          background:rgba(255,255,255,.94);box-shadow:0 10px 30px rgba(12,20,34,.18);
          border:1px solid rgba(20,32,50,.12);font:13px/1.3 system-ui,sans-serif;color:#1c2530;
          backdrop-filter:blur(8px);max-width:min(94vw,760px);flex-wrap:wrap;justify-content:center}
        .bl-townbar input,.bl-townbar select{font:inherit;color:inherit;background:#f2f5fa;
          border:1px solid rgba(20,32,50,.14);border-radius:9px;padding:6px 9px}
        .bl-townbar input{width:150px}
        .bl-townbar button{font:inherit;cursor:pointer;border-radius:9px;padding:6px 11px;
          border:1px solid rgba(20,32,50,.14);background:#fff;color:inherit;transition:.12s}
        .bl-townbar button:hover:not(:disabled){border-color:#2563eb;color:#2563eb}
        .bl-townbar button:disabled{opacity:.5;cursor:default}
        .bl-townbar button.bl-primary{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}
        .bl-note{color:#3f5069;font-size:12px;max-width:230px}
        .bl-signin{color:#2563eb;font-weight:600;text-decoration:none}
        .bl-panel{position:absolute;bottom:100%;margin-bottom:10px;left:50%;transform:translateX(-50%);
          width:min(92vw,720px);max-height:52vh;overflow:auto;background:#fff;border-radius:16px;
          border:1px solid rgba(20,32,50,.12);box-shadow:0 18px 44px rgba(12,20,34,.22);padding:14px}
        .bl-panel h3{margin:0 0 10px;font-size:14px}
        .bl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
        .bl-card{border:1px solid rgba(20,32,50,.12);border-radius:12px;overflow:hidden;background:#f8fafc;
          display:flex;flex-direction:column}
        .bl-card img{width:100%;height:88px;object-fit:cover;display:block;background:#e6ecf5}
        .bl-card .bl-body{padding:8px 9px;display:flex;flex-direction:column;gap:5px}
        .bl-card strong{font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .bl-card small{color:#5a6b82;font-size:11px}
        .bl-row{display:flex;gap:6px;align-items:center}
        .bl-row button{padding:4px 8px;font-size:11.5px}
        .bl-empty{color:#5a6b82;font-size:12.5px;padding:6px 2px}
      `}</style>

      {panel && (
        <div className="bl-panel">
          <h3>{panel === "mine" ? "My saved towns" : "Community towns"}</h3>
          {loadingList ? (
            <p className="bl-empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="bl-empty">
              {panel === "mine"
                ? "Nothing saved yet — build something and press Save."
                : "No public towns yet. Set yours to Public to be the first."}
            </p>
          ) : (
            <div className="bl-grid">
              {items.map((card) => (
                <div className="bl-card" key={card.id}>
                  {card.thumb ? (
                    <img src={card.thumb} alt="" />
                  ) : (
                    <div style={{ height: 88, background: "#e6ecf5" }} />
                  )}
                  <div className="bl-body">
                    <strong title={card.name}>{card.name}</strong>
                    <small>
                      {card.brickCount} pieces
                      {card.ownerName && !card.mine ? ` · ${card.ownerName}` : ""}
                      {card.mine ? ` · ${card.visibility}` : ""}
                    </small>
                    <div className="bl-row">
                      <button onClick={() => void loadTown(card.id)}>Open</button>
                      <button onClick={() => void toggleLike(card)}>
                        {card.liked ? "♥" : "♡"} {card.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bl-row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setPanel(null)}>Close</button>
          </div>
        </div>
      )}

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={60}
        aria-label="Town name"
        placeholder="Town name"
      />
      <select
        value={visibility}
        onChange={(event) => setVisibility(event.target.value as TownCard["visibility"])}
        aria-label="Who can see this town"
      >
        <option value="private">Private</option>
        <option value="unlisted">Anyone with the link</option>
        <option value="public">Public gallery</option>
      </select>
      <button className="bl-primary" onClick={() => void save()} disabled={busy || !ready}>
        {townId ? "Update" : "Save"}
      </button>
      <button onClick={share} disabled={!townId}>
        Share
      </button>
      <button onClick={() => void openPanel("mine")}>My towns</button>
      <button onClick={() => void openPanel("public")}>Community</button>
      {signInPath && (
        <a className="bl-signin" href={`${signInPath}?return_to=${encodeURIComponent("/")}`}>
          Sign in with ChatGPT
        </a>
      )}
      {status && <span className="bl-note">{status}</span>}
    </div>
  );
}
