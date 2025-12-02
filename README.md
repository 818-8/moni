<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/196kh17tern7KvTk14UOBace4XS33RbxL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a file named `.env.local` at the project root and add your Gemini key:

   ``
   GEMINI_API_KEY=your_real_gemini_key_here
   ``

   (Do NOT commit `.env.local` to version control.)
3. Run the app in development:
   `npm run dev`

Notes:
- The app is migrated to Next.js. All calls to Gemini happen on the server under `/api/gemini/*` to keep the API key secret.
- Use `npm run build` and `npm start` for production.

Tailwind CSS (optional but recommended):

- This project UI uses Tailwind utility classes. To enable Tailwind styling locally, install Tailwind and PostCSS plugins and rebuild:

```bat
cd /d d:\\桌面\\moni
npm install -D tailwindcss postcss autoprefixer
```

Tailwind config and PostCSS config files are already added. After installing, restart the dev server:

```bat
npm run dev
```

If you don't want Tailwind, the app will still run but UI classes may appear unstyled.
