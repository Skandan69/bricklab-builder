"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import TownBar from "./TownBar";

type CityView = "city" | "resident" | "rail" | "tour" | "inspect";
type DemoWorld = "city1" | "city2" | "indian" | "royal" | "skyrail";
type ResidentDestination = "home" | "restaurant" | "hotel" | "palace" | "temple" | "bazaar" | "stepwell" | "ghats";
type ForgeBrick = { typeId: string };
type PieceType = { id: string; w: number; d: number; h: number };
type ChallengeTarget = {
  id: string; name: string; brief: string; difficulty: number;
  seconds: number; pieces: number; file: string; image: string;
};
type ChallengeResult = {
  score: number; shape: number; pieceMatch: number; colourMatch: number;
  targetCells: number; attemptCells: number; shared: number; missing: number;
  extra: number; rotation: number;
};
type BoardRow = { rank: number; name: string; score: number; seconds: number | null; you: boolean };
type Board = { items: BoardRow[]; you: { score: number; seconds: number | null; rank: number } | null; storage: boolean };
type OverallRow = { rank: number; name: string; value: number; extra: number | null; you: boolean };
type Overall = {
  board: "cleared" | "accuracy" | "speed";
  items: OverallRow[];
  you: { rank: number | null; value: number; extra: number | null; listed: boolean } | null;
  clearAt?: number; minForAverage?: number; targetCount?: number;
};
type Scorer = {
  compare: (target: unknown[], attempt: unknown[], types: Record<string, PieceType>) => ChallengeResult;
};
type TownPermissions = { copyAllowed: boolean; attribution: string };
type ForgeApi = { bricks: () => ForgeBrick[]; mode: () => "build" | "play"; clearAll: (record?: boolean) => void; setMode: (mode: "build" | "play") => void; setShowcaseMode: (locked: boolean) => void; setDemoCity: (name: DemoWorld) => void; loadShowcaseWorld: (data: unknown, name: DemoWorld) => boolean; setView: (view: CityView) => boolean; setResidentDestination: (name: ResidentDestination) => void; enterMyTownResident: () => boolean; visitMyTownBuilding: (name: string) => boolean; setRailLook: (yaw: number, pitch?: number) => void; setWeather: (name: "clear" | "rain" | "snow" | "fog") => void; saveLocalTown: () => boolean; loadLocalTown: () => boolean; startHomePlot: () => boolean; expandHomePlot: () => string; placeBlueprint: (name: string) => boolean; loadWorldLayout: (name: string) => boolean; copyDemoCity: () => boolean; setTownCopyAllowed: (allowed: boolean) => boolean; townPermissions: () => TownPermissions; exportTown?: () => unknown; importTown?: (data: unknown) => boolean; snapshot?: (width?: number) => string; };
type BuilderWindow = Window & { brickforge?: ForgeApi & { types?: PieceType[] } };

const missions = [
  { title: "Lay the first road", detail: "Add at least five connected road pieces.", target: "roads" },
  { title: "Power the neighbourhood", detail: "Add a generator and a streetlight.", target: "power" },
  { title: "Build the first home", detail: "Use a doorway and at least eight building pieces.", target: "home" },
  { title: "Bring the town to life", detail: "Press Play to activate your systems.", target: "play" },
] as const;
const makeVoterId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2,12)}`;
const showcaseWorlds = [
  { id:"royal", title:"Royal Palace Complex", era:"Buildable heritage landmark", image:"/shots/royal-palace.webp", description:"A fortified compound with corner minarets, a charbagh garden, a domed palace, a stepwell, a bazaar street, a durbar hall and a lake pavilion.", playable:true, accent:"saffron" },
  { id:"skyrail", title:"Skyrail District", era:"Modern starter district", image:"/shots/skyrail-district.webp", description:"Sixty-four blocks of city: a downtown of glass towers, a park with a lake, a quarter of homes, a civic square, and the railway on piers with two stations.", playable:true, accent:"blue" },
  { id:"city1", title:"Metro City 1", era:"Modern classic", image:"/shots/metro-city-1.webp", description:"The original BrickLab metropolis with long avenues, neighbourhoods, public services and live transport.", playable:true, accent:"blue" },
  { id:"city2", title:"Metro City 2", era:"Modern waterfront", image:"/shots/metro-city-2.webp", description:"A park-centred skyline with an elevated railway, harbour, detailed homes, hotel and restaurant.", playable:true, accent:"red" },
  { id:"indian", title:"Indian Heritage City", era:"Imperial palaces & bazaars", image:"/shots/indian-heritage.webp", description:"A walled capital of 240 studs: a temple precinct behind four gopurams, a domed palace, a citadel on a mound, a bazaar, a haveli quarter, ghats and a lake palace.", playable:true, accent:"saffron" },
  { id:"japanese", title:"Japanese Castle Town", era:"Castles & gardens", image:"", description:"Tiered castle roofs, cherry gardens, bridges, mountain streets and traditional homes.", playable:false, accent:"pink" },
  { id:"chinese", title:"Chinese Walled City", era:"Gates & lanterns", image:"", description:"A fortified city of red gates, tiled roofs, lantern streets, gardens and defensive walls.", playable:false, accent:"gold" },
  { id:"medieval", title:"European Medieval City", era:"Castles & guilds", image:"", description:"Stone castles, towers, bridges, workshops, a market square and winding town lanes.", playable:false, accent:"green" },
  { id:"ruins", title:"Ancient Ruins", era:"Lost civilisation", image:"", description:"Broken temples, overgrown arches, hidden chambers and archaeological discoveries.", playable:false, accent:"stone" },
  { id:"temples", title:"Ancient Temple City", era:"Towers & courtyards", image:"", description:"Monumental temple towers, pillared halls, ceremonial steps, gardens and a riverfront district.", playable:false, accent:"temple" },
  { id:"pyramids", title:"Pyramid Kingdom", era:"Desert civilisation", image:"", description:"Great pyramids, obelisks, desert settlements, river gardens and archaeological expeditions.", playable:false, accent:"desert" },
  { id:"mayan", title:"Jungle Pyramid City", era:"Hidden in the canopy", image:"", description:"Stepped pyramids, jungle plazas, waterfalls, carved gateways and hidden exploration paths.", playable:false, accent:"jungle" },
  { id:"classical", title:"Classical Empire", era:"Forums & amphitheatres", image:"", description:"Marble temples, grand forums, aqueducts, amphitheatres, villas and Mediterranean harbours.", playable:false, accent:"marble" },
] as const;

const demoDetails: Record<DemoWorld,{title:string;selector:string;summary:string;copyLabel:string;rail:boolean}> = {
  royal:{title:"Royal Palace Complex",selector:"Palace · Royal",summary:"A buildable landmark made from 121 editable pieces, with domes, chhatris, jali screens, courtyards, garden details and a fortified perimeter.",copyLabel:"Royal Palace",rail:false},
  skyrail:{title:"Skyrail District",selector:"District · Skyrail",summary:"A compact 275-piece modern district with glass towers, connected streets, landscaping, homes, station platforms and an elevated working train.",copyLabel:"Skyrail District",rail:true},
  city1:{title:"Metro City 1",selector:"City 1 · Classic",summary:"The original large BrickLab metropolis with long avenues, services and working systems.",copyLabel:"City 1",rail:true},
  city2:{title:"Metro City 2",selector:"City 2 · Waterfront",summary:"A separate concept-inspired world with a central park, dense skyline, waterfront neighbourhood and elevated Metro.",copyLabel:"City 2",rail:true},
  indian:{title:"Indian Heritage City",selector:"Indian · Heritage",summary:"A walled capital laid out on two processional avenues: a temple precinct entered through gopurams, a domed palace, a hill citadel, a bazaar, a haveli quarter, river ghats and a lake palace, with elephants, carriages and crowds moving through it in Play.",copyLabel:"Heritage City",rail:false},
};

export default function Home() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [mode, setMode] = useState<"challenge" | "free" | "demo" | "copy">("challenge");
  /* Copy-the-build: the player is given a target and scored on how close they
     get. The scorer lives in /challenge-score.js so the builder and this page
     agree on the maths. */
  const [targets, setTargets] = useState<ChallengeTarget[]>([]);
  const [target, setTarget] = useState<ChallengeTarget | null>(null);
  const [targetBricks, setTargetBricks] = useState<unknown[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const [scoreNote, setScoreNote] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [boardSort, setBoardSort] = useState<"accuracy" | "speed">("accuracy");
  const [overall, setOverall] = useState<Overall | null>(null);
  const [overallBoard, setOverallBoard] = useState<"cleared" | "accuracy" | "speed">("cleared");
  const [ready, setReady] = useState(false);
  const [brickCount, setBrickCount] = useState(0);
  const [pieceTypes, setPieceTypes] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [demoView, setDemoView] = useState<CityView>("city");
  const [demoCity, setDemoCity] = useState<DemoWorld>("city2");
  const [plotLabel, setPlotLabel] = useState("32 × 32 starter plot");
  const [buildNote, setBuildNote] = useState("All pieces are unlocked during Early Builder Access.");
  const [copyAllowed, setCopyAllowed] = useState(true);
  const [attribution, setAttribution] = useState("");
  const [worldNotice, setWorldNotice] = useState("");
  const api = () => (frameRef.current?.contentWindow as BuilderWindow | null)?.brickforge;

  /* what the feedback widget reports alongside a note, so nobody has to
     describe where they were when something went wrong */
  useEffect(() => {
    (window as unknown as { BRICKLAB_FEEDBACK?: unknown }).BRICKLAB_FEEDBACK = {
      game: "cities",
      context: () => {
        const forge = api();
        return {
          screen: started ? "builder" : "landing",
          mode,
          bricks: forge?.bricks().length ?? 0,
          builderMode: forge?.mode() ?? null,
        };
      },
    };
  }, [started, mode]);

  useEffect(() => {
    if (!started || !ready) return;
    const timer = window.setInterval(() => {
      const forge = api();
      if (!forge) return;
      const current = forge.bricks(); setBrickCount(current.length); setPieceTypes(current.map(b => b.typeId));
      setPlaying(forge.mode() === "play");
      if (mode === "free") { const permissions = forge.townPermissions(); setCopyAllowed(permissions.copyAllowed); setAttribution(permissions.attribution); }
    }, 300);
    return () => window.clearInterval(timer);
  }, [started, ready, mode]);

  useEffect(() => {
    let voterId = window.localStorage.getItem("bricklab-voter");
    if (!voterId) { voterId = makeVoterId(); window.localStorage.setItem("bricklab-voter", voterId); }
    fetch(`/api/cities/likes?cityId=bricklab-demo&voterId=${voterId}`).then(r => r.json()).then(data => { setLikes(data.count ?? 0); setLiked(!!data.liked); }).catch(() => undefined);
  }, []);

  /* The target list is small and static; fetch it once. */
  useEffect(() => {
    fetch("/challenges/index.json")
      .then((r) => r.json())
      .then((d) => setTargets(Array.isArray(d.targets) ? d.targets : []))
      .catch(() => undefined);
    try {
      const saved = window.localStorage.getItem("bricklab-challenge-best");
      if (saved) setBest(JSON.parse(saved) as Record<string, number>);
      setPlayerName(window.localStorage.getItem("bricklab-player-name") || "");
    } catch { /* a cleared or blocked store just means no personal bests yet */ }
  }, []);

  /* The clock. It only runs while a target is live and unscored — pausing on a
     result rather than counting down behind a score the player is reading. */
  useEffect(() => {
    if (mode !== "copy" || !target || result || secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const tick = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(tick);
  }, [mode, target, result, secondsLeft]);

  const startTarget = async (choice: ChallengeTarget) => {
    setScoreNote("");
    setResult(null);
    try {
      const response = await fetch(choice.file);
      const data = await response.json();
      setTargetBricks(Array.isArray(data.bricks) ? data.bricks : []);
    } catch {
      setScoreNote("That target could not be loaded. Pick another and try again.");
      return;
    }
    setTarget(choice);
    setSecondsLeft(choice.seconds);
    setPickerOpen(false);
    setBoard(null);
    loadBoard(choice.id);
    begin("copy");
  };

  /** Dimensions come from the builder's own catalogue, so they cannot drift. */
  const pieceTable = (): Record<string, PieceType> => {
    const list = (frameRef.current?.contentWindow as BuilderWindow | null)?.brickforge?.types ?? [];
    const table: Record<string, PieceType> = {};
    list.forEach((t) => { table[t.id] = t; });
    return table;
  };

  const loadBoard = async (targetId: string, sort: "accuracy" | "speed" = boardSort) => {
    try {
      const r = await fetch(`/api/challenges/scores?target=${encodeURIComponent(targetId)}&sort=${sort}`, { cache: "no-store" });
      if (r.ok) setBoard((await r.json()) as Board);
    } catch { /* the board is a bonus; a build still scores without it */ }
  };

  const loadOverall = async (which: "cleared" | "accuracy" | "speed") => {
    setOverallBoard(which);
    try {
      const r = await fetch(`/api/challenges/board?board=${which}`, { cache: "no-store" });
      if (r.ok) setOverall((await r.json()) as Overall);
    } catch { /* rankings are a bonus; the challenges still play without them */ }
  };

  const scoreAttempt = async () => {
    const forge = api();
    const scorer = (window as unknown as { BrickLabScore?: Scorer }).BrickLabScore;
    if (!forge || !scorer || !target) { setScoreNote("The scorer is still loading. Try again in a moment."); return; }
    const attempt = (forge.exportTown?.() as { bricks?: unknown[] } | undefined)?.bricks ?? [];
    if (!attempt.length) { setScoreNote("Nothing built yet — place some pieces first."); return; }

    /* Score it here first so the number appears at once, then send the bricks
       for the server to score again. The board only ever shows the server's
       number — a score the page reports is a score anyone can type. */
    const outcome = scorer.compare(targetBricks, attempt, pieceTable());
    setResult(outcome);
    const next = { ...best, [target.id]: Math.max(best[target.id] ?? 0, outcome.score) };
    setBest(next);
    try { window.localStorage.setItem("bricklab-challenge-best", JSON.stringify(next)); } catch { /* ignore */ }

    setSubmitting(true);
    try {
      const spent = target.seconds - Math.max(0, secondsLeft ?? 0);
      const r = await fetch("/api/challenges/scores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: target.id, bricks: attempt, seconds: spent, name: playerName }),
      });
      if (r.ok) {
        const posted = (await r.json()) as { verified: ChallengeResult; rank: number; name: string };
        setResult(posted.verified);
        setScoreNote(`Ranked ${posted.rank} on this challenge.`);
        await loadBoard(target.id);
      } else {
        const problem = (await r.json().catch(() => ({}))) as { error?: string };
        setScoreNote(problem.error || "Scored on this device — the board could not be reached.");
      }
    } catch {
      setScoreNote("Scored on this device — the board could not be reached.");
    } finally {
      setSubmitting(false);
    }
  };

  const retryTarget = () => {
    if (!target) return;
    setResult(null);
    setScoreNote("");
    setSecondsLeft(target.seconds);
    const forge = api();
    if (forge) { forge.setMode("build"); forge.startHomePlot(); }
  };

  const shareTarget = async () => {
    if (!target) return;
    const link = `${window.location.origin}/?challenge=${target.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setScoreNote("Link copied. Whoever opens it gets the same target and the same clock.");
    } catch {
      setScoreNote(link);
    }
  };

  /* A shared link drops you straight into that target. */
  useEffect(() => {
    if (!targets.length || target) return;
    const wanted = new URLSearchParams(window.location.search).get("challenge");
    if (!wanted) return;
    const found = targets.find((t) => t.id === wanted);
    if (found) startTarget(found);
  }, [targets]);

  const begin = (nextMode: "challenge" | "free" | "demo" | "copy") => {
    setMode(nextMode); setStarted(true); setReady(false); setSessionKey(v => v + 1); setPanelOpen(nextMode === "challenge"); if (nextMode === "demo") { setDemoView("city"); setDemoCity("city2"); }
  };
  const beginDemo = (city: DemoWorld) => {
    setDemoCity(city); setDemoView("city"); setMode("demo"); setStarted(true); setReady(false); setSessionKey(v => v + 1); setPanelOpen(false);
  };
  const loadDemoWorld = async (city: DemoWorld, forge = api()) => {
    if (!forge) return false;
    /* Indian Heritage joined the JSON worlds when it outgrew what a hand-written
       generator inside the builder could hold. */
    const files: Partial<Record<DemoWorld, string>> = {
      royal: "/worlds/royal-palace.json",
      skyrail: "/worlds/skyrail-district.json",
      indian: "/worlds/indian-heritage-city.json",
    };
    const file = files[city];
    if (file) {
      const response = await fetch(file);
      if (!response.ok || !forge.loadShowcaseWorld(await response.json(), city)) return false;
    } else forge.setDemoCity(city);
    forge.setMode("play"); forge.setView("city");
    return true;
  };
  const onFrameLoad = () => {
    setReady(true);
    window.setTimeout(async () => {
      const forge = api();
      if (!forge) return;
      const isDemo = mode === "demo";
      if (isDemo) await loadDemoWorld(demoCity, forge);
      forge.setShowcaseMode(isDemo);
      if (mode === "challenge") { forge.setMode("build"); forge.startHomePlot(); setBrickCount(4); }
      if (mode === "copy") { forge.setMode("build"); forge.startHomePlot(); setBrickCount(0); }
      if (mode === "free") { forge.setMode("build"); if (!forge.loadLocalTown()) forge.startHomePlot(); }
    }, 120);
  };
  const resetChallenge = () => {
    const forge = api(); if (!forge) return;
    forge.setMode("build"); forge.startHomePlot(); setBrickCount(4); setPieceTypes(["p16x16","p16x16","p16x16","p16x16"]); setPlaying(false);
  };
  const countOf = (id: string) => pieceTypes.filter(t => t === id).length;
  const completed = (target: typeof missions[number]["target"]): boolean => {
    if (target === "roads") return countOf("road") + countOf("roadc") >= 5;
    if (target === "power") return countOf("gen") >= 1 && countOf("lamp") + countOf("lampb") >= 1;
    if (target === "home") return countOf("door1x4") >= 1 && pieceTypes.filter(t => t.startsWith("b") || t.startsWith("p") || t === "door1x4").length >= 12;
    return playing && missions.slice(0,3).every(item => completed(item.target));
  };
  const doneCount = missions.filter((item) => completed(item.target)).length;
  const won = doneCount === missions.length;
  const changeView = (view: CityView) => {
    setDemoView(view); api()?.setView(view); frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const changeDemoCity = async (city: DemoWorld) => {
    setDemoCity(city); setDemoView("city");
    if (!await loadDemoWorld(city)) setWorldNotice("That showcase world could not be loaded. Please try again.");
  };
  const lookRail = (yaw: number) => {
    api()?.setRailLook(yaw); frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const visit = (name: ResidentDestination) => {
    api()?.setResidentDestination(name); frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const copyDemoToTown = () => {
    const forge = api(); if (!forge) return;
    if (forge.copyDemoCity()) { forge.saveLocalTown(); setBuildNote("Your editable showcase-city copy is ready. The official demo remains unchanged."); begin("free"); }
  };
  const updateCopyPermission = (allowed: boolean) => {
    const forge = api(); if (!forge) return;
    if (forge.setTownCopyAllowed(allowed)) { setCopyAllowed(allowed); setBuildNote(allowed ? "Visitors may copy this town into their own workspace. Your original remains unchanged." : "Visitors may explore this town, but copying is disabled."); }
  };
  const addBlueprint = (name: string, label: string) => {
    if (api()?.placeBlueprint(name)) setBuildNote(`${label} added as editable pieces.`);
  };
  const expandPlot = () => {
    const label = api()?.expandHomePlot();
    if (label) { setPlotLabel(label); setBuildNote(`Plot expanded to ${label}. Your existing town was preserved.`); }
  };
  const loadLayout = (name: string, label: string) => {
    if (!window.confirm(`Start the ${label}? Save your current town first if you want to keep it.`)) return;
    if (api()?.loadWorldLayout(name)) { setPlotLabel(name === "empty" ? "32 × 32 starter plot" : "64 × 64 themed layout"); setBuildNote(`${label} loaded. Every structure can be rebuilt, recoloured or removed.`); }
  };
  const walkMyTown = () => {
    if (api()?.enterMyTownResident()) setBuildNote("Resident View is active. Click the city, then use arrow keys or WASD to walk; press E near a door.");
    frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const rideMyTrain = () => {
    if (api()?.setView("rail")) setBuildNote("Passenger view is active. Drag inside the city or use arrow keys/WASD to look in every direction.");
    else setBuildNote("Build a connected railway with a rail bogie, or add the Passenger Railway blueprint first.");
    frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const visitMyBuilding = (name: string, label: string) => {
    if (api()?.visitMyTownBuilding(name)) setBuildNote(`Resident View moved to your ${label}.`);
    else setBuildNote(`Assign a structure as ${label} first using Builder tools.`);
    frameRef.current?.focus(); frameRef.current?.contentWindow?.focus();
  };
  const saveMyTown = () => {
    const forge = api();
    if (!forge) { setBuildNote("The builder is still loading. Please try Save again."); return; }
    try { setBuildNote(forge.saveLocalTown() ? "Town saved on this device." : "Town could not be saved. Check that browser storage is available."); }
    catch { setBuildNote("Town could not be saved. Check that browser storage is available."); }
  };
  const loadSavedTown = () => {
    const forge = api();
    if (!forge) { setBuildNote("The builder is still loading. Please try Load again."); return; }
    try { setBuildNote(forge.loadLocalTown() ? "Saved town loaded." : "No valid saved town was found on this device."); }
    catch { setBuildNote("The saved town could not be loaded. Start a new plot or import a valid backup."); }
  };
  const startNewTown = () => {
    const forge = api();
    if (!forge?.startHomePlot()) { setBuildNote("A new plot could not be started. Please reload the builder and try again."); return; }
    setPlotLabel("32 × 32 starter plot"); setBuildNote("New starter plot ready.");
  };
  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    let voterId = window.localStorage.getItem("bricklab-voter");
    if (!voterId) { voterId = makeVoterId(); window.localStorage.setItem("bricklab-voter", voterId); }
    const next = !liked;
    try {
      const response = await fetch("/api/cities/likes", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({cityId:"bricklab-demo",voterId,liked:next})});
      const data = await response.json(); setLiked(!!data.liked); setLikes(data.count ?? likes);
    } finally { setLiking(false); }
  };

  if (!started) return (
    <main className="welcome-shell">
      <nav className="welcome-nav">
        <a className="logo" href="#top" aria-label="BrickLab home"><span className="logo-mark"><i/><i/><i/><i/></span><span>BrickLab</span></a>
        <div className="welcome-links" aria-label="Game modes">
          <a href="#dream-cities">Dream Cities</a>
          <a href="/frontier.html">Frontier RPG</a>
          <a href="/worldforge.html">Open World</a>
          <a href="/infinite-plots.html">Infinite Plots</a>
        </div>
        <span className="beta-pill">Early Builder Access · All pieces unlocked</span>
      </nav>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span/> Build · Learn · Play</p>
          <h1>Build your dream <em>cities.</em></h1>
          <p className="hero-lede">Build your dream city from the ground up, shape land and water, change the weather, then walk, ride and play through everything you create.</p>
          <div className="hero-actions">
            <a className="cta primary-cta" href="#game-universe">Choose your game <span>→</span></a>
            <button className="cta secondary-cta" onClick={() => { setPickerOpen(true); loadOverall(overallBoard); window.setTimeout(() => document.querySelector(".challenge-picker")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }}>Start a city challenge</button>
            <a className="cta world-cta" href="/frontier.html">Play Frontier RPG</a>
            <a className="cta world-cta" href="/worldforge.html">Enter the Open World</a>
          </div>
          <div className="trust-row"><span><b>01</b> Pick a piece</span><span><b>02</b> Build anything</span><span><b>03</b> Press play</span></div>
        </div>
        <div className="hero-city-visual" aria-hidden="true">
          <img src="/shots/cities-hero.webp" alt=""/>
          <div className="hero-city-shade"/>
          <div className="hero-world-chip"><span>Live showcase</span><strong>Metro City 2</strong><small>Captured in the live builder</small></div>
          <div className="hero-feature feature-rail"><b>01</b><span>Passenger railway</span></div>
          <div className="hero-feature feature-build"><b>02</b><span>Every piece editable</span></div>
          <div className="hero-feature feature-walk"><b>03</b><span>Walk inside your world</span></div>
        </div>
      </section>
      {pickerOpen && (
        <section className="challenge-picker" aria-labelledby="challenge-picker-title">
          <div className="challenge-picker-head">
            <div>
              <p className="eyebrow"><span/> City challenge</p>
              <h2 id="challenge-picker-title">Pick your challenge.</h2>
            </div>
            <button className="challenge-close" onClick={() => setPickerOpen(false)} aria-label="Close the challenge picker">×</button>
          </div>
          <div className="challenge-grid">
            <article className="challenge-card challenge-card-free">
              <span className="challenge-kind">Build &amp; share</span>
              <h3>Build anything</h3>
              <p>No target and no clock. Build what you like with every piece unlocked, publish it, and collect likes from anyone who visits.</p>
              <button onClick={() => { setPickerOpen(false); begin("free"); }}>Open free build →</button>
            </article>
            {targets.map((t) => (
              <article className="challenge-card" key={t.id}>
                <div className="challenge-art">
                  <img src={t.image} alt={`${t.name} — the structure to copy`} loading="lazy"/>
                  <span className="challenge-diff" aria-label={`Difficulty ${t.difficulty} of 5`}>
                    {"●".repeat(t.difficulty)}<i>{"●".repeat(5 - t.difficulty)}</i>
                  </span>
                </div>
                <span className="challenge-kind">Copy the build</span>
                <h3>{t.name}</h3>
                <p>{t.brief}</p>
                <div className="challenge-meta">
                  <span>{t.pieces} pieces</span>
                  <span>{Math.round(t.seconds / 60)} min</span>
                  {best[t.id] !== undefined && <span className="challenge-best">Best {best[t.id]}%</span>}
                </div>
                <button onClick={() => startTarget(t)}>Start this challenge →</button>
              </article>
            ))}
          </div>
          <section className="rankings" aria-labelledby="rankings-title">
            <div className="rankings-head">
              <h3 id="rankings-title">Rankings</h3>
              <div className="rankings-tabs">
                {([
                  ["cleared", "Most cleared"],
                  ["accuracy", "Most accurate"],
                  ["speed", "Fastest"],
                ] as const).map(([key, label]) => (
                  <button key={key} className={overallBoard === key ? "on" : ""} onClick={() => loadOverall(key)}>{label}</button>
                ))}
              </div>
            </div>
            <p className="rankings-rule">
              {overallBoard === "cleared" && `How many of the ${overall?.targetCount ?? targets.length} structures you have taken to ${overall?.clearAt ?? 90}% or better.`}
              {overallBoard === "accuracy" && `Your average best score across the challenges you have tried. ${overall?.minForAverage ?? 3} challenges to appear.`}
              {overallBoard === "speed" && `Average time per structure cleared — ranked per structure, not on total time, so clearing more never counts against you.`}
            </p>
            {overall && overall.items.length > 0 ? (
              <ol className="rankings-list">
                {overall.items.slice(0, 10).map((row) => (
                  <li key={`${row.rank}-${row.name}`} className={row.you ? "you" : ""}>
                    <b>{row.rank}</b>
                    <span>{row.name}{row.you ? " · you" : ""}</span>
                    <em>
                      {overallBoard === "cleared" && `${row.value} cleared`}
                      {overallBoard === "accuracy" && `${row.value}%`}
                      {overallBoard === "speed" && `${Math.floor(row.value / 60)}:${String(Math.round(row.value) % 60).padStart(2, "0")}`}
                    </em>
                    <small>
                      {overallBoard === "cleared" && `${row.extra} tried`}
                      {overallBoard === "accuracy" && `${row.extra} challenges`}
                      {overallBoard === "speed" && `${row.extra} cleared`}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rankings-empty">
                Nobody is on this board yet. Score a challenge and you will be.
              </p>
            )}
            {overall?.you && !overall.you.listed && (
              <p className="rankings-empty">
                You are not on this board yet —{" "}
                {overallBoard === "cleared" && `${overall.you.value} cleared so far.`}
                {overallBoard === "accuracy" && `${overall.you.value}% average over ${overall.you.extra}; ${overall.minForAverage ?? 3} needed.`}
                {overallBoard === "speed" && `${overall.you.extra} cleared; ${overall.minForAverage ?? 3} needed.`}
              </p>
            )}
          </section>

          <p className="challenge-foot">
            Scoring is shape first: the silhouette is the headline number, with the right piece and the right colour
            adding on top. Build it rotated or a few studs across and it still counts — the floor is ignored, so build up.
          </p>
        </section>
      )}
      <section className="game-universe" id="game-universe" aria-labelledby="game-universe-title">
        <div className="universe-heading">
          <p className="eyebrow"><span/> Four connected ways to play</p>
          <h2 id="game-universe-title">Build. Adventure. Compete.</h2>
          <p>Each BrickLab game has a clear purpose. Your creations can eventually move between them without turning every experience into the same game.</p>
        </div>
        <div className="universe-grid">
          <article className="universe-card cities-card" id="dream-cities">
            <div className="universe-topline"><span>Creative competition</span><b>Alpha</b></div>
            <strong className="universe-number">01</strong>
            <h3>Build Your Dream Cities</h3>
            <p>Create towns and landmark worlds, enter solo or team build challenges, publish finished cities and earn community likes.</p>
            <ul><li>Guided and free building live</li><li>Showcase worlds live</li><li>Team contests, rankings and publishing next</li></ul>
            <div className="universe-actions"><button onClick={() => begin("free")}>Build a city</button><a href="#world-gallery-title">Explore demos</a></div>
          </article>
          <article className="universe-card frontier-card">
            <div className="universe-topline"><span>Settlement RPG</span><b>Playable</b></div>
            <strong className="universe-number">02</strong>
            <h3>BrickLab Frontier</h3>
            <p>Play as a frontier builder: explore a finite wilderness, mine resources, survive creatures, complete quests and grow a settlement.</p>
            <ul><li>Mining, crafting and survival live</li><li>Quests, XP, levels and rewards live</li><li>Settlers, stories and co-op expeditions next</li></ul>
            <div className="universe-actions"><a className="primary-link" href="/frontier.html">Begin the RPG →</a></div>
          </article>
          <article className="universe-card plots-card">
            <div className="universe-topline"><span>Persistent build league</span><b>Alpha</b></div>
            <strong className="universe-number">03</strong>
            <h3>Infinite Plots</h3>
            <p>Claim a fair restricted plot inside a continuous world, import a Frontier structure and compete without neighbours overwriting your work.</p>
            <ul><li>Plot claiming and restricted building live</li><li>Open World build import live</li><li>Friends access, seasons and judging next</li></ul>
            <div className="universe-actions"><a className="primary-link" href="/infinite-plots.html">Claim a plot →</a></div>
          </article>
          <article className="universe-card openworld-card">
            <div className="universe-topline"><span>AI builders &amp; expeditions</span><b>Playable</b></div>
            <strong className="universe-number">04</strong>
            <h3>Open World</h3>
            <p>Occupy a plot and a named AI builder joins you and raises the whole structure while you watch. No combat, no hunger — the frontier is finite, and you buy more of it.</p>
            <ul><li>Twelve claimable plots with AI builders live</li><li>Timed Frontier Gate expeditions live</li><li>Export any build straight into Infinite Plots</li></ul>
            <div className="universe-actions"><a className="primary-link" href="/worldforge.html">Enter the Open World →</a></div>
          </article>
        </div>
        <p className="universe-roadmap"><b>One BrickLab identity, four game loops.</b> Accounts, teams, likes and seasonal competitions will connect them in a later online release.</p>
      </section>
      <section className="world-showcase" aria-labelledby="world-gallery-title">
        <div className="world-showcase-head"><div><p className="eyebrow"><span/> Official showcase worlds</p><h2 id="world-gallery-title">Choose a world. Then build your own.</h2></div><p>Explore working cities today and preview the heritage worlds joining BrickLab next. Every world is designed to become an explorable, piece-by-piece build.</p></div>
        <div className="world-gallery">
          {showcaseWorlds.map((world,index) => <article key={world.id} className={`world-card ${world.playable?"playable":"coming"} world-${world.accent}`}>
            <div className={`world-card-art ${world.image ? "" : "world-card-art-empty"}`}>{world.image ? <img src={world.image} alt={`${world.title}, captured in the BrickLab builder`} loading={index < 2 ? "eager" : "lazy"}/> : <span className="world-card-soon" aria-hidden="true">Not built yet</span>}<span className="world-status">{world.playable?"Live demo":"Coming soon"}</span><span className="world-number">{String(index+1).padStart(2,"0")}</span></div>
            <div className="world-card-copy"><small>{world.era}</small><h3>{world.title}</h3><p>{world.description}</p>{world.playable ? <button onClick={() => beginDemo(world.id as DemoWorld)}>Explore this city <span>→</span></button> : <button className="preview-button" onClick={() => setWorldNotice(`${world.title} is now in the BrickLab build roadmap. Its complete explorable demo will be added here when it is ready.`)}>Select this world <span>＋</span></button>}</div>
          </article>)}
        </div>
        {worldNotice && <div className="world-notice" role="status"><span>World selected</span><p>{worldNotice}</p><button onClick={() => setWorldNotice("")} aria-label="Close world message">×</button></div>}
        <div className="world-gallery-footer"><strong>More worlds will keep arriving.</strong><span>Village life · futuristic cities · island towns · mountain settlements · fantasy kingdoms</span></div>
      </section>
      <section className="mode-grid" aria-label="How BrickLab grows">
        <article><span className="mode-number">01</span><h2>Create</h2><p>Learn with guided builds, then use the complete builder library to make original cities, palaces, transport and working systems.</p><button onClick={() => begin("challenge")}>Start city school →</button></article>
        <article><span className="mode-number">02</span><h2>Adventure</h2><p>Enter Frontier as a playable builder, complete quests, level up and turn gathered materials into a living settlement.</p><a href="/frontier.html">Play the RPG →</a></article>
        <article><span className="mode-number">03</span><h2>Compete</h2><p>Claim protected land and prepare for themed solo, family, 1v1 and team build leagues with fair plot limits.</p><a href="/infinite-plots.html">Enter Infinite Plots →</a></article>
      </section>
      <footer>BrickLab is an original building and adventure game universe. It is not affiliated with the LEGO Group or any other block-building game.</footer>
    </main>
  );

  return (
    <main className="builder-shell">
      <header className="app-header">
        <button className="logo logo-button" onClick={() => setStarted(false)}><span className="logo-mark"><i/><i/><i/><i/></span><span>BrickLab</span></button>
        <div className="app-mode"><span className={mode === "demo" ? "active" : ""}>Showcase Worlds</span><span>•</span><span className={mode === "challenge" ? "active" : ""}>Guided build</span><span>•</span><span className={mode === "free" ? "active" : ""}>Free build</span><span>•</span><span className={mode === "copy" ? "active" : ""}>City challenge</span></div>
        <div className="header-actions"><button onClick={() => begin(mode === "free" ? "demo" : "free")}>Switch mode</button>{mode === "challenge" && <button onClick={resetChallenge}>Restart</button>}</div>
      </header>
      <section className="workspace">
        <iframe key={sessionKey} ref={frameRef} className="builder-frame" src={`/brickforge.html?engine=builder-library-v5&session=${sessionKey}`} title="BrickLab 3D building canvas" onLoad={onFrameLoad}/>
        <TownBar getApi={() => api()} ready={ready}/>
        {mode === "challenge" && <aside className={`mission-panel ${panelOpen ? "open" : "closed"}`}>
          <button className="panel-toggle" onClick={() => setPanelOpen(v => !v)} aria-label="Toggle mission panel">{panelOpen ? "×" : "☰"}</button>
          {panelOpen && <>
            <div className="mission-head"><p>City school</p><h2>{won ? "Neighbourhood live!" : "Your first neighbourhood"}</h2><div className="progress-track"><span style={{width:`${doneCount * 25}%`}}/></div><small>{doneCount} of 4 steps complete</small></div>
            {won ? <div className="win-card"><div className="trophy">★</div><h3>Your town is alive!</h3><p>You placed {brickCount} pieces and activated your first working neighbourhood.</p><button onClick={() => begin("free")}>Expand it in free build →</button><button className="quiet" onClick={resetChallenge}>Try again</button></div> :
              <ol className="mission-list">{missions.map((item,index) => { const isDone=completed(item.target); const isCurrent=index===doneCount; return <li key={item.title} className={`${isDone?"done":""} ${isCurrent?"current":""}`}><span className="step-dot">{isDone?"✓":index+1}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></li>; })}</ol>}
            <div className="live-stat"><span>Pieces placed</span><strong>{brickCount}</strong></div>
          </>}
        </aside>}
        {mode === "copy" && target && <aside className="copy-panel">
          <p>City challenge</p>
          <h2>{target.name}</h2>
          <span className="live-badge">● COPY THE BUILD</span>
          <div className="copy-reference">
            <img src={target.image} alt={`${target.name} — the structure to copy`}/>
            <small>Build this. Rotation and position do not matter.</small>
          </div>
          <p className="demo-summary">{target.brief}</p>

          {!result && (
            <div className={`copy-clock ${secondsLeft !== null && secondsLeft <= 30 ? "urgent" : ""}`}>
              <span>Time left</span>
              <strong>
                {secondsLeft === null ? "–" :
                  `${Math.floor(Math.max(0, secondsLeft) / 60)}:${String(Math.max(0, secondsLeft) % 60).padStart(2, "0")}`}
              </strong>
              {secondsLeft !== null && secondsLeft <= 0 && <small>Time is up — score it and see how you did.</small>}
            </div>
          )}

          {result && (
            <div className="copy-result">
              <div className="copy-score"><b>{result.score}%</b><span>match</span></div>
              <div className="copy-bars">
                <div><span>Shape</span><i><em style={{width:`${result.shape}%`}}/></i><b>{result.shape}%</b></div>
                <div><span>Right piece</span><i><em style={{width:`${result.pieceMatch}%`}}/></i><b>{result.pieceMatch}%</b></div>
                <div><span>Right colour</span><i><em style={{width:`${result.colourMatch}%`}}/></i><b>{result.colourMatch}%</b></div>
              </div>
              <p className="copy-detail">
                You matched {result.shared} of {result.targetCells} cells.
                {result.missing > 0 && ` ${result.missing} still missing.`}
                {result.extra > 0 && ` ${result.extra} extra that the target does not have.`}
                {result.rotation > 0 && ` Scored with your build turned ${result.rotation}°.`}
              </p>
              {best[target.id] !== undefined && <p className="copy-detail">Your best on this target: <b>{best[target.id]}%</b></p>}
            </div>
          )}

          {scoreNote && <div className="unlock-note">{scoreNote}</div>}

          <label className="copy-name">
            <span>Name on the board</span>
            <input
              type="text" maxLength={24} value={playerName} placeholder="Builder"
              onChange={(e) => {
                setPlayerName(e.target.value);
                try { window.localStorage.setItem("bricklab-player-name", e.target.value); } catch { /* ignore */ }
              }}
            />
          </label>

          {board && (
            <div className="copy-board">
              <div className="copy-board-head">
                <h3>Leaderboard</h3>
                <div className="copy-board-tabs">
                  {(["accuracy", "speed"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={boardSort === mode ? "on" : ""}
                      onClick={() => { setBoardSort(mode); if (target) loadBoard(target.id, mode); }}
                    >
                      {mode === "accuracy" ? "Best %" : "Fastest"}
                    </button>
                  ))}
                </div>
              </div>
              {board.items.length === 0 && (
                <p className="copy-detail">
                  {boardSort === "speed"
                    ? "Nobody has cleared this one yet. Reach 90% and your time goes on the board."
                    : "No scores yet. Yours will be the first."}
                </p>
              )}
              <ol>
                {board.items.slice(0, 8).map((row) => (
                  <li key={`${row.rank}-${row.name}`} className={row.you ? "you" : ""}>
                    <b>{row.rank}</b>
                    <span>{row.name}{row.you ? " · you" : ""}</span>
                    {boardSort === "speed"
                      ? <>
                          <em>{row.seconds === null ? "–" : `${Math.floor(row.seconds / 60)}:${String(row.seconds % 60).padStart(2, "0")}`}</em>
                          <small>{row.score}%</small>
                        </>
                      : <>
                          <em>{row.score}%</em>
                          {row.seconds !== null && <small>{Math.floor(row.seconds / 60)}:{String(row.seconds % 60).padStart(2, "0")}</small>}
                        </>}
                  </li>
                ))}
              </ol>
              {board.you && board.you.rank > 8 && (
                <p className="copy-detail">You are {board.you.rank}th with {board.you.score}%.</p>
              )}
              <small>
                {boardSort === "speed"
                  ? "Fastest run that reached 90%. Recalculated on the server from the pieces you placed."
                  : "Every score here was recalculated on the server from the pieces you placed."}
              </small>
            </div>
          )}

          <div className="view-buttons town-actions">
            {!result && <button className="copy-primary" onClick={scoreAttempt} disabled={submitting}>{submitting ? "Scoring…" : "Score my build"}</button>}
            {result && <button className="copy-primary" onClick={retryTarget}>Try again</button>}
            <button onClick={shareTarget}>Challenge a friend</button>
            <button onClick={() => { setTarget(null); setResult(null); setStarted(false); setPickerOpen(true); }}>Pick another</button>
          </div>
          <p className="copy-rules">
            Shape is the headline number; the right piece and the right colour add on top. The floor is ignored, so build up.
          </p>
        </aside>}
        {mode === "demo" && <aside className="demo-panel">
          <p>Official showcase</p><h2>{demoDetails[demoCity].title}</h2><span className="live-badge read-only-badge">● READ-ONLY OFFICIAL DEMO</span>
          <div className="city-selector">{(["royal","skyrail","city1","city2","indian"] as DemoWorld[]).map(city => <button key={city} className={demoCity === city ? "selected" : ""} onClick={() => changeDemoCity(city)}>{demoDetails[city].selector}</button>)}</div>
          <p className="demo-summary">{demoDetails[demoCity].summary}</p>
          <div className="view-buttons"><button className={demoView==="tour"?"selected":""} onClick={() => changeView("tour")}>✦ Guided tour</button><button className={demoView==="city"?"selected":""} onClick={() => changeView("city")}>⌂ City view</button><button className={demoView==="resident"?"selected":""} onClick={() => changeView("resident")}>♟ Resident view</button>{demoDetails[demoCity].rail && <button className={demoView==="rail"?"selected":""} onClick={() => changeView("rail")}>▰ Railway ride</button>}{demoCity !== "royal" && demoCity !== "skyrail" && <button className={demoView==="inspect"?"selected":""} onClick={() => changeView("inspect")}>▤ How it was built</button>}</div>
          {demoView === "resident" && <div className="walk-help"><span>Walk & enter</span><div><kbd>↑</kbd><br/><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div><small>Move and turn · <kbd>E</kbd> opens doors</small>{demoCity === "indian" ? <div className="destination-buttons"><button onClick={() => visit("palace")}>Royal Palace</button><button onClick={() => visit("bazaar")}>Bazaar</button><button onClick={() => visit("temple")}>Temple</button><button onClick={() => visit("stepwell")}>Stepwell</button><button onClick={() => visit("ghats")}>River Ghats</button><button onClick={() => visit("home")}>Haveli Home</button></div> : demoCity === "city1" || demoCity === "city2" ? <div className="destination-buttons"><button onClick={() => visit("home")}>Show Home</button><button onClick={() => visit("restaurant")}>Restaurant</button><button onClick={() => visit("hotel")}>Hotel</button></div> : <small>Walk freely around this build. Copy it to My Town to add opening doors, interiors and assigned destinations.</small>}</div>}
          {demoView === "rail" && <div className="walk-help"><span>Look around</span><div className="rail-look-buttons"><button onClick={() => lookRail(Math.PI/2)}>← Left</button><button onClick={() => lookRail(0)}>Forward</button><button onClick={() => lookRail(-Math.PI/2)}>Right →</button></div><small>Drag inside the city or use arrow keys/WASD to look in any direction.</small></div>}
          <div className="demo-facts"><span><b>{brickCount}</b> pieces</span><span><b>10</b> city experiences</span></div>
          <button className={`like-button wide-like ${liked?"liked":""}`} onClick={toggleLike} disabled={liking} aria-pressed={liked}>♥ <strong>{likes}</strong> {liked?"You like this city":"Like this city"}</button>
          <button className="build-own" onClick={copyDemoToTown}>Copy {demoDetails[demoCity].copyLabel} to My Town →</button>
        </aside>}
        {mode === "free" && <aside className="free-panel">
          <p>My Town</p><h2>Your world</h2><span className="live-badge">● ALL PIECES UNLOCKED</span>
          <p className="demo-summary">Build side by side with every piece unlocked. Follow layer-by-layer guides, create reusable structures, assign each building a real purpose, then walk through your town as a resident.</p>
          <div className="unlock-note">{buildNote}</div>
          <h3 className="panel-label">Blueprint library</h3>
          <div className="blueprint-grid"><button onClick={() => addBlueprint("home","Home")}>⌂ Home</button><button onClick={() => addBlueprint("tower","Tower")}>▥ Tower</button><button onClick={() => addBlueprint("park","Park")}>♣ Park</button><button onClick={() => addBlueprint("station","Station")}>▰ Station</button><button onClick={() => addBlueprint("utility","Utility hub")}>⚡ Utility</button><button onClick={() => addBlueprint("bridge","Bridge")}>≈ Bridge</button><button className="blueprint-wide" onClick={() => addBlueprint("train","Passenger Railway")}>▰ Passenger Railway + Train</button></div>
          <h3 className="panel-label">World layouts</h3>
          <div className="layout-grid"><button onClick={() => loadLayout("riverside","Riverside Town")}>≈ Riverside</button><button onClick={() => loadLayout("japanese","Japanese Castle Town")}>城 Japanese</button><button onClick={() => loadLayout("indian","Indian Heritage Town")}>◈ Indian</button><button onClick={() => loadLayout("chinese","Chinese Walled City")}>門 Chinese</button><button onClick={() => loadLayout("medieval","European Medieval Town")}>♜ Medieval</button><button onClick={() => loadLayout("empty","Empty Grid")}>□ Empty grid</button></div>
          <h3 className="panel-label">Climate</h3>
          <div className="weather-grid"><button onClick={() => api()?.setWeather("clear")}>☀ Clear</button><button onClick={() => api()?.setWeather("rain")}>☂ Rain</button><button onClick={() => api()?.setWeather("snow")}>❄ Snow</button><button onClick={() => api()?.setWeather("fog")}>≋ Fog</button></div>
          <h3 className="panel-label">Experience My Town</h3>
          <div className="view-buttons town-actions"><button onClick={walkMyTown}>♟ Walk My Town</button><button onClick={rideMyTrain}>▰ Railway Ride</button></div>
          <div className="rail-look-buttons my-town-rail-look"><button onClick={() => lookRail(Math.PI/2)}>← Look left</button><button onClick={() => lookRail(0)}>Forward</button><button onClick={() => lookRail(-Math.PI/2)}>Look right →</button></div>
          <div className="destination-buttons my-town-destinations"><button onClick={() => visitMyBuilding("home","home")}>Home</button><button onClick={() => visitMyBuilding("restaurant","restaurant")}>Restaurant</button><button onClick={() => visitMyBuilding("hotel","hotel")}>Hotel</button><button onClick={() => visitMyBuilding("shop","shop")}>Shop</button><button onClick={() => visitMyBuilding("school","school")}>School</button><button onClick={() => visitMyBuilding("hospital","hospital")}>Hospital</button><button onClick={() => visitMyBuilding("palace","palace")}>Palace</button><button onClick={() => visitMyBuilding("temple","temple")}>Temple</button><button onClick={() => visitMyBuilding("station","station")}>Station</button></div>
          <div className="plot-card"><small>Current layout</small><b>{plotLabel}</b><button onClick={expandPlot}>＋ Expand plot free</button></div>
          <div className="view-buttons town-actions"><button onClick={saveMyTown}>▣ Save My Town</button><button onClick={loadSavedTown}>↻ Load saved town</button><button onClick={startNewTown}>□ New empty plot</button><button onClick={() => addBlueprint("home","Show Home")}>⌂ Add Show Home</button></div>
          <div className="town-owner"><b>Town owner</b><span>You · Admin</span>{attribution && <small>Based on {attribution}. Attribution stays with copied towns.</small>}<small>Choose whether visitors can make an independent copy. Nobody can edit your original without permission.</small><div className="permission-buttons"><button className={copyAllowed ? "selected" : ""} onClick={() => updateCopyPermission(true)}>Allow copying</button><button className={!copyAllowed ? "selected" : ""} onClick={() => updateCopyPermission(false)}>View only</button></div></div>
        </aside>}
        {!ready && <div className="loading-card"><span className="loader"/>Preparing your workbench…</div>}
      </section>
    </main>
  );
}
