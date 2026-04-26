# Dependency Risk Scanner

Dependency Risk Scanner is a full-stack MVP that analyzes a `package-lock.json` file and surfaces dependency impact risk.
The frontend uploads the lockfile and renders the processed result.
The backend parses dependencies, builds a directed graph, computes impact scores, and returns graph data.
This provides a clear first version of an end-to-end dependency risk workflow.

Note: this project does not perform CVE or vulnerability database lookups.
The "risk" view is based on graph-derived impact metrics.

## Architecture

- Frontend: React + TypeScript + Tailwind (Vite)
- Backend: Node.js + TypeScript + Fastify
- Flow:
  - Upload `package-lock.json` from the UI
  - `POST /analyze` to backend
  - Backend builds dependency graph and computes impact
  - UI updates graph placeholder and risk table from API response

## Run Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:8080` by default.

You can configure the backend URL used by the frontend by creating `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

An example file is included at `frontend/.env.example`.

### 3. Backend Environment (optional)

For deployment, you can configure backend runtime settings with environment variables:

```bash
PORT=3001
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

`ALLOWED_ORIGINS` accepts a comma-separated list of frontend origins.
An example file is included at `backend/.env.example`.

## API

### Request

`POST /analyze` with `multipart/form-data`

Field:
- `file`: `package-lock.json`

Example with curl:

```bash
curl -X POST http://localhost:3001/analyze \
  -F "file=@package-lock.json"
```

### Response

```json
{
  "nodes": [
    { "id": "lodash", "version": "4.17.21", "impact": 4.5, "blastRadius": ["app"] },
    { "id": "minimist", "version": "1.2.8", "impact": 1, "blastRadius": [] }
  ],
  "edges": [
    { "from": "lodash", "to": "minimist" }
  ]
}
```

## MVP Features

- Multipart lockfile upload from UI
- package-lock parsing in backend
- Directed dependency graph generation (`from -> to`)
- Downstream dependency counting
- Blast radius computation (transitive dependents)
- Impact score calculation: `downstream_count / (depth + 1)`
- Risk table populated from real API response

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```
