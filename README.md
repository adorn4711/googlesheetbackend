# Google Sheet Backend REST Service

A minimal TypeScript Express server exposing read-only endpoints for a Google Spreadsheet using a service account.

## Endpoints

- `GET /health` — simple liveness probe
- `GET /sheet?spreadsheetId=...` — spreadsheet title and sheets metadata
- `GET /sheet/:sheet/rows?offset=0&limit=50&spreadsheetId=...` — rows from a sheet by index (0-based) or title

If `spreadsheetId` is omitted, it defaults to the project constant in `src/service.ts`.

## Setup for googlesheets

1. Ensure the service account has read access to the target spreadsheet.
2. Place the service account key JSON at `key/adorn4711test-a51513af553d.json` (already referenced).

## Setup for neon database
1. store the DATABASE_URL. in $process.env.DATABASE_URL in gitsecrets

## Run (dev)

```bash
npm install
npm run dev
```

```bash
bun run src/server.ts

Server listens on `http://localhost:3000`.

## Build + Run (prod)

```bash
npm run build
npm start
```

## Deploy to gh-pages

https://docs.github.com/en/pages/quickstart	

## Deploy to Google Cloud Run

Prereqs:
- Install the Google Cloud SDK (`gcloud`) and run `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`.
- Enable APIs: `gcloud services enable run.googleapis.com artifactregistry.googleapis.com`.

Credentials:
- Recommended: store creds in Secret Manager and inject as env vars.
	- Create secrets:
		```bash
		echo -n "your-service-account@project.iam.gserviceaccount.com" | gcloud secrets create client-email --data-file=-
		echo -n "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" | gcloud secrets create private-key --data-file=-
		```
	- Share the spreadsheet with that service account (Viewer).

Build & deploy (Cloud Run):
```bash
gcloud builds submit --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/apps/googlesheetbackend:latest"
gcloud run deploy googlesheetbackend \
	--image "${REGION}-docker.pkg.dev/${PROJECT_ID}/apps/googlesheetbackend:latest" \
	--region ${REGION} \
	--platform managed \
	--allow-unauthenticated \
	--min-instances 0 \
	--max-instances 3 \
	--set-env-vars "GOOGLE_SPREADSHEET_ID=${YOUR_SHEET_ID}" \
	--set-secrets "GOOGLE_CLIENT_EMAIL=client-email:latest,GOOGLE_PRIVATE_KEY=private-key:latest"
```

Notes:
- `GOOGLE_PRIVATE_KEY` must contain literal newlines; our code converts `\n` to newlines automatically if needed.
- Alternatively, set `GOOGLE_CREDENTIALS_PATH` to a mounted JSON key file and set envs accordingly.
- For tighter security, use a dedicated service account and restrict secret access to the Cloud Run service.

## Notes

- Keep your key file out of public repos. Consider using environment variables or a secret manager in production.
