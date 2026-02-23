## Current Status

### Completed
- [x] Repository scaffolding — `src/`, `tests/`, `docs/`, `config/`
- [x] Architecture & UI design guidelines documented
- [x] GitHub Integration module (`src/github_integration/`) — PAT & App auth, file CRUD, branch & PR management, fully tested
- [x] Navigation Core module (`src/navigation/`) — route generation, randomised paths, GPS compliance, fully tested
- [x] Core Voice AI / TTS module (`src/tts/`) — turn prompts, speed warnings, fully tested
- [x] CarPlay UI Compliance module (`src/carplay/`) — Apple HIG validation, fully tested
- [x] Hazard Detection module (`src/hazard_detection/`) — proximity-based hazard alerts, severity ranking, fully tested

### Up Next (Phase 2 preparation)
- [ ] TTS Premium Voices — integrate diverse voice options for paid tier
- [ ] Advanced Hazard Mapping — real-time hazard zone mapping with AI input

---

## Module Documentation

### `src/github_integration/`
Authenticated GitHub API client helpers.  Supports both Personal Access Token
(PAT) and GitHub App installation authentication.  Provides file CRUD
operations (`readFile`, `writeFile`, `listContents`), branch management
(`createBranch`), and pull-request creation (`createPullRequest`) built on
`@octokit/rest` and `@octokit/app`.

**Roadmap:** Completed.  Phase 2 will extend this module for automated PR
review workflows and multi-repository orchestration.

---

### `src/navigation/`
Navigation Core — free-tier routing engine.  Validates GPS coordinates via the
Haversine formula (`isValidCoordinate`, `haversineDistanceKm`), generates
direct routes (`generateRoute`), and produces randomised multi-waypoint routes
(`generateRandomisedRoute`).  All route distances are computed in kilometres
(`routeDistanceKm`).

**Roadmap:** Completed for Phase 1.  Phase 2 will add real-time traffic
awareness and dynamic route re-calculation.

---

### `src/tts/`
Text-to-Speech (TTS) Voice Guidance — Phase 1 MVP.  Generates platform-agnostic
voice prompt strings suitable for delivery via `AVSpeechSynthesizer` on
iOS/CarPlay or any other TTS engine.

- `generateTurnPrompt(direction, streetName, distanceMeters)` — produces
  turn-by-turn instructions for left, right, straight-ahead, and U-turn
  manoeuvres with human-readable distance formatting (metres / kilometres).
- `generateSpeedWarningPrompt(currentSpeed, speedLimit)` — returns a warning
  string when the driver exceeds the posted speed limit, or an empty string
  when within limits.

**Roadmap:** Phase 2 will add premium voice selection and locale-aware phrasing.

---

### `src/carplay/`
CarPlay UI Compliance — validates navigation routes against Apple Human
Interface Guidelines (HIG) for CarPlay to ensure a safe, uncluttered driver
experience.

- `validateRouteForCarPlay(route)` — checks waypoint count (≤ 25), route name
  length (≤ 50 characters), and step count (≤ 24).  Returns `{ valid, errors }`
  so callers can surface compliance failures before displaying a route.

**Roadmap:** Phase 2 will extend validation to cover template-based UI layouts
and voice-control interaction depth limits.

---

### `src/hazard_detection/`
Proximity-Based Hazard Detection — alerts the driver to known hazards (road
works, accidents, speed cameras, road closures, debris) that fall within a
configurable radius of the current GPS position.

- `detectNearbyHazards(position, hazards, radiusMeters)` — filters the hazard
  list using the Haversine formula, annotates each result with `distanceMeters`,
  and returns results sorted nearest-first.
- `getMostSevereHazard(nearbyHazards)` — returns the highest-severity hazard
  from a detected set using the priority order: road_closure > accident >
  road_works > debris > speed_camera.

**Roadmap:** Phase 2 will add real-time hazard ingestion from external data
feeds and AI-driven hazard-zone mapping.

---

## Roadmap
### Phase 1: MVP
**Focus Areas:**
- Navigation Loop (Free Tier)
  - [x] Implement route generation logic.
  - [x] Integrate randomized route paths.
  - [x] Establish GPS compliance.
- Core Voice AI (TTS-Based Guidance)
  - [x] Add basic TTS functionality.
  - [x] Generate voice-guided navigation prompts.
- CarPlay UI Compliance
  - [x] Design compliant user flows.
  - [x] Test for adherence to Apple guidelines.
- Hazard Detection (foundational)
  - [x] Implement proximity-based hazard detection.
  - [x] Add hazard severity ranking.

### Phase 2: Premium Expansion
**Focus Areas:**
- Advanced Hazard Mapping
  - [ ] Develop AI for hazard detection and awareness.
  - [ ] Map hazardous zones in real-time using inputs.
- TTS Premium Voices
  - [ ] Integrate diverse voice options.
  - [ ] Optimize voice quality for premium users.
- Paid Tier Infrastructure
  - [ ] Develop subscription management logic.
  - [ ] Test paid and dynamic feature toggles.

### Phase 3: Multi-Agent Orchestration
**Focus Areas:**
- Web/Desktop Integration
  - [ ] Ensure desktop application syncs user data.
  - [ ] Enable accessibility across multiple devices.
- Multi-Device State Sync
  - [ ] Establish real-time sync mechanisms.
  - [ ] Optimize performance for state persistence across platforms.

### Future Milestones
- [ ] Further milestones to be detailed here.
- [ ] Additional subtasks as needed.