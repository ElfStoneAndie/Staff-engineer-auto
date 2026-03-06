# Architecture Overview

This document outlines the architectural design of the Staff Engineer Auto project. The purpose of the architecture is to ensure scalability, maintainability, and compliance with project goals.

---

## Step 3: Core AI Design & Autonomy Plan

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Staff Engineer Auto AI System                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Orchestration Layer                        │   │
│  │            (src/orchestration/index.js)                     │   │
│  │                                                             │   │
│  │   runParallel()  ──────────────────────────────────────┐   │   │
│  │   runSequential() ─────────────────────────────────┐   │   │   │
│  │   buildNavigationPipeline() ───────────────────┐   │   │   │   │
│  └────────────────────────────────────────────────│───│───│───┘   │
│                                                   │   │   │        │
│           ┌───────────────────────────────────────┘   │   │        │
│           ▼                   ┌─────────────────────────┘   │        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │        │
│  │ NavigationAgent│  │  CarPlayAgent  │  │   TTSAgent   │  │        │
│  │ (navigation/)  │  │  (carplay/)    │  │   (tts/)     │  │        │
│  │                │  │                │  │              │  │        │
│  │ generateRoute  │  │ validateRoute  │  │ generateTurn │  │        │
│  │ randomisedRoute│  │ buildScreen    │  │ Prompt       │  │        │
│  │ haversineKm    │  │ validateFlow   │  │ arrivalPrompt│  │        │
│  └────────────────┘  └────────────────┘  └──────────────┘  │        │
│                                                             │        │
│  ┌──────────────────────────────────────────────────────────┘        │
│  ▼                                                                   │
│  ┌─────────────────────────┐   ┌──────────────────────────────────┐  │
│  │  HazardDetectionAgent   │   │      GitHub Integration          │  │
│  │  (hazard_detection/)    │   │   (github_integration/)          │  │
│  │                         │   │                                  │  │
│  │  isInHazardZone         │   │  createBranch / createPR         │  │
│  │  detectHazards          │   │  readFile / writeFile            │  │
│  │  nearestHazard          │   │  createInstallationClient        │  │
│  └─────────────────────────┘   └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Data flow (buildNavigationPipeline):
  config ──► [route-generation] ──► Route object
         ──► [carplay-validation] ──► { validation, screen }
         ──► [tts-prompts] ──► { arrival, departure }
         ──► [hazard-detection] ──► ActiveHazardZone[]
```

---

### Module Breakdown

| Module | Path | Role | Dependencies |
|--------|------|------|--------------|
| **Orchestration** | `src/orchestration/` | Coordinates agents; runs tasks in parallel or sequentially; builds navigation pipelines | navigation, tts, carplay, hazard_detection |
| **Navigation Core** | `src/navigation/` | Route generation, randomised path selection, GPS coordinate validation, Haversine distance | _(none)_ |
| **TTS Engine** | `src/tts/` | Voice-prompt generation for turns, arrivals, recalculation, and speed warnings | _(none)_ |
| **CarPlay UI** | `src/carplay/` | CarPlay-compliant screen descriptors, route and user-flow validation per Apple HIG | _(none)_ |
| **Hazard Detection** | `src/hazard_detection/` | AI-driven circular hazard-zone detection, multi-zone filtering, nearest-hazard lookup | navigation (haversineDistanceKm) |
| **GitHub Integration** | `src/github_integration/` | Authenticated GitHub API client; branch, file, and PR management for CI/CD automation | @octokit/app, @octokit/rest |

---

### Task Sequence for Autonomous App Generation

```
Step 1  Repository scaffold
        └─ GitHub Integration: createBranch → feature branch

Step 2  Navigation pipeline (parallel agents)
        ├─ NavigationAgent:      generateRoute(origin, destination)
        ├─ CarPlayAgent:         validateRouteForCarPlay → buildCarPlayScreen
        ├─ TTSAgent:             generateArrivalPrompt + generateTurnPrompt
        └─ HazardDetectionAgent: detectHazards(origin, hazardZones)

Step 3  Commit generated artefacts
        └─ GitHub Integration: writeFile per artefact → commit to feature branch

Step 4  CI/CD validation (sequential)
        ├─ CarPlay compliance check  (validateUserFlow)
        ├─ GPS coordinate validation (isValidCoordinate)
        └─ Hazard zone audit        (nearestHazard)

Step 5  Pull request
        └─ GitHub Integration: createPullRequest → base branch
```

---

## Original High-Level Components
1. Navigation Core: Responsible for generating and managing route paths.
2. TTS Engine: Provides voice-guided navigation instructions.
3. CarPlay Interface: Ensures compliance with Apple guidelines.
4. Premium Features: Includes advanced hazard mapping and subscription management.

## Modular Design
The architecture is designed using a modular approach to enable smooth integration and iteration of features.
