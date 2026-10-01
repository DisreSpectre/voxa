# Voxa Domain Context & Vocabulary

This document defines the key terms, architecture, and concepts used throughout the Voxa project.

## Core Concepts & Vocabulary

- **Orb**: The circular, holographic animated sphere rendered on an HTML5 canvas. It serves as the primary visual presence of the Voxa assistant, reacting with pulsing lights and particle effects to speech states and audio volume.
- **Panel (Accompanying Window)**: The glass-morphic card that sits beside or above the orb. It houses the status indicator ("Idle", "Listening", "Speaking"), waveform meter, settings gear, transcript line ("Tap the orb to start"), and expandable chat feed.
- **Dock**: The container element combining the Orb and the Panel into a desktop widget.
- **Compact Taskbar Mode**: An ultra-minimal display mode where only the Orb is visible on or directly above the Windows 11 taskbar (tailored for Windows 11's compact taskbar setting), with the accompanying Panel hidden until triggered by user interaction (click or hover).
- **Flyout**: A temporary window or panel that pops up right above the taskbar when triggered, and tucks away when dismissed or when clicking outside.
- **Harness**: The lightweight local Node.js server running in the background (default port `3010`). It manages external integrations ("connectors"), notes memory, and session transcripts.
- **Connectors**: Modular plugin modules in `packages/harness/connectors/` that provide voice tools to the model (e.g. `websearch`, `weather`, `memory`, `system-stats`).
- **Session**: A live audio/text communication channel between the user and the AI model (Gemini Live WebSocket, OpenAI Realtime WebRTC, or local daemon).
- **MediaStream / MicTrack**: The browser/OS audio input stream acquired via `navigator.mediaDevices.getUserMedia`. When active, Windows displays a microphone icon in the taskbar notification tray.
- **PTT (Push-To-Talk)**: A microphone control mode where audio is only captured and sent while the operator explicitly holds down a hotkey or button.
- **VAD (Voice Activity Detection)**: Automated detection of speech onset and silence to determine conversational turns without holding a button.
