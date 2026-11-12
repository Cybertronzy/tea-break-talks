# Dialogue Video Series — Remotion project

This renders the "Socratic metaphor dialogue" video format (teal & terracotta
mascots, dam & river script) as a 1080x1920 portrait MP4, and is wired up to
render automatically on GitHub's free servers instead of your laptop.

## What's in here

- `src/Character.tsx` — the reusable ZooZoo-style mascot (color + role = curious/wise as props)
- `src/DialogueVideo.tsx` — the video template: star background, text reveal, character highlight
- `src/scripts/dam.ts` — the first script's dialogue lines, timing and colors
- `src/Root.tsx` — registers the video so Remotion knows its size/length
- `.github/workflows/render-video.yml` — the GitHub Action that renders it in the cloud

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
