# Dialogue Video Series — Remotion project

This renders the "Socratic metaphor dialogue" video format (teal & terracotta
mascots, dam & river script) as a 1080x1920 portrait MP4, and is wired up to
render automatically on GitHub's free servers instead of your laptop.

## What's in here

- `src/Character.tsx` — the reusable ZooZoo-style mascot (color + role = curious/wise as props)
- `src/DialogueVideo.tsx` — the video template: star background, title banner, text + voice reveal, character highlight
- `src/scripts/dam.content.json` — the first script's actual words (speaker + text + which voice each speaker uses)
- `src/scripts/dam.timings.json` — auto-generated: how long each line should stay on screen, measured from its real voice clip
- `src/scripts/dam.ts` — glues the above two together into what the video template needs
- `scripts/generate_audio.py` — turns `dam.content.json` into voice clips (`public/audio/dam/line-N.mp3`) using [edge-tts](https://github.com/rany2/edge-tts), a free, no-API-key wrapper around Microsoft Edge's neural "Read Aloud" voices
- `src/Root.tsx` — registers the video so Remotion knows its size/length
- `.github/workflows/render-video.yml` — the GitHub Action that generates the voices and renders the video in the cloud

### Changing the voices

`dam.content.json` has `"voiceA"` and `"voiceB"` fields — swap either one for
any other edge-tts voice name (run `edge-tts --list-voices` if you ever set
up Python locally to see the full list; it covers dozens of languages and
accents, including several Indian-English and Hindi voices).

### The flowing river + dam backdrop

Between the title banner and the speech bubbles, the dam script shows a
thin animated backdrop: a teal river with scrolling current lines and a
simple concrete dam, with droplets falling from its spillway — all drawn
with code (SVG shapes), not a video or GIF, so it renders crisply and loops
for free. It's controlled by one prop: in `src/Root.tsx`, `riverDam: true`
turns it on for the `DamDialogue` composition. A future script with a
different metaphor just leaves that prop out (or sets it to `false`) and
gets the plain starry background instead — the scene itself lives in
`src/DialogueVideo.tsx` as the `RiverDamScene` component, in case you ever
want a matching backdrop for another script.

### Background music volume

The ambient track is mixed at 35% volume against the voice lines
(`<Audio ... volume={0.35} />` in `src/DialogueVideo.tsx`). If it ever feels
too loud or too quiet, that's the one number to change.

## Getting this rendering on GitHub (no coding needed)

1. **Create a free GitHub account** at github.com, if you don't have one already.
2. **Create a new repository**: click the "+" in the top right → "New repository" →
   name it `dialogue-video-series` → keep it Public or Private, either works → "Create repository".
3. **Upload these files**: on the new repo's page, click "Add file" → "Upload files",
   then drag in every file and folder from this project (everything except `node_modules`
   and `out`, which aren't included in what I've sent you). Commit the upload.
4. **Run the render**: go to the "Actions" tab at the top of your repo → click
   "Render dialogue video" in the left sidebar → click the "Run workflow" button →
   "Run workflow" again to confirm.
5. **Wait**: it takes a couple of minutes. A yellow dot means it's running, green
   check means it's done.
6. **Download the video**: click into the finished run → scroll down to
   "Artifacts" → click "dam-dialogue" to download a zip containing
   `dam-dialogue.mp4`, your rendered video.

Every time you want to render a *different* script, the only file that needs
to change is `src/scripts/dam.ts` (or a new file like it) plus the composition
in `src/Root.tsx` pointing at it — the character rig and video template stay
exactly the same.
