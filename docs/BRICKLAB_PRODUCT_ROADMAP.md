# BrickLab — Product Agenda and Sprint Roadmap

## Product promise

**Build your dream world, then walk, ride and play through everything you create.**

BrickLab is an original all-ages construction sandbox: easier to begin than a professional 3D tool, deeper than a simple toy builder, and centred on living cities rather than combat. The browser prototype remains the vertical slice while the engine is progressively prepared for large persistent worlds.

## Two distinct game experiences

- **City Builder:** piece-by-piece towns, working transport, utilities, residents, guided builds and themed showcase cities.
- **Open World:** a separate first-person block-building game with generated terrain, exploration, resource interaction and its own inventory, rules and saves.

The two experiences share the BrickLab brand and can later share accounts, creator profiles and discovery. Their controls, world saves, building rules and game screens remain separate so each stays easy to understand. Open World is inspired by the wider block-building genre, but it will use original code, art, characters, terminology, progression and world systems.

## Open World gameplay identity

**Explore → gather → refine → trade → build → expand → establish a civilisation.**

Unlike an effectively endless sandbox, every Open World player begins with a finite frontier territory. The land contains a deliberate mixture of renewable common resources, finite deposits and discoverable rare materials. Players grow from a basic shelter into a village, town, city or kingdom by making choices about how they use their land.

### What makes it interesting

- **Meaningful scarcity:** common materials remain obtainable, while rare metals, gems, crystals and artefacts create exploration goals.
- **Visible progression:** camp → homestead → village → town → city → civilisation.
- **Player choice:** specialise in mining, farming, refining, construction, trading, exploration or settlement management.
- **Mystery:** caves, ruins, buried chambers, ancient maps, environmental puzzles and rotating discoveries.
- **Living consequences:** residents, merchants, production, transport, power, water and land value respond to what the player builds.
- **Social purpose:** neighbouring territories, family settlements, team projects, trade and fair construction competitions.
- **Creative ownership:** the world remains the player’s creation; objectives suggest possibilities without forcing one correct design.

### Economy safeguards

- Essential resources regenerate, can be cultivated or remain purchasable from neutral merchants so a world cannot become permanently stuck.
- Rare resources are valuable but never required for basic movement, building, saving or accessibility.
- The economy uses auditable sources and sinks to control inflation; direct player trading receives price guidance, limits and anti-fraud protection.
- Paid expansion is optional and transparent. Every player retains a reasonable free route to earn more land through play.
- Previously built structures are never removed because an entitlement or season changes.

## Design principles

1. A structure must remain stable unless the builder intentionally enables destruction physics.
2. Anything shown in an official demo must be reproducible with user-accessible pieces or blueprints.
3. Build, Play, Resident, City and Transport views must work in personal towns as well as demos.
4. Early Builder Access keeps all pieces and initial plot expansion unlocked; monetisation is introduced only after retention is proven.
5. Official showcases are read-only. Copying creates an independent attributed town. User creators control whether their own town may be copied.
6. The product uses original visual designs, names, characters, textures and sounds.
7. Children and adults can play; social systems require privacy, moderation and parental safeguards from the start.

## Complete feature agenda

### Building and creation

- Searchable, categorised piece library with favourites and recently used pieces.
- Bricks, plates, tiles, slopes, curves, arches, columns, doors, glass, windows, roofs, domes and heritage details.
- Miscellaneous kits: furniture, kitchens, bathrooms, hotel and restaurant objects, street furniture, nature, construction props, utility and water pieces.
- Roads, pavements, junctions, crossings, lanes, bridges, tunnels and traffic controls.
- Straight/curved/elevated railway pieces, stations, platforms, signals, switches and trains.
- Terrain sculpting: grass, soil, sand, snow, hills, mountains, caves, beaches, rivers, lakes and ocean.
- Select, multi-select, connected-structure selection, move, rotate, duplicate, recolour and delete.
- Snap rules, collision preview, structural support indicators, undo/redo and autosave.
- Custom piece maker, reusable blueprints, layer-by-layer construction and “How it was built”.
- Expandable plots and side-by-side layouts.

### Living-world simulation

- Reliable lane-based vehicles with spacing, collision avoidance, junction priority and traffic lights.
- Pedestrians and residents with destinations, schedules and safe crossings.
- Enterable homes, apartments, offices, shops, restaurants, hotels, schools, hospitals, factories, stations, police and fire services.
- Doors, rooms, furniture, lifts, stairs and building-purpose assignment.
- Electricity generation, wires, switches, streetlights, machinery, demand and outages.
- Water sources, tanks, pipes, pumps, consumption, drainage and failures.
- Factories, delivery vehicles, construction machinery and simple production chains.
- Day/night and climate: clear, rain, snow, fog, wind and seasonal appearance.
- Optional safe structural/destruction simulation separated from normal Play mode.

### Exploration

- First- and third-person Resident View with WASD/arrow controls, run, jump, collision and door interaction.
- City View with orbit, pan, zoom, landmarks and district navigation.
- Train passenger and driver views with free look in every direction and station stops.
- Driveable road vehicles; rideable horses, elephants and other theme-appropriate transport.
- Guided tours, destination shortcuts, minimap, compass and accessibility settings.

### Worlds and showcase library

- Modern Metro City 1, Waterfront City 2, Skyrail District and Royal Palace Complex.
- Expanded Indian Heritage capital with immense palaces, temples, havelis, bazaars, horses, elephants and residents—without modern cars.
- Village, Japanese castle town, Chinese walled city, European medieval city and ancient ruins.
- Temple city, pyramid kingdom, jungle pyramid city and classical empire.
- Later: island, mountain, futuristic and fantasy worlds.
- Every showcase supports view, tour and independent copying where appropriate.

### Learning and game modes

- “Build Your First Town” onboarding from empty land.
- Guided structure levels with layer hints, accuracy scoring and completion time.
- Level rankings, personal bests, achievements and themed campaigns.
- Creative/free build with no required objectives.
- City feasibility checks for roads, power, water, services and transport before Play.
- One-on-one and team construction challenges using fair shared piece sets.

### Accounts, community and multiplayer

- Accounts, cloud saves, version history and cross-device towns.
- Personal, family and team worlds with an owner/admin.
- Invite, remove and kick permissions; builder, visitor and moderator roles.
- Real-time co-building, presence indicators, chat/emotes and edit conflict handling.
- Likes, discovery, creator profiles, reporting, moderation and copy permissions.
- Public, unlisted, private and family-only publishing controls.

### Business model

- Begin with all core pieces and generous plots unlocked to maximise learning and retention.
- Never remove or break structures already built during Early Builder Access.
- Later monetise optional expansion: larger world capacity, premium themed packs, advanced blueprints, private team servers, creator marketplace cosmetics and additional save slots.
- Avoid manipulative mid-build locking. Show the required entitlement before a user starts a premium template.
- Keep walking, basic building, saving and core accessibility free.

## City Builder sprint plan

### Sprint 1 — Builder foundation and piece discovery (current)

- Search and category filters for the complete piece catalogue.
- Add interior, restaurant/hotel, landscape, street, construction and utility kits.
- Replace misleading “watch it fall” messaging.
- Validate save/load compatibility and production build.

**Exit:** A new user can quickly find functional and decorative pieces needed for a believable small building and street.

### Sprint 2 — Stable Build/Play contract

- Make structural stability the default in personal towns.
- Add an explicit optional Physics/Destruction experiment.
- Placement collision warning, support preview and “fix unsupported pieces” assistant.
- Autosave, recovery snapshot and safer import/export.

**Exit:** Pressing Play never unexpectedly destroys a normal build.

### Sprint 3 — Resident movement and interiors

- Unified first-person controller for every personal and showcase world.
- Character capsule collision, stairs, jump, run and spawn safety.
- Reliable opening doors and room portals.
- Interior starter blueprints for home, restaurant, hotel, shop, school and hospital.

**Exit:** Players can walk a town, enter at least six building types and move through furnished rooms.

### Sprint 4 — Road and traffic system

- Lane graph generated from road pieces.
- Wider two-way roads, junctions, crossings and lane direction.
- Vehicle spacing, obstacle detection, traffic lights and recovery from invalid routes.
- Pedestrians and safe crossings.

**Exit:** Vehicles complete routes without rotating in place, overlapping or passing through one another.

### Sprint 5 — Railway builder and ride

- Connected rail validation, curves, switches, bridges and stations.
- Working train available in personal towns.
- Passenger/driver cameras with free look and station stops.
- Approximately one-kilometre showcase circuit using streamed sections.

**Exit:** A user can build, validate and ride their own railway while looking in every direction.

### Sprint 6 — Terrain, water and climate

- Chunked expandable terrain and paint/sculpt tools.
- Rivers, lakes, beaches, water level and bridges.
- Water tanks, pumps and pipe connectivity.
- Rain, snow, fog, day/night and weather-aware lighting.

**Exit:** A saved world can contain performant land, water and climate beyond a flat plot.

### Sprint 7 — Working city simulation

- Power and water feasibility dashboard.
- Factories, machinery, deliveries and utilities.
- Public services, resident destinations and simple schedules.
- Play Mode status for roads, transport, utilities and buildings.

**Exit:** Play explains what works, what is disconnected and how to fix it.

### Sprint 8 — World-scale engine

- Chunk streaming, instanced rendering and level-of-detail models.
- Spatial save format, incremental loading and background autosave.
- Minimap, districts, fast travel and performance settings.
- Desktop/mobile input abstraction.

**Exit:** Large worlds load progressively and maintain a stable frame rate without rendering every piece independently.

### Sprint 9 — Guided game and progression

- City School onboarding and themed construction levels.
- Accuracy, time, completion and personal-best scoring.
- Feasibility objectives and non-violent city challenges.
- Rankings prepared for authenticated storage.

**Exit:** The game has a complete learn-build-play progression loop beyond free build.

### Sprint 10 — Accounts, cloud saves and publishing

- Authentication, cloud towns, version history and multiple save slots.
- Public/unlisted/private visibility, likes and copy controls.
- Creator profiles, attribution, reporting and moderation queue.

**Exit:** Users safely retain and share creations across devices.

### Sprint 11 — Families, teams and live collaboration

- Family/team layouts, owner/admin/member/visitor roles.
- Invite, remove and kick controls.
- Real-time co-building, edit reservations and presence.
- Team construction challenges and leaderboards.

**Exit:** Multiple authorised players can safely build one persistent town together.

### Sprint 12 — Marketplace and sustainable monetisation

- Plot/world-capacity upgrades, themed packs and premium blueprints.
- Creator marketplace with moderation, attribution and revenue rules.
- Team plans and private collaboration capacity.
- Transparent Early Builder entitlements and grandfathering.

**Exit:** Monetisation adds desirable capacity and content without crippling the free creative experience.

## Open World sprint plan — Frontier track

This is a separate game-development track. It does not add resource bars, crafting screens or survival rules to City Builder.

### OW Sprint 1 — Creative foundation (completed alpha)

- Separate Open World entry point, interface, save slot and onboarding.
- First-person movement, run, jump, free look and collision.
- Generated terrain, water, trees and eight starter materials.
- Block targeting, breaking, placement, desktop controls and mobile controls.
- Original player identity and clearly stated Creative Alpha rules.

**Exit:** A player can enter Open World independently, explore, reshape terrain, build, save and return later.

### OW Sprint 2 — Player, camera and dependable interaction

- Original visible avatar with skin, clothing and colour customisation.
- First-person and third-person views with smooth switching.
- Hands/tools feedback, interaction animation, footsteps and original sound language.
- Improved capsule collision, slopes, swimming, climbing, spawn safety and accessibility options.
- Input remapping, controller support and complete touch controls.

**Exit:** Movement and interaction feel like a finished game on desktop and mobile, and the player has a recognisable BrickLab identity.

### OW Sprint 3 — Finite frontier territory

- Replace the temporary world with chunked finite territories and visible boundaries.
- Starter sizes balanced through testing; no paid restriction during the early alpha.
- Territory map, landmarks, fog-of-discovery and expansion edges.
- Multiple world slots, named worlds, autosave, recovery and import/export.
- Performance foundation: instancing, chunk loading, level of detail and memory budgets.

**Exit:** A player owns a stable, performant territory that feels substantial while still making expansion meaningful.

### OW Sprint 4 — Resources, inventory and tools

- Renewable wood, crops, water and other essential materials.
- Stone, clay, sand, coal, iron, copper, silver, gold, gems and rare crystals.
- Inventory quantities, stacks, weight/capacity rules and storage containers.
- Tools with original upgrade paths, collection speed and durability balanced for low frustration.
- Resource survey view, deposit rarity and safeguards against permanently exhausting essential materials.

**Exit:** Breaking the world produces understandable resources, and every collected item has a clear purpose.

### OW Sprint 5 — Refining, crafting and workshops

- Simple recipes, discovery-based recipe book and guided first workshop.
- Furnaces, sawmills, kilns, metalworks, textile benches and food preparation.
- Multi-step production without excessive waiting or repetitive grinding.
- Furniture, doors, glass, windows, lighting, decorations and miscellaneous building objects.
- Reusable structural blueprints and assisted placement for large builds.

**Exit:** Raw resources can be transformed into useful, visually distinctive building materials, tools and objects.

### OW Sprint 6 — Merchants, currency and fair trade

- Neutral merchants guarantee access to essential resources and starter tools.
- Earnable currency from selling goods, completing contracts and discovering artefacts.
- Player specialisations: miner, farmer, refiner, builder, trader and explorer.
- Price guidance, transaction history, trade limits and anti-abuse controls.
- Economy telemetry and balancing tools for supply, demand, inflation and resource sinks.

**Exit:** Players can progress through gathering, production or trade without being forced into one occupation.

### OW Sprint 7 — Earned land expansion and settlement growth

- Expand territory using currency, land deeds, civic milestones, discoveries or team objectives.
- Free progression path for every expansion tier; optional paid capacity only after retention is proven.
- Settlement stages: camp, homestead, village, town, city and civilisation.
- Land value, zoning suggestions, roads, bridges and transport connections.
- Side-by-side territories and optional connections between authorised neighbours.

**Exit:** Expansion feels earned and exciting, while players always understand the next achievable goal.

### OW Sprint 8 — Biomes, caves, ruins and climate

- Forest, grassland, desert, mountain, snow, wetland, coast and theme-specific regions.
- Layered caves, underground water, deposits and safe traversal tools.
- Ancient ruins, temples, pyramids, heritage fragments and environmental puzzles using original designs.
- Day/night, rain, snow, fog, storms and seasonal visual changes.
- Rotating discoveries that add curiosity without deleting permanent player work.

**Exit:** Exploration regularly reveals meaningful places, resources and stories rather than more empty terrain.

### OW Sprint 9 — Living settlements

- Residents, merchants, builders, farmers and craftspeople with simple needs and schedules.
- Peaceful wildlife, domestic animals, horses, elephants and theme-appropriate transport.
- Assignable homes, workplaces, restaurants, hotels, markets, schools and services.
- Water, food, shelter, lighting, production and optional happiness indicators.
- Non-violent requests, civic projects and settlement events.

**Exit:** A well-built settlement visibly functions and gives players reasons to improve it.

### OW Sprint 10 — Adventure and optional survival rulesets

- Peaceful Adventure mode with discoveries, expeditions and environmental challenges.
- Optional Survival mode with health, energy and configurable hunger; Creative remains available.
- Safe hazards, rescue/recovery, checkpoints and difficulty settings.
- Story contracts, ancient maps, expeditions and rare-resource journeys.
- No forced combat; any later combat system requires a separate product, safety and audience decision.

**Exit:** Players seeking objectives receive meaningful challenge without changing the core creative identity.

### OW Sprint 11 — Accounts, cloud worlds and publishing

- Authentication, cross-device saves, version history and restore points.
- Public, unlisted, private and family-only world visibility.
- Likes, creator profiles, screenshots, descriptions, tags and discovery.
- Copy permissions, blueprint attribution, reporting and moderation.
- Child-safety, parental controls, privacy defaults and age-appropriate communication.

**Exit:** Players can safely preserve and showcase their worlds without surrendering ownership or copy control.

### OW Sprint 12 — Families, teams and neighbouring worlds

- Owner/admin/member/builder/visitor roles with invite, remove and kick controls.
- Real-time co-building, presence, edit reservations and conflict recovery.
- Shared family settlements, guild towns and team resource stores.
- Neighbour trade routes and permission-based world connections.
- Text-safe emotes and moderated communication before unrestricted chat.

**Exit:** Multiple authorised players can reliably develop one settlement or a connected group of territories.

### OW Sprint 13 — Competitive construction games

- Individual timed builds, accuracy challenges and themed campaigns.
- 1v1, 2v2 and team-versus-team construction battles.
- Equal starting land, resources and blueprints for competitive fairness.
- Rankings, personal bests, seasons and anti-cheat validation.
- Spectator view, replays and voting with abuse protection.

**Exit:** Competition rewards construction skill and teamwork rather than spending or resource advantage.

### OW Sprint 14 — Sustainable expansion and creator economy

- Optional larger territory capacity, extra world slots and private team capacity.
- Premium original theme packs, cosmetics and advanced blueprints.
- Moderated creator marketplace with attribution and revenue rules.
- Entitlement previews before purchase, grandfathering and refund-safe ownership records.
- Live balancing, analytics, performance monitoring and content-release tools.

**Exit:** Revenue expands creativity and capacity without making the free game deliberately frustrating or pay-to-win.

## Release gates

- **City Builder prototype:** City Sprints 1–3 — building and walking are dependable.
- **City Builder vertical slice:** City Sprints 4–7 — one genuinely living neighbourhood.
- **Open World creative alpha:** OW Sprints 1–3 — dependable player controls and finite territories.
- **Open World progression alpha:** OW Sprints 4–8 — resources, refining, economy, expansion and discovery.
- **Living-world beta:** OW Sprints 9–10 — settlements and optional adventure rules.
- **Community beta:** OW Sprints 11–13 — safe persistence, publishing, collaboration and fair competition.
- **Commercial release:** City Sprint 12 and OW Sprint 14, after performance, security, economy, moderation and legal review.

## Current priority

- **City Builder:** Finish City Sprints 1–5 before adding more enormous showcase cities. Dependable building, walking, traffic and railway creation convert visitors into returning builders.
- **Open World:** The browser Frontier Alpha now contains playable slices of OW Sprints 2–10: an original avatar and camera switch, finite expandable territory, three local world slots, biomes, resource inventory, crafting, merchant trade, climate, residents, settlement stages and peaceful local build challenges. These systems must now be play-tested and deepened before economy balancing.
- **Network release:** OW Sprints 11–14 remain a separate production phase because cloud identity, publishing, real-time teams, ranked competition, payments and moderation require durable server infrastructure and security—not simulated local controls. The Frontier menu labels this distinction explicitly.
