# App icons go here

The PWA manifest and the iOS home-screen icon expect two PNG files in this
folder:

- `icon-192.png`  — 192×192 px
- `icon-512.png`  — 512×512 px

## Quick ways to make them

**Easiest:** go to https://favicon.io/ or https://realfavicongenerator.net/,
upload any square image (a photo, an emoji, a logo), and download the
generated PNGs. Rename them to `icon-192.png` and `icon-512.png` and drop them
here.

**From one big image with ImageMagick (optional):**
```bash
magick source.png -resize 192x192 icon-192.png
magick source.png -resize 512x512 icon-512.png
```

The app will still run without these icons, but iOS will show a blank/letter
icon on the home screen until you add them.
