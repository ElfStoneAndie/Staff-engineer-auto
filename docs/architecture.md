# Architecture Overview

This document outlines the architectural design of the Staff Engineer Auto project. The purpose of the architecture is to ensure scalability, maintainability, and compliance with project goals.

## High-Level Components
1. **Navigation Core** (`src/navigation/`): Responsible for generating and managing route paths.
2. **TTS Engine** (`src/tts/`): Provides voice-guided navigation instructions.
3. **CarPlay Interface** (`src/carplay/`): Ensures compliance with Apple guidelines.
4. **Hazard Detection** (`src/hazard_detection/`): AI-driven detection of hazard zones along a route.
5. **GitHub Integration** (`src/github_integration/`): Authenticated GitHub API helpers for autonomous workflow management.

## Navigation Engine

The navigation engine (`src/navigation/index.js`) provides the core route-planning logic for the navigation loop.

### Key Functions

| Function | Description |
|---|---|
| `isValidCoordinate(coord)` | Validates that a GPS coordinate has numeric `lat`/`lng` within legal WGS-84 ranges (lat: −90…90, lng: −180…180). |
| `generateRoute(origin, destination)` | Produces a direct two-waypoint route object from origin to destination. |
| `generateRandomisedRoute(origin, destination, waypointPool)` | Selects one intermediate waypoint at random from `waypointPool` and inserts it between origin and destination. Falls back to a direct route when the pool is empty or all pool entries are invalid. |
| `haversineDistanceKm(a, b)` | Calculates the great-circle distance in kilometres between two GPS coordinates using the Haversine formula. |
| `routeDistanceKm(route)` | Sums the Haversine distances between each consecutive pair of waypoints in a route. |

### Route Object Shape

```js
{
  origin:      { lat: number, lng: number },
  destination: { lat: number, lng: number },
  waypoints:   Array<{ lat: number, lng: number }>,
  type:        'direct' | 'randomised',
}
```

## TTS Engine

The TTS engine (`src/tts/index.js`) generates plain-text voice prompts that are ready to be passed to any downstream speech-synthesis API (e.g. `AVSpeechSynthesizer` on iOS/CarPlay, or the Web Speech API).

### Key Functions

| Function | Description |
|---|---|
| `formatDistance(metres)` | Converts a raw metre value to a human-readable string: values below 1 000 m are shown as metres, values ≥ 1 000 m are shown in kilometres to one decimal place. |
| `generateTurnPrompt(direction, distanceMetres)` | Returns a spoken turn instruction, e.g. `"In 200 metres, turn left."` Accepted directions: `left`, `right`, `straight`, `u-turn`. |
| `generateArrivalPrompt(destination?)` | Returns an arrival announcement. Includes the optional destination name when provided. |
| `generateRecalculatingPrompt()` | Returns a fixed recalculation notice for use when the user deviates from the planned route. |
| `generateSpeedWarningPrompt(speedLimit)` | Returns a speed-limit advisory, e.g. `"Speed limit is 60 kilometres per hour."` |

### Integration with the Navigation Loop

```
GPS fix → Navigation Engine (route/waypoint calculation)
                │
                ▼
          TTS Engine (prompt generation)
                │
                ▼
     AVSpeechSynthesizer / Web Speech API (audio output)
```

The navigation loop calls the TTS engine at each waypoint transition and whenever a hazard is detected, rerouting is triggered, or a speed-limit zone is entered.

## CarPlay UI Compliance

The CarPlay module (`src/carplay/index.js`) validates routes and user flows against Apple's Human Interface Guidelines before they are rendered on the CarPlay display.

- Maximum list items per screen: **12** (Apple guideline).
- Maximum interaction steps per driving task: **3** (Apple guideline).

## Hazard Detection

The hazard detection module (`src/hazard_detection/index.js`) operates on top of the navigation engine's Haversine distance helper and accepts an array of circular hazard-zone descriptors.

```js
// Hazard zone descriptor shape
{
  centre:   { lat: number, lng: number },
  radiusKm: number,
  type:     string,   // e.g. 'construction', 'roadwork', 'flooding'
}
```

## CI/CD Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Checkout** — `actions/checkout@v4`
2. **Node.js setup** — `actions/setup-node@v4`, Node.js 18
3. **Install** — `npm install`
4. **Unit tests** — `npm test` (Jest with `--experimental-vm-modules` for ES module support)

## Modular Design

Each module is a self-contained ES module (`export`/`import` only — no `require()`). Modules communicate through plain JavaScript objects; there are no shared singletons or global state. This keeps each module independently testable and deployable.

## Flow Diagram

```
┌─────────────────────┐
│  GitHub Integration │  ← Autonomous workflow management (branch, PR, file CRUD)
└─────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Navigation Loop                                         │
│                                                          │
│  GPS Input ──► Navigation Engine ──► Route Object        │
│                       │                    │             │
│                       ▼                    ▼             │
│              Hazard Detection         TTS Engine         │
│                       │                    │             │
│                       └────────┬───────────┘             │
│                                ▼                         │
│                       CarPlay UI Compliance              │
│                                │                         │
│                                ▼                         │
│                     CarPlay Screen / Audio Output        │
└──────────────────────────────────────────────────────────┘
```
