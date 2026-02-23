# TTS Engine

Provides voice-guided navigation prompt generation for the Staff Engineer Auto
navigation loop (Phase 1 MVP).

Prompts are plain-text strings that can be passed to any downstream TTS engine
(e.g. `AVSpeechSynthesizer` on iOS / CarPlay).

## Exported Functions

| Function | Description |
|---|---|
| `formatDistance(metres)` | Converts a metre value to a human-readable string |
| `generateTurnPrompt(direction, distanceMetres)` | Turn instruction prompt |
| `generateArrivalPrompt([destination])` | Arrival notification prompt |
| `generateRecalculatingPrompt()` | Route recalculation prompt |
| `generateSpeedWarningPrompt(speedLimit)` | Speed limit warning prompt |
