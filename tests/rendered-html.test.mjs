import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("produces a Cloudflare-compatible worker artifact", async () => {
  const worker = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(worker, /var worker_entry_default = \{ async fetch\(request, env, ctx\)/);
  assert.match(worker, /export \{ worker_entry_default as default \}/);
});

test("showcase state sync cannot repeatedly reset live traffic", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const engine = await readFile(new URL("../public/brickforge.html", import.meta.url), "utf8");

  assert.equal(
    page.match(/setShowcaseMode\(/g)?.length,
    1,
    "setShowcaseMode should run only once during frame startup",
  );
  assert.match(page, /brickforge\.html\?engine=builder-library-v5/);
  assert.match(engine, /const lockChanged = showcaseLocked !== nextLocked;/);
  assert.match(engine, /if \(lockChanged && mode === 'play'\) buildPhysics\(\);/);
  assert.match(engine, /Official Metro City is view only/);
  assert.match(engine, /function copyDemoCity\(\)/);
  assert.match(engine, /function setTownCopyAllowed\(allowed\)/);
  assert.match(engine, /function setResidentDestination\(name\)/);
  assert.match(engine, /glassdoor1x4/);
  assert.match(engine, /function setDemoCity\(name\)/);
  assert.match(engine, /function demoCity2\(\)/);
  assert.match(engine, /function demoIndianCity\(\)/);
  assert.match(engine, /indianSnapshot/);
  assert.match(engine, /Indian Heritage City loaded/);
  assert.match(engine, /id:'horse'/);
  assert.match(engine, /id:'elephant'/);
  assert.match(engine, /function demoIndianCity\(\)/);
  assert.match(engine, /palaceWing/);
  assert.match(engine, /palaceWing\(-42,50,ORG,RED,3\)/);
  assert.match(engine, /domeTower\(0,54,WHT,ORG,4\)/);
  assert.match(engine, /\[-84,-76\].*put\('horse'/s);
  assert.match(engine, /\[-68,-76\].*put\('elephant'/s);
  assert.match(engine, /cam\.radius = activeDemoCity === 'indian' \? 190/);
  assert.match(engine, /id:'resident'/);
  assert.match(engine, /id:'merchant'/);
  assert.match(engine, /id:'palaceGuard'/);
  assert.match(engine, /South Gate — walk throughout Heritage City/);
  assert.match(engine, /palace: \{p:/);
  assert.match(page, /Royal Palace/);
  assert.match(page, /River Ghats/);
  assert.match(engine, /function selectConnectedStructure\(\)/);
  assert.match(engine, /function transformSelection\(kind, amount\)/);
  assert.match(engine, /function duplicateSelection\(\)/);
  assert.match(engine, /function saveSelectionBlueprint\(\)/);
  assert.match(engine, /function handleBuildToolClick\(\)/);
  assert.match(engine, /data-fast-tool="road"/);
  assert.match(engine, /data-fast-tool="water"/);
  assert.match(engine, /function guidedLayers\(name\)/);
  assert.match(engine, /function assignBuildingPurpose\(\)/);
  assert.match(engine, /function enterMyTownResident\(\)/);
  assert.match(engine, /function visitMyTownBuilding\(use\)/);
  assert.match(engine, /use: b\.use \|\| ''/);
  assert.match(page, /layer-by-layer guides/);
  assert.match(page, /Walk My Town/);
  assert.match(engine, /const stableStructure = showcaseLocked \|\| personalTownMode \|\| allRoad/);
  assert.match(engine, /Passenger Railway placed/);
  assert.match(page, /Passenger Railway \+ Train/);
  assert.match(page, /Railway Ride/);
  assert.match(page, /Royal Palace Complex/);
  assert.match(page, /Skyrail District/);
  assert.match(engine, /function loadShowcaseWorld\(data, name\)/);
  assert.match(engine, /function safeWorldBricks\(d\)/);
  assert.match(engine, /id="pieceSearch"/);
  assert.match(engine, /Interior & furniture/);
  assert.match(engine, /Restaurant & hotel/);
  assert.match(engine, /Construction site/);
  assert.match(engine, /Utilities & water/);
  assert.match(engine, /Miscellaneous/);
});

test("landing page presents the visual dream-city gallery", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Build your dream/);
  assert.match(page, /hero-city-visual/);
  // the hero chip now credits the capture rather than listing the verbs
  assert.match(page, /Captured in the live builder/);
  assert.match(page, /shots\/cities-hero\.webp/);
  assert.match(page, /Metro City 1/);
  assert.match(page, /Metro City 2/);
  assert.match(page, /Indian Heritage City/);
  assert.match(page, /Indian · Heritage/);
  assert.match(page, /Japanese Castle Town/);
  assert.match(page, /Chinese Walled City/);
  assert.match(page, /European Medieval City/);
  assert.match(page, /Ancient Ruins/);
  assert.match(page, /Ancient Temple City/);
  assert.match(page, /Pyramid Kingdom/);
  assert.match(page, /Jungle Pyramid City/);
  assert.match(page, /Classical Empire/);
  assert.match(page, /beginDemo\(world\.id/);
});

test("open world is a separate playable creative mode", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const world = await readFile(new URL("../public/worldforge.html", import.meta.url), "utf8");

  assert.match(page, /Play Frontier RPG/);
  assert.match(page, /href="\/frontier\.html"/);
  assert.match(world, /BrickLab Frontier/);
  assert.match(world, /function generate\(\)/);
  assert.match(world, /function gatherBlock\(\)/);
  assert.match(world, /function placeBlock\(\)/);
  assert.match(world, /bricklab-frontier-slot-/);
  assert.match(world, /requestPointerLock/);
  assert.match(world, /touchMode/);
  assert.match(world, /Open World menu/);
  assert.match(world, /Builder 01 · First-person/);
  assert.match(world, /Frontier rules/);
  assert.match(world, /Resume (?:frontier|free play)/);
  assert.match(world, /function showPanel/);
  assert.match(world, /finite frontier/i);
  assert.match(world, /Left-click \/ F/);
  assert.match(world, /Safe respawn/);
  assert.match(world, /const ghostMaterial=/);
  assert.match(world, /function toggleCamera/);
  assert.match(world, /function renderInventory/);
  assert.match(world, /function craft/);
  assert.match(world, /function expand/);
  assert.match(world, /function settlementStage/);
  assert.match(world, /AI resident/);
  assert.match(world, /Mira/);
  assert.match(world, /Arun/);
  assert.match(world, /Leela/);
  assert.match(world, /leftLeg\.rotation\.x=walk/);
  assert.match(world, /Start 3-minute local build challenge/);
  assert.match(world, /if\(e\.button===0\)placeBlock\(\)/);
  assert.match(world, /if\(e\.button===2\)gatherBlock\(\)/);
  assert.match(world, /-Math\.sin\(player\.yaw\)\*f/);
  assert.match(world, /-Math\.cos\(player\.yaw\)\*f/);
  assert.match(world, /First Frontier/);
  assert.match(world, /id="guidedStart"/);
  assert.match(world, /function startGuidedGame/);
  assert.match(world, /function checkMission/);
  assert.match(world, /function talkToResident/);
  assert.match(world, /interactedResident/);
  assert.match(world, /Press I to open the Backpack/);
  assert.match(world, /tutorialActive,tutorialStep/);
  assert.match(world, /Frontier Gate · Shattered Isles/);
  assert.match(world, /function buildExpeditionZone/);
  assert.match(world, /function enterExpedition/);
  assert.match(world, /function returnExpedition/);
  assert.match(world, /function expeditionLoad/);
  assert.match(world, /Pack 0 \/ 24/);
  assert.match(world, /OW 11/);
  assert.match(world, /1v1, 2v2 and team resource races/);
  assert.match(world, /Shattered Isles/);
  assert.match(world, /function setExpeditionVisibility/);
  assert.match(world, /function buildIsland/);
  assert.match(world, /function buildMiningOutpost/);
  assert.match(world, /function buildForestLodge/);
  assert.match(world, /function buildRuinTemple/);
  assert.match(world, /function buildCrystalObservatory/);
  assert.match(world, /function buildExtractionPavilion/);
  assert.match(world, /function buildNeighbourSettlements/);
  assert.match(world, /function buildNorthWorkshop/);
  assert.match(world, /function buildWestWatchtower/);
  assert.match(world, /function buildSouthHall/);
  assert.match(world, /function buildNeighbourHouse/);
  assert.match(world, /eight-direction outer settlement ring/);
  assert.match(world, /function buildDistantAICitadel/);
  assert.match(world, /function buildCitadelTower/);
  assert.match(world, /Aurora Guild Citadel/);
  assert.match(world, /map-landmark citadel/);
  assert.match(world, /const claimSites=/);
  assert.match(world, /function claimSite/);
  assert.match(world, /function updateClaimPrompt/);
  assert.match(world, /function updateAIConstruction/);
  assert.match(world, /function buildOuterSettlementRing/);
  assert.match(world, /function buildRoadLine/);
  assert.match(world, /function buildSkyglassHouse/);
  assert.match(world, /function buildMarketPavilion/);
  assert.match(world, /function buildWindmillWorkshop/);
  assert.match(world, /function buildHarbourHall/);
  assert.match(world, /function buildGardenGlasshouse/);
  assert.match(world, /function buildStoneKeep/);
  assert.match(world, /function buildOuterObservatory/);
  assert.match(world, /function cyclePlotAccess/);
  assert.match(world, /Private, Friends and Public access/);
  assert.match(world, /local access prototype/);
  assert.match(world, /v:8/);
  assert.match(world, /function spawnClaimedBuilders/);
  assert.match(world, /Press E to occupy/);
  assert.match(world, /claimedSites,claimState/);
  assert.match(world, /OW 12\.5/);
  assert.match(world, /Procedural chunk streaming/);
  assert.match(world, /Mining Isle · Outpost/);
  assert.match(world, /Crystal Isle · Observatory/);
  assert.match(world, /zone:'expedition'/);
  assert.match(world, /function resetExpeditionZone/);
  assert.match(world, /relic:true/);
  assert.match(world, /Ancient Gate Arch/);
  assert.match(world, /function placeAncientArch/);
  assert.match(world, /Recovered blueprints/);
  assert.match(world, /OW 12/);
});

test("infinite plots is a separate empty restricted-building mode", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const plots = await readFile(new URL("../public/infinite-plots.html", import.meta.url), "utf8");
  const world = await readFile(new URL("../public/worldforge.html", import.meta.url), "utf8");

  assert.match(page, /Claim a plot/);
  assert.match(page, /href="\/infinite-plots\.html"/);
  assert.match(plots, /BrickLab Infinite Plots/);
  assert.match(plots, /Empty World Alpha/);
  assert.match(plots, /const PLOT=48,CELL=54/);
  assert.match(plots, /function claimCurrent/);
  assert.match(plots, /function inside/);
  assert.match(plots, /Restricted plot boundary/);
  assert.match(plots, /function updateGuides/);
  assert.match(plots, /function cycleAccess/);
  assert.match(plots, /bricklab-infinite-plots/);
  assert.match(plots, /Nearby plot guides stream as you travel/);
  assert.match(plots, /Online enforcement requires accounts/);
  assert.match(plots, /Play Open World Alpha/);
  assert.match(plots, /href="\/worldforge\.html"/);
  assert.match(plots, /Saved plot expanded safely to 48 × 48/);
  assert.match(plots, /Paste Open World build/);
  assert.match(plots, /function importOpenWorldBuild/);
  assert.match(plots, /function defaultOpenWorldStructure/);
  assert.match(plots, /Open World North Workshop/);
  assert.match(plots, /bricklab-open-world-structure/);
  assert.match(world, /Copy build to plot/);
  assert.match(world, /function copyBuildToEmptyPlot/);
  assert.match(world, /playerBuilt/);
});

test("Sprint 1 controls recover safely and save feedback is truthful", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const engine = await readFile(new URL("../public/brickforge.html", import.meta.url), "utf8");
  const world = await readFile(new URL("../public/worldforge.html", import.meta.url), "utf8");
  const plots = await readFile(new URL("../public/infinite-plots.html", import.meta.url), "utf8");

  assert.match(page, /const saveMyTown = \(\) =>/);
  assert.match(page, /No valid saved town was found on this device/);
  assert.match(page, /onClick=\{saveMyTown\}/);
  assert.match(page, /onClick=\{loadSavedTown\}/);
  assert.match(engine, /addEventListener\(\'blur\', \(\) => residentKeys\.clear\(\)\)/);
  assert.match(engine, /browser storage is unavailable or full/);
  for (const standalone of [world, plots]) {
    assert.match(standalone, /addEventListener\(\'blur\',\(\)=>keys\.clear\(\)\)/);
    assert.match(standalone, /pointercancel/);
    assert.match(standalone, /pointerleave/);
  }
});


test("homepage presents three distinct BrickLab games", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Build Your Dream Cities/);
  assert.match(page, /BrickLab Frontier/);
  assert.match(page, /Infinite Plots/);
  assert.match(page, /href="\/frontier\.html"/);
  assert.match(page, /href="\/infinite-plots\.html"/);
  assert.match(page, /Creative competition/);
  assert.match(page, /Settlement RPG/);
  assert.match(page, /Persistent build league/);
});

test("Frontier includes a saved RPG quest and progression loop", async () => {
  const frontier = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");
  assert.match(frontier, /BrickLab Frontier — Settlement RPG/);
  assert.match(frontier, /const RPG_QUESTS =/);
  assert.match(frontier, /function questEvent/);
  assert.match(frontier, /function addXp/);
  assert.match(frontier, /id="rpgHud"/);
  assert.match(frontier, /rpg: \{ \.\.\.rpg/);
  assert.match(frontier, /questEvent\('gather'/);
  assert.match(frontier, /questEvent\('craft'/);
  assert.match(frontier, /questEvent\('place'/);
  assert.match(frontier, /questEvent\('defeat'/);
});


test("Frontier RPG Sprint 2 adds settlers, jobs, trade and a working inventory", async () => {
  const frontier = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");
  assert.match(frontier, /function openInventory/);
  assert.match(frontier, /const SETTLERS =/);
  assert.match(frontier, /Mira/);
  assert.match(frontier, /Arun/);
  assert.match(frontier, /Leela/);
  assert.match(frontier, /function spawnSettlers/);
  assert.match(frontier, /function talkToSettler/);
  assert.match(frontier, /const SETTLEMENT_JOBS =/);
  assert.match(frontier, /function completeSettlementJob/);
  assert.match(frontier, /const FRONTIER_SHOP =/);
  assert.match(frontier, /function buyFromTradingPost/);
  assert.match(frontier, /function openJournal/);
  assert.match(frontier, /function openTradingPost/);
  assert.match(frontier, /if \(k === 'r'/);
  assert.match(frontier, /if \(k === 'j'/);
  assert.match(frontier, /if \(k === 't'/);
});


test("Frontier performance regression guard uses adaptive and throttled streaming", async () => {
  const frontier = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");
  assert.match(frontier, /const LOW_POWER =/);
  assert.match(frontier, /const RENDER_DIST = LOW_POWER \? 3 : 4/);
  assert.match(frontier, /const STREAM_INTERVAL =/);
  assert.match(frontier, /if \(streamTimer <= 0/);
  assert.match(frontier, /lastSettlerPrompt/);
  assert.match(frontier, /BrickLab Frontier needs WebGL/);
  assert.match(frontier, /performance mode/);
});

test("Frontier RPG hardening: saves, pausing, economy and settlement tiers", async () => {
  const game = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");

  // the title screen owns the keyboard, so E/J/T/M cannot start a ghost world
  assert.match(game, /if \(panelMode === 'title'\) return;/);
  // the world pauses while any panel is open
  assert.match(game, /if \(panelMode !== 'none'\) \{ keys\.clear\(\); renderer\.render\(scene, camera\); return; \}/);
  // progress is flushed when the tab goes away, not only every 45 seconds
  assert.match(game, /addEventListener\('pagehide', saveOnExit\)/);
  assert.match(game, /addEventListener\('beforeunload', saveOnExit\)/);
  // the recovery copy is not refreshed by every autosave
  assert.match(game, /const BACKUP_AGE/);
  // Recover swaps live and backup instead of destroying the newer save
  assert.match(game, /localStorage\.setItem\(slotKey\(i\) \+ ':backup', live\)/);
  // an import is given a slot of its own before play starts
  assert.match(game, /All ' \+ SLOTS \+ ' slots are full/);
  // repeat settlement jobs pay less each time, so no buy-and-deliver loop profits
  assert.match(game, /const jobReward = \(job, times\)/);
  assert.match(game, /Math\.pow\(0\.55, times\)/);
  // only hostile creatures pay a bounty
  assert.match(game, /if \(mob\.spec\.hostile\) \{/);
  // buying a spare tool must not repair the worn one
  assert.match(game, /BLOCKS\[offer\.id\]\.uses && !tools\.has\(offer\.id\)/);
  // settlers never spawn below the waterline
  assert.match(game, /Math\.max\(heightAt\(x, z\) \+ 1, SEA_LEVEL \+ 1\)/);
  // settler meshes are disposed, not just removed
  assert.match(game, /function disposeSettler/);
  // the settlement tier ladder and its shop gating
  assert.match(game, /const SETTLEMENT_TIERS = \[/);
  assert.match(game, /function settlementTier\(\)/);
  assert.match(game, /\(offer\.tier \|\| 0\) > settlementTier\(\)/);
  assert.match(game, /id="rpgSettlement"/);
});

test("Open World is linked from the homepage as its own game", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /href="\/worldforge\.html"/);
  assert.match(page, /Open World/);
  assert.match(page, /Four connected ways to play/);
  assert.match(page, /openworld-card/);

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.openworld-card\{background:/);
  // four cards need two columns, not three
  assert.match(css, /\.universe-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("Open World hardening: saves, expeditions, economy and varied AI builds", async () => {
  const world = await readFile(new URL("../public/worldforge.html", import.meta.url), "utf8");

  // a world slot cannot silently discard unsaved work, and the game continues by default
  assert.match(world, /Unsaved changes in the current frontier will be lost/);
  assert.match(world, /if\(localStorage\.getItem\('bricklab-frontier-slot-1'\)\)load\(1\);else generate\(\)/);
  // saving reports a full quota instead of failing in silence
  assert.match(world, /Could not save — browser storage is full/);
  // a load must not rebuild scenery the player demolished
  assert.match(world, /razed/);
  // the expedition no longer converts a creative player, and its blocks stay behind
  assert.match(world, /modeBeforeExpedition=mode/);
  assert.match(world, /if\(modeBeforeExpedition\)\{mode=modeBeforeExpedition/);
  assert.match(world, /if\(expeditionActive\)\{const nm=blocks\.get\(key\(x,y,z\)\);if\(nm\)nm\.userData\.zone='expedition'\}/);
  // the return gate arms only once the player has left it
  assert.match(world, /gateArmed/);
  // the relic pays its ten coins once per world, not once per run
  assert.match(world, /const first=!unlockedBlueprints\.includes\('ancient-arch'\);if\(first\)\{unlockedBlueprints\.push\('ancient-arch'\);coins\+=10\}/);
  // building through an open menu is no longer possible
  assert.match(world, /if\(k==='f'&&locked\)placeBlock\(\)/);
  // the AI builder works inside ground the player may edit, and stands there
  assert.match(world, /Math\.hypot\(x-site\.buildX,z-site\.buildZ\)<=6/);
  assert.match(world, /createNPC\(site\.buildX\+2,site\.buildZ\+2/);
  // four trades, not one lodge twelve times
  assert.match(world, /function builderCraft\(site\)/);
  for (const label of ["Watchtower", "Workshop", "Glasshouse", "Builder Lodge"]) {
    assert.match(world, new RegExp(`label:'${label}'`));
  }
  // the settlement stage now decides how far the frontier can grow
  assert.match(world, /const STAGE_CAP=\{Camp:22,/);
  assert.match(world, /function territoryCap\(\)/);
  assert.match(world, /const cap=territoryCap\(\)/);
  // the column-height lookup is cached instead of scanning every block per frame
  assert.match(world, /const topCache=new Map\(\)/);
  // meshes are disposed rather than orphaned
  assert.match(world, /function disposeGroup\(group\)/);
  // and the mode is drivable from tests
  assert.match(world, /window\.worldforge=\{/);
});

test("Frontier night raids give the fourth verb something to defend", async () => {
  const game = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");

  // raids exist, and a brand new Camp is left alone
  assert.match(game, /const RAID_GRACE_TIER = 1/);
  assert.match(game, /if \(settlementTier\(\) >= RAID_GRACE_TIER\) beginRaid\(\)/);
  // the settlement has a location, taken from what the player actually built
  assert.match(game, /function noteSettlementBlock\(x, z\)/);
  assert.match(game, /function settlementHub\(\)/);
  assert.match(game, /noteSettlementBlock\(x, z\);/);
  // raiders walk on the settlement rather than only on the player
  assert.match(game, /const raiding = mob\.raider && raid\.active && away > 6/);
  // they eat what the player placed, and only in the dark
  assert.match(game, /function chewBlock\(mob, dt, x, y, z\)/);
  assert.match(game, /if \(!id \|\| !edits\.get\(vkey\(x, y, z\)\)\) return false;/);
  assert.match(game, /if \(litNearby\(x, y, z, RAID_LIGHT_RADIUS\)\) \{ mob\.chew = 0; return false; \}/);
  // settlers can be driven off, and light protects them
  assert.match(game, /function harmSettler\(settler, amount\)/);
  assert.match(game, /SETTLER_LIGHT_RADIUS\)\) return;/);
  assert.match(game, /if\(settler\.down\)/);
  // dawn ends it and puts everyone back
  assert.match(game, /function endRaid\(\)/);
  assert.match(game, /if \(settler\.down\) \{ settler\.down = false; settler\.group\.visible = true;/);
  // the loop and the test stepper both drive it
  assert.match(game, /updateSky\(dt\);\n  updateRaid\(dt\);/);
  // and the box copy is now true rather than aspirational
  assert.match(game, /Light the settlement before dusk, or raiders break what you built\./);
});

test("every game can send player feedback through one shared widget", async () => {
  const widget = await readFile(new URL("../public/feedback.js", import.meta.url), "utf8");

  // one implementation, not one per game
  assert.match(widget, /'\/frontier\.html': 'frontier'/);
  assert.match(widget, /'\/worldforge\.html': 'worldforge'/);
  assert.match(widget, /'\/infinite-plots\.html': 'plots'/);
  // four specific questions, asked one at a time, beat a blank box
  assert.match(widget, /var STEPS = \[/);
  for (const q of ["How was it\\?", "What made you stop playing\\?",
                   "What was confusing or annoying\\?", "Would you play again tomorrow\\?"]) {
    assert.match(widget, new RegExp(q));
  }
  assert.match(widget, /Question ' \+ \(step \+ 1\) \+ ' of ' \+ STEPS\.length/);
  assert.match(widget, /function transcript\(\)/);
  // context is read when the note is sent, so load order does not matter
  assert.match(widget, /function gameContext\(\)/);
  assert.match(widget, /played: Math\.round\(\(Date\.now\(\) - started\) \/ 1000\)/);
  // typing in the box must not drive the player
  assert.match(widget, /\['keydown', 'keyup', 'keypress'\]\.forEach/);
  assert.match(widget, /event\.stopPropagation\(\)/);
  // and it releases the mouse so the panel is usable
  assert.match(widget, /if \(document\.exitPointerLock\) document\.exitPointerLock\(\)/);

  // every game loads it, and the Next app does too
  for (const file of ["frontier.html", "worldforge.html", "infinite-plots.html"]) {
    const game = await readFile(new URL(`../public/${file}`, import.meta.url), "utf8");
    assert.match(game, /<script src="\/feedback\.js" defer><\/script>/, `${file} loads the widget`);
  }
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /<script src="\/feedback\.js" defer \/>/);

  // the two voxel games report where the player had got to
  const frontier = await readFile(new URL("../public/frontier.html", import.meta.url), "utf8");
  assert.match(frontier, /window\.BRICKLAB_FEEDBACK=\{context:/);
  const world = await readFile(new URL("../public/worldforge.html", import.meta.url), "utf8");
  assert.match(world, /window\.BRICKLAB_FEEDBACK=\{context:/);
});

test("the feedback route validates before it touches storage", async () => {
  const route = await readFile(new URL("../app/api/feedback/route.ts", import.meta.url), "utf8");

  // only the four real games, and hard caps on a public write endpoint
  assert.match(route, /const GAMES = \["cities", "frontier", "worldforge", "plots"\]/);
  assert.match(route, /const MAX_MESSAGE = 1200/);
  assert.match(route, /const MAX_CONTEXT = 2000/);
  // a bad note is rejected before the database is reached for
  const validateAt = route.indexOf("Say something, or leave a rating");
  const storageAt = route.indexOf("const db = await getAnyDb();", route.indexOf("export async function POST"));
  assert.ok(validateAt > 0 && storageAt > validateAt, "validation must precede storage");
  // reading it back is gated on a secret, and denied outright when unset
  assert.match(route, /const expected = process\.env\.ADMIN_KEY;/);
  assert.match(route, /if \(!expected \|\| expected\.length < 16\)/);
  assert.match(route, /if \(key !== expected\) return fail\("Not found", 404\)/);

  // the table it writes to exists in the schema and in a migration
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(schema, /export const feedback = sqliteTable\(/);
  const migration = await readFile(new URL("../drizzle/0002_feedback.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE `feedback`/);
  const journal = await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8");
  assert.match(journal, /0002_feedback/);
});

test("the public endpoints are limited before the link is shared", async () => {
  const limits = await readFile(new URL("../app/api/limits.ts", import.meta.url), "utf8");

  // a cookie is trivially cleared and an address trivially shared, so both count
  assert.match(limits, /feedbackPerHourPerAddress: 10/);
  assert.match(limits, /feedbackPerDayPerPlayer: 25/);
  assert.match(limits, /townsPerHourPerAddress: 12/);
  assert.match(limits, /townsPerOwner: 40/);
  // the address is hashed, never stored raw
  assert.match(limits, /export async function ipHash/);
  assert.match(limits, /crypto\.subtle\.digest\("SHA-256", bytes\)/);
  assert.doesNotMatch(limits, /x-forwarded-for.*\)\s*;\s*return first/s);

  const feedback = await readFile(new URL("../app/api/feedback/route.ts", import.meta.url), "utf8");
  assert.match(feedback, /feedbackFromAddress\(db, address, since\(HOUR\)\)/);
  assert.match(feedback, /feedbackFromPlayer\(db, viewer\.ownerId, since\(DAY\)\)/);
  assert.match(feedback, /return tooMany\("feedback"\)/);
  // the transcript keeps its line breaks; other control characters go
  assert.match(feedback, /replace\(\/\[\\u0000-\\u0009\\u000b-\\u001f\\u007f\]\/g, ""\)/);
  // and the address hash is not handed back out
  assert.doesNotMatch(feedback, /ipHash: feedback\.ipHash/);

  const townsRoute = await readFile(new URL("../app/api/towns/route.ts", import.meta.url), "utf8");
  assert.match(townsRoute, /townsFromAddress\(db, address, since\(HOUR\)\)/);
  assert.match(townsRoute, /townsOwnedBy\(db, viewer\.ownerId\)/);
  assert.match(townsRoute, /ipHash: address/);
});

test("a public town can be taken down", async () => {
  const admin = await readFile(new URL("../app/api/admin/towns/route.ts", import.meta.url), "utf8");

  // gated on a secret, and refuses everyone when it is unset or too short
  assert.match(admin, /const expected = process\.env\.ADMIN_KEY;/);
  assert.match(admin, /if \(!expected \|\| expected\.length < 16\)/);
  // a wrong key and a missing route look the same from outside
  assert.match(admin, /if \(key !== expected\) return fail\("Not found", 404\)/);
  // two strengths of takedown
  assert.match(admin, /body\.action === "delete" \? "delete" : body\.action === "unlist" \? "unlist" : null/);
  assert.match(admin, /set\(\{ visibility: "private" \}\)/);
  assert.match(admin, /db\.delete\(townLikes\)\.where\(eq\(townLikes\.townId, id\)\)/);

  // the schema carries the rate-limit column and its migration
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(schema, /ipHash: text\("ip_hash"\)/);
  const migration = await readFile(new URL("../drizzle/0003_limits.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER TABLE `towns` ADD `ip_hash` text/);
  assert.match(migration, /ALTER TABLE `feedback` ADD `ip_hash` text/);
});
