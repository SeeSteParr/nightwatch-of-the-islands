# Nightwatch of the Islands 🏮🐈

A **Zelda-style action-adventure set on a mythic, historically-grounded Malta.** Play as
**Xemx**, a Marsaxlokk harbour cat with nine lives and a guardian's lantern, crossing the real
map of the island — Marsaxlokk, the Hypogeum, Valletta, Mdina, Ħaġar Qim, Mellieħa — to lift a
curse of endless night and relight the three great beacons.

**▶ Play it now: [nightwatch.maltaquest.online](https://nightwatch.maltaquest.online)**
*(Install it from the browser for fullscreen + offline play.)*

Part of **[MaltaQuest.Online](https://maltaquest.online)** — discover Malta's hidden heritage.

---

## Features

- **A real island.** 15 hand-authored zones laid out like the actual map of Malta, with genuine
  history in every chest: the Great Siege of 1565, the Ħal Saflieni Hypogeum, St Paul's
  shipwreck, the Bride of Mosta.
- **Nine lives, literally.** Malta's famous cats take the lead; the Council of Nine elder cats
  guide you from Mdina, the Silent City.
- **Lantern magic.** Three modes on a mana meter — Reveal (hidden paths & glyphs), Repel
  (scatter shadows), Empower (relight beacons).
- **Period-correct arms.** Flint knife → shepherd's sling → Knight's shortsword + buckler of the
  Order, each with a historical note.
- **A boss, puzzles, a story.** The Siege Wraith of St Elmo, a standing-stone plate puzzle, a
  full intro-to-dawn narrative, a castable Saint's Blessing heal.
- **Original procedural music.** A WebAudio score in Phrygian dominant — no audio files shipped.
- **Plays everywhere.** Keyboard on desktop, touch joystick on mobile, installable PWA, saves
  to your device.

## Controls

| | |
|---|---|
| **Move** | WASD / Arrows / on-screen joystick |
| **Attack** | Space |
| **Shield** | Shift (hold) |
| **Lantern** | L (on/off) · Q (cycle Reveal/Repel/Empower) |
| **Interact** | E (talk · open · light beacons) |
| **Heal** | R (Saint's Blessing — 40 magic) |
| **Map / Satchel** | M / I |

## Run it locally

No build step — it's plain HTML/JS/Canvas.

```bash
node serve.mjs       # → http://localhost:3033/
```

## How it's built

`index.html` + four scripts, zero dependencies:

| File | Role |
|---|---|
| `js/sprites.js` | Procedural 16×16 pixel-art sprites (drawn in code) |
| `js/data.js` | The Malta world — 15 screens, items, codex, dialogue, story |
| `js/game.js` | Engine: physics, combat, lantern, enemies, puzzles, saves, HUD |
| `js/music.js` | Procedural Maltese-mode WebAudio score |
| `js/touch.js` | Mobile joystick + action buttons |

See **[MAKING_OF.md](MAKING_OF.md)** for the story of how this was built in a single day with a
human-in-the-loop AI agent fleet — and why that matters.

## License

MIT — see [LICENSE](LICENSE). Built in Malta's honour by
[Steven Parr](https://stevenparr.online). The **MaltaQuest** brand and the Heritage Hunter
platform are separate and not covered by this license.

## Contributing

Issues and PRs welcome. Good first quests: a new enemy type, a Gozo / Ġgantija island, more
codex history, accessibility improvements.
