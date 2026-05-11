# Dependency Risk Scanner

Dependency Risk Scanner is a full-stack app for analyzing dependency impact from a `package-lock.json` file.
It visualizes the dependency graph, highlights high-impact packages, and provides contextual AI explanations for why a package matters in the tree.

The core risk score is based on graph-derived impact metrics. In addition, the app fetches known vulnerability metadata per package/version to provide a separate informational security dimension.

## Highlights

- Upload a `package-lock.json` and analyze it in the browser
- Visual dependency graph with impact-based sizing and coloring
- Searchable risk table with package highlighting
- Vulnerability metadata per package (count + critical flag)
- Optional AI explanation panel for contextual, non-security-specific reasoning
- Deterministic fallback when AI is unavailable
- Frontend mock mode for demos that should not call the backend

## Architecture

- Frontend: React + TypeScript + Tailwind (Vite)
- Backend: Node.js + TypeScript + Fastify
- AI: Hugging Face chat-completions API with deterministic fallback
- Vulnerabilities: OSV.dev query API
- Flow:
  - Upload `package-lock.json` from the UI
  - `POST /analyze` to backend
  - Backend builds dependency graph, computes impact, and enriches packages with vulnerability metadata
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
VITE_USE_MOCK_API=false
```

An example file is included at `frontend/.env.example`.

For a live demo that does not call the backend, enable mock mode:

```bash
VITE_USE_MOCK_API=true
```

In mock mode, the UI uses mock analysis data and placeholder AI explanations, with no backend requests.

### 3. Backend Environment (optional)

For deployment, you can configure backend runtime settings with environment variables:

```bash
PORT=3001
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
HUGGINGFACE_API_KEY=hf_your_token_here
HUGGINGFACE_MODEL_ID=openai/gpt-oss-120b:fastest
```

`ALLOWED_ORIGINS` accepts a comma-separated list of frontend origins.
`HUGGINGFACE_MODEL_ID` is optional and can be changed if you want to try a different supported model.
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
    {
      "id": "lodash",
      "version": "4.17.21",
      "impact": 4.5,
      "blastRadius": ["app"],
      "vulnerabilities": { "count": 2, "hasCritical": false }
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

`vulnerabilities` is informational and does not alter the `impact` score.

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

- **With API key**: Calls Hugging Face chat-completions with a supported model to generate contextual explanations
- **Without API key**: Returns a deterministic fallback explanation based on impact score, dependent count, and tree depth
- **On API failure**: Returns the deterministic fallback without interrupting the UI
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
- Vulnerability metadata lookup from OSV.dev (count + critical flag)
- **AI Risk Explanation**: Natural language explanations of why packages are risky based on structural impact data (with deterministic fallback)
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
