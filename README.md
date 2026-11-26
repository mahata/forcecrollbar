# Force Scrollbar
A Chrome extension to display scrollbars even when the page author hides them with CSS.

## Develop

This project uses [Vite+](https://viteplus.dev) (`vp`) for building and testing.

```bash
vp install   # install dependencies
vp test      # run the Vitest test suite
vp build     # bundle the extension into dist/
```

The source lives in `src/`, and `vp build` emits the loadable extension
(`force-scrollbar.js` plus `manifest.json`) into `dist/`.

## Update CI dependencies

Dependabot checks GitHub Actions and pnpm dependencies weekly. When changing
`uses:` references manually or adding a workflow that uses actions, run
`gh actions-lock` from the repository root and commit the generated
`.github/workflows/actions.lock` with the workflow changes.

## Load in Chrome
1. Run `vp build` to generate `dist/`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist/` directory

The extension injects a content script on every page and force-enables hidden scrollbars.
