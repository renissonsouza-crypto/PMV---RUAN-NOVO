# PMV - Ruan

## GitHub Pages deployment

The Vite frontend is deployed automatically to GitHub Pages whenever `main` is
pushed. The published site is:

<https://renissonsouza-crypto.github.io/PMV---RUAN-NOVO/>

Before the first deployment, repository administrators must open
**Settings > Pages** and select **GitHub Actions** as the build and deployment
source. The **Deploy GitHub Pages** workflow can also be run manually from the
Actions tab.

The production build uses the `/PMV---RUAN-NOVO/` base path. GitHub Pages does
not provide server-side URL rewrites, so the workflow copies `index.html` to
`404.html`; this lets the client render supported direct links such as
`/PMV---RUAN-NOVO/admin` and `/PMV---RUAN-NOVO/estudante`.

## Backend requirement

GitHub Pages hosts only static files. It cannot run this repository's
Express/Prisma API, migrations, database, uploads, authentication, or other
server-side behavior. Deploy the API and database separately, then configure the
frontend to use that hosted API before expecting interactive data and
authentication features to work on the Pages site.

### Deploy recomendado

- Frontend: GitHub Pages
- Backend/API: Render, Railway, Fly.io, Azure App Service, etc.
- Database: PostgreSQL managed (Render/Railway/Aiven/Neon/etc.)

Set the public API URL in the frontend build as a secret or environment variable:

```bash
VITE_API_BASE_URL=https://api.seu-dominio.com
```

The frontend uses this value automatically via the config in src/api.ts.

## Local development

```sh
npm ci
npm run dev
```

`npm run dev` starts both the Vite frontend and the local API. Use
`npm run dev:web` when only the frontend is needed.
