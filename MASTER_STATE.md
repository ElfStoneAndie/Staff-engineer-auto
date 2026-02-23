## Architecture Notes
- **Runtime**: Node.js >= 20 (required by Jest 30 and @octokit packages)
- **CI**: GitHub Actions using `actions/checkout@v4` and `actions/setup-node@v4` with Node.js 20

## Roadmap
### Phase 1: MVP ✅ In Progress
**Focus Areas:**
- GitHub Integration
  - [x] `createPATClient` and `createInstallationClient` helpers
  - [x] `listContents`, `readFile`, `writeFile` repo operations
  - [x] `createBranch` and `createPullRequest` helpers
  - [x] Full test coverage (`tests/github_integration.test.js`)
- Navigation Loop (Free Tier)
  - [x] Route generation logic (`generateRoute`)
  - [x] Randomized route paths (`randomizeRoute`)
  - [x] GPS compliance validation (`isValidCoordinate`, `haversineDistance`)
  - [x] Basic TTS voice-guidance prompts (`generateVoicePrompt`)
  - [x] Full test coverage (`tests/navigation.test.js`)
- CarPlay UI Compliance
  - [ ] Design compliant user flows.
  - [ ] Test for adherence to Apple guidelines.

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
