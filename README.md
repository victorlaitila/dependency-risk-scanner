# Dependency Risk Scanner

Dependency Risk Scanner is a full-stack app for analyzing dependency impact from a `package-lock.json` file.
It visualizes the dependency graph, highlights high-impact packages, and provides contextual AI explanations for why a package matters in the tree.

The core risk score is based on graph-derived impact metrics. In addition, the app fetches known vulnerability metadata per package/version to provide a separate informational security dimension.

## Highlights

- Upload a `package-lock.json` and analyze it in the browser
- Visual dependency graph with impact-based sizing and coloring
- Searchable risk table with package highlighting
- Vulnerability metadata per package with structured advisory details
- Optional AI explanation panel for contextual, non-security-specific reasoning
- Frontend mock mode for demos that should not call the backend

## Architecture

- Frontend: React + TypeScript + Tailwind (Vite)
- Backend: Node.js + TypeScript + Fastify
- AI: Hugging Face chat-completions API with fallback message handling
- Vulnerabilities: OSV.dev query API
- Flow:
  - Upload `package-lock.json` from the UI
  - `POST /analyze` to backend
  - Backend builds dependency graph, computes impact, and enriches packages with vulnerability metadata
  - UI updates graph placeholder and risk table from API response
  - Selecting a package surfaces the AI explanation and any vulnerability details in the same panel

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
VITE_USE_MOCK_API=false
VITE_BASE_PATH=/
```

An example file is included at `frontend/.env.example`.

For a live demo that does not call the backend, enable mock mode:

```bash
VITE_USE_MOCK_API=true
```

In mock mode, the UI uses mock analysis data and placeholder AI explanations, with no backend requests.

### 3. Backend Environment (optional)

Only one backend environment variable is required for AI explanations:

```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

An example file is included at `backend/.env.example`.

Backend runtime defaults (port, upload limit, and localhost CORS patterns) are defined in `backend/src/lib/constants.ts`.

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
    {
      "id": "lodash",
      "version": "4.17.21",
      "impact": 4.5,
      "blastRadius": ["app"],
      "vulnerabilities": {
        "count": 2,
        "hasCritical": false,
        "details": []
      }
    },
    {
      "id": "minimist",
      "version": "1.2.8",
      "impact": 1,
      "blastRadius": [],
      "vulnerabilities": { "count": 0, "hasCritical": false }
    }
  ],
  "edges": [
    { "from": "lodash", "to": "minimist" }
  ]
}
```

`vulnerabilities` is informational and does not alter the `impact` score. When present, it includes structured advisory details used by the UI.

### AI Risk Explanation

The `/explain` endpoint generates AI-powered natural language explanations for why a package is risky based on its structural impact metrics.

**Important**: The AI explanation feature explains existing impact data. It does _not_ compute risk scores, check for CVEs, or invent vulnerabilities. It provides contextual reasoning for why packages matter in your dependency graph.

#### Request

`POST /explain` with `application/json`

```json
{
  "name": "lodash",
  "version": "4.17.21",
  "impactScore": 4.5,
  "dependentsCount": 12,
  "depth": 3
}
```

Fields:
- `name`: Package name
- `version`: Package version
- `impactScore`: Computed impact score (0-100)
- `dependentsCount`: Number of direct dependents
- `depth`: Depth in the dependency tree

#### Response

```json
{
  "explanation": "lodash is a highly used utility library with 12 packages depending on it. Its significant role in the dependency tree means updates should be tested thoroughly."
}
```

#### Behavior

- **With API key**: Calls Hugging Face chat-completions using the configured default model to generate contextual explanations
- **Without API key**: Returns a simple fallback message
- **On API failure**: Returns the same fallback message without interrupting the UI
- **Response length**: Kept short for UI readability

Configure the HuggingFace API key via environment variable:

```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

An example file is included at `backend/.env.example`.



## MVP Features

- Multipart lockfile upload from UI
- package-lock parsing in backend
- Directed dependency graph generation (`from -> to`)
- Downstream dependency counting
- Blast radius computation (transitive dependents)
- Impact score calculation: `downstream_count / (depth + 1)`
- Risk table populated from real API response
- Vulnerability metadata lookup from OSV.dev with structured advisory details
- **AI Risk Explanation**: Natural language explanations of why packages are risky based on structural impact data (with fallback message)
- Frontend mock mode for reliable demos without backend/network dependence

## Notes

- The risk score remains intentionally focused on dependency structure.
- Vulnerability metadata is presented as a separate informational dimension.
- AI output is explanatory only and does not change graph metrics or risk scores.
- The backend keeps file upload limits and origin allowlisting in place for basic safety.

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
