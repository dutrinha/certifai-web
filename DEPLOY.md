# Vercel Deployment Guide

Your project is ready for deployment!

## Status
*   **Codebase**: Prepared for Vercel (Expo Web export).
*   **Repository**: Pushed to [https://github.com/dutrinha/certifai-web](https://github.com/dutrinha/certifai-web).
*   **Configuration**: `vercel.json` created.

## How to Deploy to Vercel

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Click the "Add New..." button and select "Project".
3.  **Import Repository**: Find `certifai-web` in the list of your GitHub repositories and click **Import**.
4.  **Configure Project**:
    *   Vercel should automatically detect the settings from `vercel.json`.
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   If it doesn't auto-detect, enter these values manually.
5.  **Deploy**: Click the **Deploy** button.

## Future Updates
Whenever you want to update your live site, just commit your changes and push to GitHub:
```bash
git add .
git commit -m "Description of changes"
git push
```
Vercel will automatically trigger a new deployment.
