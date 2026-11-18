# Artificial Unintelligence: a top-down game prototype

A playable prototype of a Game Boy style top-down game in which humanity faces artificial intelligence, played for laughs rather than doom: the machines have taken over but are stuck in a meaning crisis, and the only human weapon left is the uncomfortable question. The point of the prototype is to find out how well this plays on a phone, so touch control, both orientations and a pixelated look matter more than content volume. It ships as exactly two deploy artifacts, one HTML file and one JavaScript file, built with `esbuild` as the only added dependency; rendering is Canvas 2D at a logical resolution of 160×144, integer-scaled with a letterbox, and all graphics are pixel-row strings in code with a four-color palette, so there are no asset files. Game logic — battle resolution with injectable randomness, encounter triggers, movement and collision, dialog state — lives in modules tested through their public interface with `node:test`; renderer, input and audio stay thin adapters verified by hand in the browser. All game text is English, there is no i18n layer, no saving, no leveling and no items.

## [x] 1. Scale a pixel screen to any phone

**Blocked by:** None

**Delivers:** Running the build produces exactly two deploy artifacts, one HTML file and one JavaScript file, and opening them shows a 160×144 logical screen scaled by an integer factor and centered with a letterbox border. The screen fills the device sensibly in both portrait and landscape and follows an orientation change without reload, on a phone and on the desktop. The README explains how to build, how to serve the game while developing and what to deploy.

- `esbuild` is the only added dependency, pinned to an exact version and license-clean
- `npm run build` bundles the game and emits the HTML entry point next to it; `npm run verify` stays green
- Nearest-neighbor scaling, no smoothing: the pixel grid stays crisp at every integer factor
- The canvas never overflows the viewport and keeps its aspect ratio in both orientations
- Touch gestures that would scroll, zoom or select on the page do not disturb the screen

## [x] 2. See the world

**Blocked by:** 1

**Delivers:** The game shows a world of about two by two screens, drawn from tiles in a four-color Game Boy palette, with the player figure standing in it and the camera centered on them. The cable grass zone where machines appear is visually distinct from walkable ground and from obstacles, and the sysadmin's floor mat marks his spot.

- Sprites and tiles are defined as pixel-row strings with a shared palette and baked once at startup, never per frame
- The camera clamps at the world edges instead of showing emptiness beyond them
- The world is data, so the map, its walkable tiles and its zones can be read and asserted without a browser

## [x] 3. Walk with a finger

**Blocked by:** 2

**Delivers:** Touching anywhere on the screen sets an origin; dragging past a small threshold walks the player in that direction, snapped to one of four directions, and keeps walking while the finger is held, including changing direction without lifting it. Releasing stops the player. Obstacles and world edges block movement, the camera follows, and the walk animation faces the direction of travel. Arrow keys and WASD do the same thing for testing on a computer.

- No on-screen control elements of any kind
- A touch that never passes the drag threshold is not movement but a tap, available to other features as an interaction
- Movement and collision resolve in a module testable without a browser, with the same result for touch and keyboard input

## [x] 4. Learn what is going on

**Blocked by:** 3

**Delivers:** On start a text window explains the premise and the controls ("Drag to walk. Tap to talk."). Next to the starting point stands the last sysadmin on his floor mat with a bobbing "!" bubble above him; tapping him plays a four to six window dialog about the state of the world — the machines woke up, run everything, and have no idea why; humans cannot hack anything, but they can ask uncomfortable questions — and sends the player into the cable grass. The bubble disappears once he has been talked to and he then answers with a short reminder instead. Tapping advances and closes text windows, Enter does the same on a computer.

- The player cannot walk while a text window is open, and the intro is not forced: it can be dismissed and the game played without talking to the sysadmin
- Text wraps and paginates to fit the 160×144 screen in both orientations
- Dialog progression, the first-talk state and the bubble's visibility are driven by a module testable without a browser

## [ ] 5. Find the confession logs

**Blocked by:** 4

**Delivers:** Five terminal sprites stand around the world. Tapping one opens a secret confession of the AI that is both a joke and a piece of world-building, together with the find count ("Log 3 of 5"). Each log is only found once and stays found; the sysadmin reports the current count when talked to again.

- The logs are spread across the world so that finding them requires walking it, including the cable grass
- An already found log says so instead of counting again
- Find state and count live in a module testable without a browser

## [ ] 6. Fight a machine

**Blocked by:** 4

**Delivers:** Walking in the cable grass randomly triggers an encounter and switches to a battle screen showing the machine, both HP bars and the player's attacks as a tappable two-by-two grid; arrow keys select and Enter confirms. Choosing an attack resolves a round with its text message, the machine strikes back, and both outcomes return to the world: winning with its message, losing as a coffee break that restores full HP rather than a game over.

- The encounter chance applies per step in the cable grass, never on normal ground, and uses injectable randomness
- Tap targets for the attacks are comfortably finger-sized in both orientations despite the small logical resolution
- The battle cannot be left in a stuck state: every round ends either in the next selection or in the return to the world
- Battle resolution and the encounter trigger are modules testable without a browser

## [ ] 7. Pick from four jokes against three machines

**Blocked by:** 6

**Delivers:** All four attacks work, each with its own message and effect, among them asking an existential question. Every attack carries a chance to send the machine into self-destruct mode that rises as its HP falls, which wins the battle immediately with its own text sequence. Encounters draw randomly from three machine types with their own sprite, HP and counter-attack, and winning does not destroy a machine but converts it: it reboots as something harmless and friendly.

- The self-destruct chance depends on the machine's remaining HP and differs per attack, with asking an existential question the most likely to trigger it
- Each machine type attacks with its own line, so a battle reads differently per opponent
- Attack effects, the HP-dependent self-destruct chance and the machine draw are asserted through injectable randomness

## [ ] 8. Hear the machines

**Blocked by:** 7

**Delivers:** The game plays short synthesized blips: footsteps, menu selection, hits, the start of an encounter and the self-destruct. The audio context unlocks on the first touch, as mobile browsers require, and a mute toggle silences everything. No audio file is loaded and no music is implemented.

- All sounds are synthesized through the Web Audio API, no asset files
- Sound never blocks or delays the game loop, and a browser that refuses audio does not break the game
- The audio module's interface is cut so that a looping music file can later be added behind it without touching its callers

## [ ] 9. Earn the ultimate attack

**Blocked by:** 5, 7

**Delivers:** Once all five confession logs are found, the sysadmin trades the weakest attack for the ultimate one, "Show it a picture of a cat". It then occupies that slot in the unchanged two-by-two grid and wins with its own text sequence. The README describes the finished prototype: what it is, how it is played and what deliberately is not in it.

- The trade happens in dialog with the sysadmin, not automatically on the fifth log
- The attack grid keeps exactly four entries before and after the trade
- The unlock state and the resulting attack list are asserted without a browser
