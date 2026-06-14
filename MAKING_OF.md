# Making Of — Nightwatch of the Islands
### One human, one agent fleet, one day. A case study in agentic development.

**Steven Parr — "The Human In The Loop"** · stevenparr.online · part of [MaltaQuest.Online](https://maltaquest.online)

---

## What was built (12 June 2026, one working day)

A complete, polished, *deployed* Zelda-style action-adventure:

- **A real Malta**: 15 hand-authored zones arranged as the actual island — Marsaxlokk to Mdina
  to Mellieħa — with genuine history in every codex chest (the Great Siege of 1565, the Ħal
  Saflieni Hypogeum, St Paul's shipwreck, the Bride of Mosta).
- **A cat with nine lives**: Xemx, a Marsaxlokk harbour cat carrying a guardian's lantern.
  Malta's famous cats earned the lead role; the Council of Nine elder cats hold court in the
  Silent City. Nine lives stopped being a metaphor and became the lives system.
- **Systems**: three-mode lantern magic on a mana meter, period-correct weapons (flint knife →
  shepherd's sling → Knight's shortsword), a plate-order temple puzzle, a kill-gated fort, a
  dash-and-punish boss (the Siege Wraith), localStorage saves, fog-of-war parchment map.
- **Original music**: a fully procedural WebAudio score in Phrygian dominant — lute plucks,
  drones, duff-drum — with six situational themes and a player mixer. No audio files shipped.
- **Mobile**: floating-joystick touch controls, visual-viewport fitting (including a
  Chrome-specific body-height bug, found via a user's "works in Edge" report), and a full
  installable PWA — manifest, offline service worker, launcher icon generated *from the game's
  own sprite at runtime*.
- **Production deploy**: nginx/Traefik/Let's Encrypt on a VPS behind nightwatch.maltaquest.online.

## How — the human-in-the-loop method

1. **The human sets direction; agents execute and verify.** Every feature began as a paragraph
   of intent ("like A Link to the Past, but real Malta, and maybe the hero is a cat").
2. **Multi-agent adversarial review.** After the build, a fleet of reviewer agents attacked the
   game across four dimensions (engine correctness, world-data integrity, historical accuracy,
   UX). Every finding was then handed to *refuter* agents whose only job was to disprove it.
   11 of 12 findings died in verification; the one survivor was a genuine, nasty pause-state
   bug — fixed and regression-tested the same hour.
3. **Headless verification over vibes.** The game exposes a test hook (`NW.step(n)`) so the
   entire quest chain — dialogue, puzzles, boss AI, saves, death — was driven and asserted
   programmatically in a real browser, with exact numbers (a dodged boss dash staggers; claws
   in the punish window deal exactly 2; a joystick drag moves the cat at exactly 92px/s).
4. **Institutional memory.** Decisions, gotchas and architecture live in a cross-agent memory
   palace (Mempalace), so any agent — Claude Code, Codex, Hermes — can resume any lane cold.
5. **Honest failure notes.** A single unescaped apostrophe (`Mnajdra's`) in a single-quoted
   string silently killed a whole script file — invisible to the console tooling. The lesson
   (`node --check` after every edit; double-quote prose) is now part of the standing method.

## Why it matters

This is the working proof behind the pitch: **high-velocity code, human-centred logic.**
A one-person studio with an agent fleet ships in days what used to take a quarter — without
surrendering accountability, historical accuracy, or taste.

*Want something built like this? → [stevenparr.online](https://stevenparr.online) — Book a Vibe Check.*
*Want to explore the real Malta this game is drawn from? → [maltaquest.online](https://maltaquest.online)*
