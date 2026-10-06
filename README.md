<div align="center">

# ✦ Preact Dev Environment Auditor

**A privacy-minded environment parity workspace for finding missing keys, configuration drift, secrets, and likely naming mistakes.**

![Preact](https://img.shields.io/badge/Preact-10-673ab8?style=for-the-badge&logo=preact&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=ffffff)
![Environment](https://img.shields.io/badge/.env-Local_Audit-0369a1?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

</div>

---

## ✨ Highlights

- **Environment Matrix:** Compares every unique key across development, staging, and production-shaped files.
- **Drift Classification:** Distinguishes consistent, different, missing, and secret-key states.
- **Private by Default:** Masks values in the matrix and exposes them only through an explicit reveal control.
- **Key Inspector:** Shows inferred value types, per-environment values, and non-reversible local fingerprints.
- **Value Editing:** Updates a selected value and persists the reconstructed environment document locally.
- **File Import:** Replaces any environment slot with a local `.env` or text file.
- **Typo Detection:** Uses Levenshtein distance to flag rare keys that closely resemble common keys.
- **Search and Filters:** Narrows the matrix by key name and audit status.
- **Redacted Report:** Exports summary counts, file metadata, and key states without raw values.
- **Validated Persistence:** Uses Zod and IndexedDB with a one-click sample reset.
- **Responsive Comparison:** Replaces the wide matrix with compact key rows on mobile and keeps the inspector stacked below.

## 🧱 Project Structure

```text
public/
|-- favicon.svg
|-- sample-development.env
|-- sample-production.env
`-- sample-staging.env
src/
|-- app.tsx
|-- main.tsx
|-- index.css
|-- components/
|   |-- environment-matrix.tsx
|   |-- import-panel.tsx
|   |-- key-inspector.tsx
|   `-- workspace-state.tsx
|-- domain/
|   `-- environment.ts
`-- services/
    `-- environment-store.ts
```

## 🛠️ Tech Stack

- Preact 10 with Vite 8
- TypeScript 6
- Tailwind CSS 4
- `envfile` for browser-side `.env` parsing and serialization
- `fast-levenshtein` for typo suggestions
- `zod`
- `idb-keyval`
- `@preact/signals`
- `lucide-preact`

## 📦 Included Sample Data

`public/sample-development.env`, `public/sample-staging.env`, and `public/sample-production.env` contain safe fictional values and intentional differences. The production sample includes `SUPORT_EMAIL` so the typo diagnostic can demonstrate a likely match for `SUPPORT_EMAIL`.

## 🚀 Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 🔌 Extension Notes & Nuances

- All parsing, comparison, editing, and report generation happen in the browser. Imported files are not uploaded.
- The included credentials are clearly fictional sample strings, not usable secrets.
- Secret detection is name-based and should complement, not replace, a dedicated entropy or secret-scanning service.
- Fingerprints use a compact non-cryptographic hash for visual comparison and must not be treated as security proofs.
- Editing a value serializes the parsed key/value map and does not preserve comments or the original line ordering.
- The exported report deliberately excludes raw values and fingerprints.
- The wide comparison table is desktop-oriented; mobile receives a purpose-built key list and stacked inspector.

## 🧪 Build & Checks

```bash
npm run format:check
npm run build
npm run preview
```

## 🌐 Vercel Deployment

The repository includes a Vite-ready `vercel.json` with SPA rewrites.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📄 License

MIT License. See [LICENSE](./LICENSE).
