# 🚀 Deployment Guide: Render (Backend) & Vercel (Frontend)

This document provides step-by-step instructions for deploying the **Lumen CMS** application using **Render** for the Express API backend and **Vercel** for the Vite/React frontend.

---

## 1. ⚙️ Backend Deployment (Render)

### Option A: 1-Click Render Blueprint (Recommended)
1. Push your code to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect the `render.yaml` file located in the project root.
5. Set the required Environment Variable `MONGODB_URI` when prompted:
   ```env
   MONGODB_URI=mongodb+srv://ags054570_db_user:<password>@cluster0.c6ksgra.mongodb.net/content_management_system?appName=Cluster0
   ```
6. Click **Apply**. Render will build and deploy the backend automatically.

### Option B: Manual Web Service Setup on Render

> ⚠️ **IMPORTANT FIX FOR YOUR CURRENT ERROR:**
> Render tried running `node backend/server.js` from inside the `/backend/` directory, causing it to look for `/opt/render/project/src/backend/backend/server.js` which does not exist.
> 
> Choose **ONE** of the following two options in your Render Dashboard settings:

#### Configuration Method 1 (Recommended):
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`  *(Notice: `server.js`, NOT `backend/server.js`)*

#### Configuration Method 2:
- **Root Directory**: *(Leave Empty / blank)*
- **Build Command**: `npm --prefix backend install` (or `cd backend && npm install`)
- **Start Command**: `node backend/server.js`

---

4. **Environment Variables on Render**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `mongodb+srv://ags054570_db_user:<password>@cluster0.c6ksgra.mongodb.net/content_management_system?appName=Cluster0`
   - `JWT_SECRET`: `lumen_super_secret_jwt_key_2026_cms_platform`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app`
5. Click **Save Changes** / **Manual Deploy** -> **Deploy latest commit**.

---

## 2. 🌐 Frontend Deployment (Vercel)

### Deploying via Vercel Dashboard / CLI
1. Log into [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://lumen-backend.onrender.com/api` *(Replace with your Render API backend URL)*
5. Click **Deploy**.

---

## 🔒 CORS & Security Setup
- The backend `server.js` dynamically accepts requests from all `*.vercel.app` domains as well as the URL configured in `CLIENT_URL`.
- SPA Routing in Vercel is pre-configured via `frontend/vercel.json` to route all path requests to `index.html` seamlessly.
