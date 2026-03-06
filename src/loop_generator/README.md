# Loop Generator

Modular closed-loop circuit generation primitives, integrated from the
**UltraOmegaLoopGenerator** framework for use in the Staff Engineer Auto
automation pipeline and the **Hey Marley** app.

## Purpose

This module provides reusable building blocks for AI-driven generation of
fictional street-circuit specifications.  It is the canonical Step 2
deliverable for UltraOmegaLoopGenerator reference integration, establishing
the foundation for Phase 3 multi-agent orchestration.

## Exported API

| Function | Description |
|---|---|
| `createLoopSpec(params)` | Create a loop spec from UltraOmegaLoopGenerator-style input parameters |
| `validateLoop(loop)` | Validate that a loop is closed and uses no repeated consecutive streets |
| `generateSectorWaypoints(loop, numSectors?)` | Split waypoints into numbered sectors for lap narration (default: 3) |
| `isWithinTargetLength(loop)` | Check whether the loop's Haversine distance falls within its target mile range |

## Parameter Reference (`createLoopSpec`)

| Field | Type | Values |
|---|---|---|
| `city` | `string` | Any city/region name |
| `minLengthMiles` | `number` | Minimum circuit length in miles |
| `maxLengthMiles` | `number` | Maximum circuit length in miles |
| `trackType` | `string` | `Technical` · `Flow` · `Stop-Start` · `Mixed` · `Street-Car Focused` |
| `seriesFocus` | `string` | `Formula One` · `MotoGP` · `Mixed` |
| `direction` | `string` | `Clockwise` · `Counter-Clockwise` |
| `waypoints` | `Array` | Ordered `{ lat, lng, streetName? }` objects (≥ 3); first === last for a closed loop |

## Integration

- Imports `haversineDistanceKm` from `../navigation/index.js` for accurate
  distance calculations.
- Loop specs can be enriched with hazard data via
  `src/hazard_detection/index.js` for AI-aware circuit safety analysis.
- Designed for voice narration output via `src/tts/index.js` (sector
  call-outs, arrival at start/finish).

## Reusability for Hey Marley App

The `createLoopSpec` / `validateLoop` pair maps directly to the
**Architect Agent** in the Hey Marley multi-agent system.
`generateSectorWaypoints` feeds the **Voice Agent** with structured sector
data for TTS narration.  `isWithinTargetLength` is used by the **QA Agent**
to enforce UltraOmegaLoopGenerator circuit-length constraints before
confirming a design to the user.
