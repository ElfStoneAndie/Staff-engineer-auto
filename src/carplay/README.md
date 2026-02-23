# CarPlay UI Compliance

Utilities for building Apple CarPlay-compliant user interfaces and validating
navigation flows against Apple's Human Interface Guidelines (Phase 1 MVP).

## Exported Functions

| Function | Description |
|---|---|
| `validateRouteForCarPlay(route)` | Checks a route object meets CarPlay display requirements |
| `buildCarPlayScreen(route, [title])` | Builds a CarPlay-compliant screen descriptor |
| `validateUserFlow(steps)` | Validates a user flow against Apple's interaction step limit |
