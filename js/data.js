/* =====================================================================
   Nightwatch of the Islands — data.js
   The island of Malta as a 5x4 grid of 25x15-tile screens, plus items,
   codex entries, dialogue and story.

   TILE LEGEND
     .  ground (region floor)      ,  sand
     ~  deep water (solid)         #  limestone wall / bastion / rock
     T  megalith (solid)           t  tree (solid)
     %  hedge / prickly pear       h  hidden path (hedge until revealed)
     =  stone paving (walkable)    -  wooden jetty (walkable)
     n  house (solid)              +  chapel (solid)
     G  glyph floor (visible in Reveal)
     P  pressure plate             D  door / gate (solid until opened)
     b  beacon (interact)          B  brazier (solid, lit)
     O  boulder (pushable)         C  chest
     S  shade spawn                Z  sentinel spawn
     N  NPC spawn (meta.npcs, scan order)
     @  player start
     F  fish pickup  H  heart pickup  M  magic vial pickup

   EDGE CONTRACT — exits between adjacent screens:
     vertical edges  : rows 6-8 open at col 0 / col 24
     horizontal edges: cols 11-13 open at row 0 / row 14
   ===================================================================== */
(function () {
  'use strict';

  const SCREENS = {};

  // ---------------------------------------------------------------- r0c1
  SCREENS.mellieha = {
    id: 'mellieha', name: 'Mellieħa Heights', region: 'north', floor: '.',
    beacon: 'north', chests: ['codex_mellieha'],
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~.......................#',
      '~..%%%%%%%..............#',
      '~..%..b..%....S.........#',
      '~..%.....%..............#',
      '~..%%%h%%%....%%%%%.....#',
      '~.....h.......%.M.%......',
      '~.....h.......%%%h%......',
      '~........S...............',
      '~.......................#',
      '~....t......t......t....#',
      '~.......................#',
      '~....C........S.........#',
      '~.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r0c2
  SCREENS.stpauls = {
    id: 'stpauls', name: "St Paul's Bay", region: 'north', floor: '.',
    chests: ['codex_stpaul'],
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~',
      '#..................~~~~~~',
      '#......++........~~~~~~~~',
      '#......++.........~~~~~~~',
      '#.................--~~~~~',
      '#..C..............~~~~~~~',
      '.................F..~~~~~',
      '..........S.........~~~~~',
      '....................~~~~~',
      '#...................~~~~~',
      '#...t....t..........~~~~~',
      '#..............S....~~~~~',
      '#...................~~~~~',
      '#...................~~~~~',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r1c0
  SCREENS.goldenbay = {
    id: 'goldenbay', name: 'Golden Bay', region: 'west', floor: ',',
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~,,,,,,,,,,,,,,,,,,,,,,,#',
      '~,,,,,,,,,,,,,,,,,,,,,,,#',
      '~,,,,,,M,,,,,,,,,,,,,,,,#',
      '~,,,,,,,,,,,,,,.........#',
      '~,,,,,,,,,,,,,..........#',
      '~,,,,S,,,,,,,,...........',
      '~,,,,,,,,,,,,,...........',
      '~,,,,,,,,,,,,,...........',
      '~,,,,,,,,,,,,...........#',
      '~,,,H,,,,,,,,.....t.....#',
      '~,,,,,,,,,,,,...........#',
      '~,,,,,,,S,,,,.....M.....#',
      '~,,,,,,,,,,,,...........#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r1c1
  SCREENS.mgarr = {
    id: 'mgarr', name: 'Mġarr Farmlands', region: 'center', floor: '.',
    chests: ['sling'],
    rows: [
      '###########...###########',
      '#.......................#',
      '#..nn...%%%%%%..........#',
      '#..nn...................#',
      '#.......%%%%%%..........#',
      '#.......................#',
      '.........................',
      '.........................',
      '...........Z.............',
      '#.......................#',
      '#...t..t.......C........#',
      '#.......................#',
      '#....H.........t........#',
      '#.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r1c2
  SCREENS.mosta = {
    id: 'mosta', name: 'Mosta', region: 'center', floor: '.',
    chests: ['codex_mosta'],
    rows: [
      '###########...###########',
      '#.......................#',
      '#.........+++...........#',
      '#........+++++..........#',
      '#........+++++..........#',
      '#.........+++...........#',
      '.........................',
      '............S............',
      '.........................',
      '#.......................#',
      '#....C..........M.......#',
      '#.......................#',
      '#..t.........t.......t..#',
      '#.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r1c3
  SCREENS.sliema = {
    id: 'sliema', name: 'Sliema Strand', region: 'harbour', floor: '.',
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~',
      '#..................~~~~~~',
      '#.............=====~~~~~~',
      '#.............=...=~~~~~~',
      '#.....S.......=.M.=~~~~~~',
      '#.............=...=~~~~~~',
      '..............=====~~~~~~',
      '.....................~~~~',
      '....................~~~~~',
      '#...................~~~~~',
      '#......S............~~~~~',
      '#...................~~~~~',
      '#....F..............~~~~~',
      '#...................~~~~~',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r2c0
  SCREENS.dingli = {
    id: 'dingli', name: 'Dingli Cliffs', region: 'west', floor: '.',
    chests: ['heart_container'],
    rows: [
      '###########...###########',
      '~.......................#',
      '~.......................#',
      '~...t........t..........#',
      '~.......................#',
      '~..........Z............#',
      '~........................',
      '~........................',
      '~........................',
      '~......C................#',
      '~.......................#',
      '~~....................~~~',
      '~~~..................~~~~',
      '~~~~~..............~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~'
    ]
  };

  // ---------------------------------------------------------------- r2c1
  SCREENS.mdina = {
    id: 'mdina', name: 'Mdina, the Silent City', region: 'center', floor: '.',
    safe: true, npcs: ['elder1', 'elder2', 'elder3'],
    rows: [
      '###########...###########',
      '#.......................#',
      '#...###############.....#',
      '#...#=B=========B=#.....#',
      '#...#=N====N====N=#.....#',
      '#...#=============#.....#',
      '....#=============#......',
      '....#######=#######......',
      '...........=.............',
      '#..........=............#',
      '#.......................#',
      '#.....t..........t......#',
      '#.......................#',
      '#.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r2c2
  SCREENS.attard = {
    id: 'attard', name: 'Attard Gardens', region: 'center', floor: '.',
    rows: [
      '###########...###########',
      '#.......................#',
      '#..t.t.t.t..............#',
      '#.......................#',
      '#..t.t.t.t......M.......#',
      '#.......................#',
      '.........................',
      '............Z............',
      '.........................',
      '#.......................#',
      '#..............t.t.t.t..#',
      '#.......................#',
      '#.....H.................#',
      '#.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r2c3
  SCREENS.valletta = {
    id: 'valletta', name: 'Valletta & Fort St Elmo', region: 'harbour', floor: '.',
    beacon: 'harbour', doorRule: 'clear', chests: ['buckler'], npcs: ['knight1'],
    rows: [
      '###########...###########',
      '#.......................#',
      '#..nn.nn....#########...#',
      '#...........#=======#...#',
      '#..S........#===b===#...#',
      '#...........#==C====#...#',
      '............####D####....',
      '.........................',
      '..........S..............',
      '#.....S.................#',
      '#...N...................#',
      '#..B...........B........#',
      '#...........S...........#',
      '#.......................#',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r2c4
  SCREENS.grandharbour = {
    id: 'grandharbour', name: 'The Grand Harbour', region: 'harbour', floor: '.',
    chests: ['codex_siege', 'shortsword'],
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~',
      '#............~~~~~~~~~~~~',
      '#..C.........~~~~~~~~~~~~',
      '#............~~---~~~~~~~',
      '#............~~~~~~~~~~~~',
      '#.....S......~~~~~~~~~~~~',
      '.............~~~~~~~~~~~~',
      '.............~~---~~~~~~~',
      '.............~~~~~~~~~~~~',
      '#.B......B...~~~~~~~~~~~~',
      '#...C........~~~~~~~~~~~~',
      '#............~~~~~~~~~~~~',
      '#.....Z......~~~~~~~~~~~~',
      '#.............~~~~~~~~~~~',
      '###########...###########'
    ]
  };

  // ---------------------------------------------------------------- r3c1
  SCREENS.hagarqim = {
    id: 'hagarqim', name: 'Ħaġar Qim & Mnajdra', region: 'south', floor: '.',
    beacon: 'temple', doorRule: 'plates', plateOrder: [1, 2, 0],
    chests: ['flintKnife'], npcs: ['keeper1'],
    rows: [
      '###########...###########',
      '~.......................#',
      '~..TTTTTTT..............#',
      '~..T.....T..............#',
      '~..T..b..T....G.G.G.....#',
      '~..T.....T....P.P.P.....#',
      '~..TTTDTTT...............',
      '~........................',
      '~..............S.........',
      '~....N..................#',
      '~...........C...........#',
      '~.......S...............#',
      '~~......................#',
      '~~~~..................~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~'
    ]
  };

  // ---------------------------------------------------------------- r3c2
  SCREENS.zurrieq = {
    id: 'zurrieq', name: 'Żurrieq & the Blue Grotto', region: 'south', floor: '.',
    rows: [
      '###########...###########',
      '#.......................#',
      '#...t..............t....#',
      '#.......................#',
      '#.........S.............#',
      '#.......................#',
      '.........................',
      '............M............',
      '.........................',
      '#.......................#',
      '#....F.........S........#',
      '#.........~~~~..........#',
      '#........~~~~~~.........#',
      '#.......~~~~~~~~........#',
      '~~~~~~~~~~~~~~~~~~~~~~~~~'
    ]
  };

  // ---------------------------------------------------------------- r3c3
  SCREENS.hypogeum = {
    id: 'hypogeum', name: 'Ħal Saflieni Hypogeum', region: 'under', floor: '.',
    dark: 0.45, chests: ['codex_hypogeum', 'charm'],
    rows: [
      '###########...###########',
      '#.......##......##......#',
      '#..G....##..S...##......#',
      '#.......##......##..C...#',
      '#####...##..##..##......#',
      '#.......##..##..........#',
      '............##...........',
      '.....S......##.....S.....',
      '............##...........',
      '#...##......##......##..#',
      '#...##..C...##......##..#',
      '#...##......##..S...##..#',
      '#.......G......G........#',
      '#...........M...........#',
      '#########################'
    ]
  };

  // ---------------------------------------------------------------- r3c4
  SCREENS.marsaxlokk = {
    id: 'marsaxlokk', name: 'Marsaxlokk', region: 'se', floor: '.',
    npcs: ['fisher1'],
    rows: [
      '###########...###########',
      '#.......................#',
      '#..nn..nn..nn...........#',
      '#.......................#',
      '#....N..@...............#',
      '#..............,,,,,,,,,#',
      '..........,,,,,,,,,,,,,,~',
      '.........,,,,,,,,,-----~~',
      '..........,,,,,,,,,,~~~~~',
      '#.....F...,,,,,,,,~~~~~~~',
      '#.........,,,,,,,~~~~~~~~',
      '#...S.....,,,,,,~~~~~~~~~',
      '#.....F...,,,,,~~~~~~~~~~',
      '#.........,,,,~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~'
    ]
  };

  // ------------------------------------------------------------------
  // WORLD GRID — null = open sea (impassable screen)
  // ------------------------------------------------------------------
  const WORLD = {
    cols: 5, rows: 4,
    grid: [
      [null,        'mellieha', 'stpauls', null,       null],
      ['goldenbay', 'mgarr',    'mosta',   'sliema',   null],
      ['dingli',    'mdina',    'attard',  'valletta', 'grandharbour'],
      [null,        'hagarqim', 'zurrieq', 'hypogeum', 'marsaxlokk']
    ],
    start: 'marsaxlokk'
  };

  // ------------------------------------------------------------------
  // ITEMS — arms & relics across Malta's eras
  // ------------------------------------------------------------------
  const ITEMS = {
    claws: {
      name: 'Harbour Claws', type: 'weapon', icon: 'claws',
      dmg: 1, reach: 20, era: 'Timeless',
      desc: "A cat's first and truest arms — quick, close and quiet. The fishermen of Marsaxlokk swear no rat survives a harbour cat's patience."
    },
    flintKnife: {
      name: 'Flint Knife of the Temple-Builders', type: 'weapon', icon: 'flintKnife',
      dmg: 2, reach: 24, era: 'c. 3600 BC',
      desc: 'Knapped stone such as the builders of Ħaġar Qim carried, five and a half thousand years ago — older than the pyramids of Egypt. It still bites the dark.'
    },
    sling: {
      name: "Shepherd's Sling", type: 'weapon', icon: 'sling',
      dmg: 1, ranged: true, era: 'Bronze Age',
      desc: 'Cord and leather, as island shepherds have used since the Bronze Age villages of Borġ in-Nadur. It casts a smooth stone the length of a field. Press Space to loose.'
    },
    shortsword: {
      name: "Knight's Shortsword", type: 'weapon', icon: 'shortsword',
      dmg: 3, reach: 28, era: 'AD 1565',
      desc: 'A side-arm of the Order of St John, of the kind worn at the walls through the Great Siege. Light enough, the armourer joked, for a cat to carry.'
    },
    buckler: {
      name: 'Buckler of the Order', type: 'shield', icon: 'buckler',
      era: 'AD 1565',
      desc: 'A small round shield bearing the eight-pointed cross — one point for each of the eight langues of the Order. Hold Shift to turn blows from the front.'
    },
    lantern: {
      name: "Guardian's Lantern", type: 'tool', icon: 'lantern',
      era: 'Beyond memory',
      desc: 'Carried first by the keepers of the megalithic temples, trusted later to the Order. Its flame feeds on magic and remembers three arts: Reveal, Repel and Empower.'
    },
    map: {
      name: 'Parchment of the Order', type: 'tool', icon: 'map',
      era: 'AD 1565',
      desc: "A surveyor's chart of the island, drawn for the Order's engineers. Its inks fill themselves in as you wander. Press M to consult it."
    },
    charm: {
      name: 'Hypogeum Charm', type: 'charm', icon: 'charm',
      era: 'c. 4000 BC',
      desc: 'A spiral carved in the manner of the red-ochre paintings of Ħal Saflieni, where the Sleeping Lady dreamed. It deepens the well of your magic. (+50 magic)'
    },
    heart_container: {
      name: 'Heart of the Cliffs', type: 'charm', icon: 'heart',
      era: 'Timeless',
      desc: 'Warmth gathered from the high cliffs of Dingli, where the island stands tallest against the sea. Your courage grows by one full heart.'
    }
  };

  // ------------------------------------------------------------------
  // CODEX — historical notes (found in chests)
  // ------------------------------------------------------------------
  const CODEX = {
    codex_stpaul: {
      title: 'The Shipwreck of St Paul — AD 60',
      body: 'The Acts of the Apostles tells that Paul of Tarsus, bound for trial in Rome, was wrecked upon an island called Melite — Malta. "The islanders showed us unusual kindness," the account records; they lit a fire against the rain and the cold. Tradition holds the landing happened here, in the bay that bears his name, and counts it the beginning of Christianity on the islands.'
    },
    codex_mosta: {
      title: 'The Bride of Mosta — AD 1526',
      body: 'In 1526, corsairs out of Barbary fell upon Mosta and carried hundreds away into slavery — among them, the story goes, a young bride seized on her wedding day, l-Għarusa tal-Mosta. For centuries the coastal watchtowers and the cry "Għassa! Għassa!" — the watch, the watch! — guarded against such raids. The Nightborne are not the first darkness to come off this sea.'
    },
    codex_siege: {
      title: 'The Great Siege — AD 1565',
      body: 'For four months the Ottoman armada, tens of thousands strong, hammered the Order of St John and the Maltese militia. Fort St Elmo fell only after thirty days, bought at terrible price; Birgu and Senglea held until relief came in September. The year after, Grand Master Jean de Valette laid the first stone of a new fortress city upon Mount Sciberras — Valletta, remembered ever since as "a city built by gentlemen for gentlemen".'
    },
    codex_mellieha: {
      title: 'The Sanctuary of Mellieħa',
      body: 'Cut into the living rock above Mellieħa Bay stands one of the oldest Marian shrines of the islands, its fresco said by tradition to be ancient beyond reckoning. For centuries, sailors who survived the sea climbed here barefoot to leave painted ex-votos — small ships, small storms, small miracles — in thanks for light that brought them home.'
    },
    codex_hypogeum: {
      title: 'Ħal Saflieni Hypogeum — c. 4000–2500 BC',
      body: 'Beneath the streets of Paola lies a temple carved downward into the rock: halls, niches and the Holy of Holies, hewn with horn and flint and polished smooth. Some seven thousand of the dead were laid here among red-ochre spirals. From its chambers came the Sleeping Lady — a small clay figure at rest on her side, dreaming for five thousand years. Walk softly; this is a house of sleep.'
    }
  };

  // ------------------------------------------------------------------
  // DIALOGUE
  // ------------------------------------------------------------------
  const DIALOGUE = {
    fisher1: {
      name: 'Toni the Fisherman',
      sprite: 'fisher',
      first: [
        'Xemx! Here you are. Three nights now the sun has not risen, and the luzzu dare not put out — the Eye of Osiris on every prow stares into dark and sees more dark.',
        "The old keeper is gone, little one. Taken by the shadows on the cliff road. And her lantern... she tied it to your collar with her own hands, didn't she. She knew.",
        'Listen. The grey cats of Mdina — the Council of Nine — they remember things we people have forgotten. Follow the coast west past the old underground places, then north through the fields to the Silent City.',
        "Take a fish for the road. Mind the shadows — your claws can cut them, but the lantern burns them better. Press L, and Q to change its working. Il-lejl it-tajjeb... no. Not 'good night'. For a good DAWN, Xemx."
      ],
      again: ['The sea is wrong without stars, Xemx. Find the Nine. North and west — and keep that lantern lit.'],
      won: [
        'XEMX! The sun — look at it! The luzzu can sail again, the painted Eye on every prow blinking in real daylight for the first time in an age.',
        'You did it, little one. The whole quay is talking: a Marsaxlokk cat brought back the dawn. The first catch of the morning is yours — the biggest lampuka in the boat.',
        'Grazzi, Xemx. Grazzi ħafna. Malta will not forget her cats.'
      ]
    },
    elder1: {
      name: 'Geżwita, Elder of the Nine',
      sprite: 'elderCat',
      first: [
        'A young one, with the Guardian flame. So the keepers are ended, and it falls to a cat again.',
        'We came to these islands on Phoenician ships, three thousand years past, rat-catchers and omen-readers both. We were here before the Knights, before the Romans, before the name Malta. We watched it all from the walls.',
        'Cats see in the dark, small sister. That is why the lantern chooses us when all else fails.'
      ],
      again: ['We watched it all from the walls, small sister. Now the walls watch you.'],
      won: [
        'So. The dawn returns, and a cat carried it. Three thousand years we have watched these islands, and rarely have we purred as we do this morning.',
        'Sit a while in the sun with us, small sister. You have earned a warm stone and a long, long sleep.'
      ]
    },
    elder2: {
      name: 'Serafina, First of the Nine',
      sprite: 'elderCat',
      first: [
        'Be still, and hear the whole of it. The island keeps three great flames, older than any one people: the Solstice Flame in the sea-temples of the south, the Watch-Light of St Elmo over the Grand Harbour, and the Cliff Flame above Mellieħa in the north.',
        'The Nightborne rose from the drowned places and smothered all three. While they sleep dark, the sun cannot find the islands, and the dead of old sieges walk.',
        'Your lantern carries the seed-fire. Stand close to each beacon, set the flame to EMPOWER — press Q until it burns gold — and give the fire back. The temple flame is locked behind the old stones; let REVEAL show you the order of their counting.',
        'Go with the blessing of the Nine. We can spare this much—' ,
        '...there. Your wounds are closed and your well is full. Nine lives you have, as we all have. Spend them like a miser, little sun.',
        "One art more, for the road. When your wounds are deep and no fish is near, press R — the Saint's Blessing. The lantern's magic will close your flesh, at the price of forty measures. The saints of this island have always been practical."
      ],
      again: ["Three flames: the sea-temples south, St Elmo east, Mellieħa north. Empower the beacons; R for the Saint's Blessing when wounded. The Nine are watching."],
      won: [
        'The three flames burn as one along the coast, tower to tower, the way they burned when the Order watched for corsair sails. The old signal-line is whole again, and it spells one word: dawn.',
        'We name you now, before all Nine: Xemx, Keeper of the Lantern, Light of the Islands. Carry the flame gently. The night is patient, and may come again — but not today. Today, the island is gold.'
      ]
    },
    elder3: {
      name: 'Mattew, Keeper of Grudges',
      sprite: 'elderCat',
      first: [
        'You will meet two kinds of shadow out there, young one. The small ones — drowned corsairs, raiders the sea kept — they fear the lantern set to REPEL. Burn it blue and they scatter like gulls.',
        'The tall ones in rusted helms were siege-dead once, men who held walls. They do not frighten. Put steel or stone in them, or go around — even a cat need not win every argument.',
        'And mind your nine lives. The Silent City has seen cats spend all nine on pride. The dawn needs you on your feet, not your dignity.'
      ],
      again: ['Blue flame scatters the small shadows. The tall ones want steel. Pride wants nothing — give it nothing.'],
      won: [
        "Hmph. You kept all but two of your nine. Better than most cats manage on a quiet Tuesday, let alone the end of the world.",
        "Don't let it go to your head, Light-of-the-Islands. A hero this morning is still a cat who'll want feeding by noon. ...Well done, though. Truly."
      ]
    },
    knight1: {
      name: 'Fra Henri, Knight Engineer',
      sprite: 'knight',
      first: [
        'A cat. A cat with the Guardian flame at its collar. Sixty years I have served the Order and I am surprised by nothing on this island any longer.',
        'The Nightborne hold Fort St Elmo — as the Turk once held it, bought with thousands of his men, the corsair Dragut himself among the fallen. The gate answers to the fort itself: clear the shadows from this quarter and it will open. That is engineering of a kind I do not pretend to understand.',
        'Within you will find a buckler of the Order — eight points, eight langues, one cross. The watch-beacon stands in the inner court. Give it fire, Guardian, and Valletta keeps its name: a city of light.'
      ],
      again: ['Clear the shadows from the quarter and the fort gate opens. The beacon waits in the inner court.'],
      cleared: ['The gate stands open, Guardian. The buckler is yours by right of arms. Now — the beacon. Light the watch of St Elmo once more.'],
      won: [
        'The watch-light of St Elmo burns again, Guardian, and from these walls I can see all the way to Mellieħa where your third flame answers it. Thousands died holding this fort in 1565. You held it with a lantern and nine lives.',
        'The Order builds in stone, but you have built in light. Whatever you are — cat, guardian, omen — Valletta keeps its name this morning because of you. A city of light. Go and rest, brave one.'
      ]
    },
    keeper1: {
      name: 'Mara, of the Temple Line',
      sprite: 'keeper',
      first: [
        "My family has watched these stones since before counting, cat-of-the-lantern. Ħaġar Qim above, Mnajdra by the sea — raised when the world was young, aligned to the turning year — at the equinoxes the dawn walks straight up Mnajdra's great doorway.",
        'The temple flame sleeps behind the old door, and the door answers the three standing-stones. They must be pressed as the builders counted — but the counting is carved in lantern-light only.',
        'Set your flame to REVEAL and read the marks above the stones: one, two, three, as the glyphs show. Tread them in order. Tread wrongly and the stones forget, and you must begin again.',
        'When the flame returns to the temples, the south remembers the sun. Go. The stones have waited five thousand years; they should not wait longer.'
      ],
      again: ['REVEAL shows the counting above the standing-stones. Tread them in the carved order — the glyphs are I, II and III.'],
      won: [
        'Come, stand with me at Mnajdra and watch. This morning the equinox sun walks the great doorway as it has for five thousand years — but this time my family did not fear it would be the last dawn.',
        'The temple-builders are gone, Light-of-the-Islands, but their stones remember the sun because you gave it back to them. That is a keeping older than the Order, older than the Knights — the oldest keeping of all.'
      ]
    }
  };

  // ------------------------------------------------------------------
  // STORY BEATS
  // ------------------------------------------------------------------
  const STORY = {
    intro: {
      title: 'The Night That Stayed',
      body: 'On the eve of the Festival of Lights, the three great beacons of Malta went out, and the dawn did not come. From the drowned places rose the Nightborne — shadows of corsairs and siege-dead — and the islands fell under a curse of endless night.<br><br>The last lantern-keeper is gone. But on the quay at Marsaxlokk, among the painted luzzu, her lantern still burns — tied to the collar of a small ginger cat with nine lives and no intention of wasting them.<br><br>You are Xemx — "Sun" in the old tongue. Bring back the dawn.'
    },
    beacon1: {
      title: 'One Flame Against the Dark',
      body: 'Far across the island, something shifts. The first beacon burns again, and for a heartbeat the night thins — the stars of the old constellations show through, the ones the navigators steered by. Two flames remain. The Nightborne know it too; the dark grows watchful.'
    },
    beacon2: {
      title: 'The Night Gives Ground',
      body: 'Two beacons answer each other across the island now, as they answered for centuries — watchtower to watchtower, the old signal-line that warned of corsair sails. One flame remains. On the wind, very faintly, something that might be morning.'
    },
    victory: {
      title: 'Dawn Returns',
      body: 'The third beacon takes the fire, and light runs along the coast like a fuse — tower to tower, bay to bay, the whole ancient signal-line of the islands blazing at once. The Nightborne thin into mist and are gone with the tide.<br><br>And then, for the first time in an age: the sun, lifting out of the sea beyond Marsaxlokk, finding the limestone and turning the whole island gold. In Mdina, nine grey cats watch from the bastions and say nothing, which is how cats applaud.<br><br>Xemx — Sun — you have earned your name, and a very long nap.'
    },
    gameover: {
      title: 'The Ninth Life',
      body: 'Even a cat of Malta has only nine lives, and the night has taken them all. But the islands are patient — they have outlasted sieges, corsairs and empires — and somewhere on the quay at Marsaxlokk, a lantern waits to be carried again.'
    }
  };

  // ------------------------------------------------------------------
  // PARCHMENT MAP — stylised Malta outline (560x430 canvas coords)
  // ------------------------------------------------------------------
  const MAP_OUTLINE = [
    [70, 60], [105, 70], [115, 85], [125, 102], [142, 82], [170, 88],
    [185, 95], [196, 116], [216, 96], [255, 110], [295, 122],
    [320, 130], [326, 150], [355, 150], [377, 165], [350, 182],
    [342, 192], [368, 207], [400, 222], [430, 240],
    [422, 278], [452, 300], [432, 330], [400, 345],
    [330, 360], [250, 350], [220, 345], [185, 322],
    [150, 300], [125, 258], [110, 230], [122, 200], [96, 186],
    [80, 150], [75, 120]
  ];

  const MAP_POS = {
    mellieha: [138, 100], stpauls: [200, 115], goldenbay: [118, 205],
    mgarr: [163, 160], mosta: [228, 160], sliema: [313, 152],
    dingli: [158, 285], mdina: [193, 220], attard: [248, 212],
    valletta: [348, 172], grandharbour: [368, 212],
    hagarqim: [228, 328], zurrieq: [268, 330], hypogeum: [328, 262],
    marsaxlokk: [418, 298]
  };

  const BEACON_INFO = {
    temple: { screen: 'hagarqim', label: 'Solstice Flame' },
    harbour: { screen: 'valletta', label: 'Watch-Light of St Elmo' },
    north: { screen: 'mellieha', label: 'Cliff Flame of Mellieħa' }
  };

  window.DATA = { SCREENS, WORLD, ITEMS, CODEX, DIALOGUE, STORY, MAP_OUTLINE, MAP_POS, BEACON_INFO };
})();
