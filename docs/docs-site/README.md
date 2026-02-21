# TRES Dokumentacija

Ova dokumentacija je izgrađena sa [Docusaurus 3](https://docusaurus.io/).

## Struktura

```
docs/docs-site/
├── docs/                    # Srpski sadržaj (default)
│   ├── intro.md
│   ├── getting-started/
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   └── first-steps.md
│   ├── features/
│   │   ├── contracts.md
│   │   ├── providers.md
│   │   ├── humanitarian.md
│   │   ├── parking.md
│   │   ├── services.md
│   │   ├── complaints.md
│   │   ├── reports.md
│   │   ├── analytics.md
│   │   ├── notifications.md
│   │   └── ai-chat.md
│   ├── security/
│   │   ├── authentication.md
│   │   ├── roles-permissions.md
│   │   └── audit-logs.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── database.md
│   │   ├── api-routes.md
│   │   └── folder-structure.md
│   └── import-export/
│       ├── excel-import.md
│       ├── csv-import.md
│       └── reports-export.md
├── i18n/
│   └── en/                  # Engleski prevodi
│       └── docusaurus-plugin-content-docs/
│           └── current/
│               └── intro.md
├── src/css/custom.css
├── docusaurus.config.ts
├── sidebars.ts
└── package.json
```

## Pokretanje lokalno

```bash
cd docs/docs-site
npm install
npm start              # srpski (default)
npm run start:en       # engleski
```

## Dodavanje novih stranica

1. Kreiraj `.md` fajl u odgovarajućem folderu pod `docs/`
2. Dodaj frontmatter:
   ```md
   ---
   id: naziv-stranice
   title: Naziv Stranice
   sidebar_label: 📌 Naziv
   ---
   ```
3. Dodaj ID u `sidebars.ts`
4. (Opciono) Kreiraj engleski prevod u `i18n/en/...`

## Deploy

```bash
npm run build    # generisanje statičkih fajlova u /build
npm run serve    # lokalni preview build-a
```

## Brisanje starih TypeDoc fajlova

Iz root foldera projekta:
```bash
bash docs/cleanup.sh
npm uninstall typedoc typedoc-plugin-markdown
```

I iz `package.json` obriši scripts:
- `docs:generate`
- `docs:watch`  
- `docs:serve`
- `docs:clean`
- `docs:all`