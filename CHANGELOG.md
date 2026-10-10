# Changelog

All notable changes to **SubSync Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-10

### Added
- **Core Subtitle Engine**:
  - Millisecond-precision SRT parser and serializer with sequential renumbering.
  - Subtitle validator detecting timing overlaps, negative durations, and invalid ranges.
  - Comprehensive unit test suite covering parser, serializer, and timecode calculations.

- **Interactive Timeline**:
  - Horizontal zoomable timeline with second and millisecond ruler ticks.
  - Real-time audio waveform background visualizer.
  - Quick millisecond offset shifting (`-500ms`, `-100ms`, `+100ms`, `+500ms`).
  - **Magnetic Snapping (SYNC-05)**:
    - Smart boundary attraction when dragging and resizing subtitle blocks.
    - Snaps adjacent cue start/end edges together (0ms overlap) and aligns to playhead.
    - Visual emerald guide line with timecode display during snapping.
    - Dedicated toolbar toggle button and `Alt` key bypass for freeform micro-adjustments.

- **Workspace & Layout**:
  - **Resizable Split View**: Interactive draggable divider between Video Player and Subtitle Editor with persistence and double-click reset.
  - HTML5 video playback with local file streaming via custom `media-loader://` protocol.
  - Subtitle Table editor with search & replace, duration indicators, and quick seek buttons.
  - Full support for Dark (Space Indigo) and Light themes with persistent preference.

- **Project Management**:
  - Project creation dialog with options to attach primary video and initial subtitle SRT files.
  - Empty starting state allowing users to build or import from scratch.
  - Recent projects history.

- **Internationalization (i18n)**:
  - Complete Arabic (`ar`) and English (`en`) bilingual localization with automatic RTL/LTR layout mirroring.

- **Branding & Desktop Integration**:
  - Custom vector logo matching approved design specifications.
  - App icons adhering to macOS Human Interface Guidelines (squircle grid) across macOS Dock, Windows taskbar (`.ico`), and window titlebars.
  - Native desktop notifications with audio chime on macOS, Windows, and Linux.

- **Packaging & Distribution**:
  - Release build configurations using `electron-builder` for macOS (`dmg`, `zip`), Windows (`nsis`), and Linux (`AppImage`, `deb`).
