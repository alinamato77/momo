# Momo

Momo is a plush personal agent that adapts how it talks to you. This repo holds the
onboarding for its first 60 seconds: pick a tone, see the advice change, decide what
Momo remembers, then manage it in My Memory.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Website version. Loads Momo from the Spline scene, swaps in a rounder body, and drives its reactions from the page. |
| `prototype/index.html` | Same flow without Spline. Uses the bundled model file, so it also works where spline.design is blocked. |

Both pages need an internet connection for three.js (and, for `index.html`, the Spline runtime).

## The flow

1. **Pick a style.** Tough, Neutral or Soft. Pointing at a style makes Momo answer in it.
2. **See the change.** Today's clothing advice in the chosen wording, next to the neutral version. Undo restores the default.
3. **Decide memory.** Remember the style or not, and suggest clothes automatically or only when asked. Nothing is preselected.
4. **My Memory.** Change each setting, see whether it is saved or temporary, or clear everything.

Saved preferences stay in the current browser (`localStorage`, key `momo.prefs.v1`).
The weather is demo data.

## Momo's colour and reactions

| Tone | Colour | Resting motion |
|---|---|---|
| Neutral | yellow `#FBDA62` | gentle float |
| Soft | orange `#FF8C3A` | slow sway, happy squint |
| Tough | yellow-green `#AFCB2E` | still, small precise nods |

Choosing, undoing, saving, clearing memory and clicking Momo each trigger their own
animation (nod, hug, spin, tuck, wave, bow, dizzy spin, drop-in, hop).

## Spline scene

- Scene: `https://prod.spline.design/GA7oYNDm83hS4Dfl/scene.splinecode`
- Runtime: `@splinetool/runtime@2.0.125` (the scene uses file format 135; older runtimes read 133–134).
  After re-exporting from Spline, bump this version if the console says the runtime is too old.
- At load the page hides the flat star body and adds a puffy one built from the star's own outline
  (`src/puffy.js`), turns the star to face the camera, and swaps the light-grey eyes and mouth for
  dark ones. The eyes stay in Spline's `Eyes` group, so the scene's blink still drives them.
- The Spline runtime ignores colour changes on existing meshes, so each tone has its own body and
  the page shows one at a time.

## Editing

Edit `src/momo.html` (page, styles, flow) or `src/puffy.js` (body shape), then rebuild:

```sh
python3 build.py
```

To try it locally, serve the folder (for example `python3 -m http.server`) and open
`http://localhost:8000/` or `/prototype/`.
