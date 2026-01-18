# Panda Factor Frontend (Vue 3 Scaffold)

This folder contains a readable Vue 3 project scaffold reconstructed from the bundled `output/deobfuscated.js` build artifact. The goal is to restore a maintainable entry point, router, and application shell so you can incrementally replace placeholders with real component logic.

## What was extracted

- **Framework & runtime**: Vue 3 with Vue Router, Pinia, and a Qiankun-style micro-frontend lifecycle.
- **Base route**: `/factor`.
- **Routes**: `factorList`, `factorEditor`, `factorDeep`, `factorChat`, `dataHubSource`, `dataHubDataClean`, `dataHubList`, `datahubFactorClean`.
- **Auth guard**: redirect to `/login?redirect=/factor/...` if `token` and `userid` are missing.

## Next steps

1. Replace placeholder view components in `src/views` with real logic extracted from the bundle.
2. Wire API clients and stores as you rehydrate functionality.
3. Compare UI behaviors with the running static build for validation.

## Scripts

```bash
npm install
npm run dev
```

The dev server will run on `http://localhost:5173/factor/` by default.
