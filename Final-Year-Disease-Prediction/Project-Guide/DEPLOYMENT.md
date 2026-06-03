# Deployment Guide

---

## Local Development

### Prerequisites
- Python 3.12+ (3.14 works locally; Render uses 3.12)
- Node.js 20+ (Render uses 24.x)
- npm 10+
- The `.pkl` model files in `outputs/` (not in git — see below)

### Step 1 — Obtain model files

The `.pkl` files are excluded from git because they are binary blobs (~1–2 MB each). You need them to run the backend.

**Option A: Regenerate from notebooks**
```bash
cd Final-Year-Disease-Prediction
source venv/bin/activate
jupyter notebook notebooks/04_model_nigeria_cholera.ipynb
# Run all cells → saves outputs/cholera_ensemble_model.pkl + cholera_scaler.pkl
```

**Option B: Download from shared storage**  
Ask the project author for a shared link to the `outputs/` folder.

### Step 2 — Backend

```bash
cd Final-Year-Disease-Prediction
source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok",...}`

### Step 3 — Frontend

```bash
cd Final-Year-Disease-Prediction/frontend
npm install --legacy-peer-deps
npm run dev
```

Opens at `http://localhost:5173`. The `--legacy-peer-deps` flag is needed because the project uses React 19 and some packages still declare `react@^18` as a peer dependency.

### Environment Variables (local)

Create `Final-Year-Disease-Prediction/frontend/.env.local` (gitignored):
```
VITE_API_URL=http://localhost:8000
```

This is optional — `http://localhost:8000` is already the hardcoded fallback in `api.ts`.

---

## Render Deployment

The project uses a **Render Blueprint** (`render.yaml`) to define both services declaratively.

### File location

```
Final-Year-Disease-Prediction/render.yaml
```

Render must be configured to find the blueprint at this non-root path (see Step 2 below).

### Service definitions

```yaml
services:

  - type: web
    name: outbreak-watch-api
    runtime: python
    rootDir: Final-Year-Disease-Prediction
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    plan: free
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.0

  - type: web
    name: outbreak-watch-frontend
    runtime: static
    rootDir: Final-Year-Disease-Prediction/frontend
    buildCommand: npm install --legacy-peer-deps && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        sync: false
```

### Step-by-step Render setup

**Step 1: Push code to GitHub**
```bash
git add -A && git commit -m "deploy ready"
git push origin main
```

**Step 2: Create Blueprint on Render**
1. Go to [dashboard.render.com](https://dashboard.render.com) → New → Blueprint
2. Connect repo: `github.com/DevLucks/Predicting-Climate-driven-diseases`
3. Set **Blueprint file path**: `Final-Year-Disease-Prediction/render.yaml`
4. Click Apply

**Step 3: Deploy the backend**
- Render will create `outbreak-watch-api` as a Python web service
- Build runs: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **IMPORTANT: The `.pkl` files are not in git.** The backend will crash on first deploy because `cholera_ensemble_model.pkl` is missing. See "Model Files on Render" below.

**Step 4: Get the backend URL**
Once deployed, copy the URL: `https://outbreak-watch-api.onrender.com`

**Step 5: Set frontend environment variable**
1. Go to the `outbreak-watch-frontend` service on Render
2. Environment → Add Environment Variable
3. Key: `VITE_API_URL`
4. Value: `https://outbreak-watch-api.onrender.com`
5. Save → this triggers an automatic redeploy of the frontend

**Step 6: Add frontend URL to backend CORS**

In `backend/main.py`, update `allow_origins`:
```python
allow_origins=[
    "http://localhost:5173",
    "https://outbreak-watch-frontend.onrender.com",
]
```
Commit and push → backend redeploys automatically.

---

## Model Files on Render

Render's free tier does **not** have persistent disk storage. The `.pkl` files must be present at build time. Options:

### Option A: Commit small model files (easiest for presentation)

If the model files are under ~100 MB each, you can temporarily remove the `.pkl` exclusion from `.gitignore` and commit them:
```bash
# Temporarily in Final-Year-Disease-Prediction/.gitignore, comment out:
# outputs/*.pkl

git add outputs/cholera_ensemble_model.pkl outputs/cholera_scaler.pkl
git commit -m "add model files for deployment"
git push
```
Re-add the gitignore exclusion after deployment is confirmed working.

### Option B: Download during build (recommended for production)

Store the `.pkl` files in a public or authenticated URL (Google Drive, S3, GitHub Releases) and download them in the build command:

```yaml
buildCommand: |
  pip install -r backend/requirements.txt &&
  mkdir -p outputs &&
  curl -L "https://your-storage/cholera_ensemble_model.pkl" -o outputs/cholera_ensemble_model.pkl &&
  curl -L "https://your-storage/cholera_scaler.pkl" -o outputs/cholera_scaler.pkl
```

### Option C: Use Render Disks (paid tier)

Render paid plans support persistent disks. Mount a disk at `/outputs` and copy the files there once.

---

## Environment Variables Reference

| Variable | Service | Where to Set | Example Value |
|---|---|---|---|
| `PORT` | Backend | Auto-set by Render | `10000` |
| `PYTHON_VERSION` | Backend | `render.yaml` | `3.12.0` |
| `VITE_API_URL` | Frontend (build) | Render dashboard | `https://outbreak-watch-api.onrender.com` |

**`VITE_API_URL` is a build-time variable** — it's baked into the static bundle by Vite at build time, not injected at runtime. Any change requires a frontend redeploy.

---

## Common Errors and Fixes

### `RuntimeError: Could not load model files from .../outputs`
**Cause:** `.pkl` files not present when backend starts  
**Fix:** Add model files to the build (see "Model Files on Render" above)

### `npm error ERESOLVE could not resolve` (react-leaflet)
**Cause:** `react-leaflet` v4 requires `react@^18` but project uses React 19  
**Fix:** Already resolved — `react-leaflet` was removed from `package.json`. Ensure latest commit is deployed.

### `tsc -b` TypeScript errors on Render
**Cause:** Render runs `tsc -b` (composite build) which is stricter than `tsc --noEmit`  
**Fix:** Run `npx tsc -b` locally before pushing to catch errors. Common issues: unused imports, duplicate JSX props, missing generic type parameters.

### Frontend shows "OFFLINE MODE" badge
**Cause:** Frontend cannot reach backend  
**Fix:** Check `VITE_API_URL` is set to the correct backend URL. Check backend service logs for startup errors.

### Globe not rendering (black or blank sphere)
**Cause:** WebGL not available, or `react-globe.gl` failed to load  
**Fix:** The globe is lazy-loaded with a Suspense skeleton fallback. Check browser console for WebGL errors. The vite.config.ts alias must point to `node_modules/react-globe.gl/dist/react-globe.gl.js`.

### Render build: `Rolldown failed to resolve import "react-globe.gl"`
**Cause:** Vite 8's Rolldown bundler cannot resolve `react-globe.gl` from its `exports` field  
**Fix:** Already resolved in `vite.config.ts` via the `resolve.alias`. Ensure the alias points to `.js` not `.mjs`.

### CORS errors in browser console
**Cause:** Backend `allow_origins` doesn't include the production frontend URL  
**Fix:** Add the frontend URL to `allow_origins` in `backend/main.py` and redeploy backend.

### Backend crash: `ModuleNotFoundError: No module named 'xgboost'`
**Cause:** `xgboost` not installed  
**Fix:** Verify `xgboost>=2.0.0` is in `backend/requirements.txt` and redeploy.

---

## Venv Setup (first time)

```bash
cd Final-Year-Disease-Prediction
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# For training notebooks only (not needed for backend):
pip install jupyter xarray cfgrib netCDF4 torch torchvision cdsapi
```
