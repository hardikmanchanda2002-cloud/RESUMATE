# ResuMate — Hack Titans

A Vercel-ready resume/job-description matcher starter for SPARK 2 SCALE 2026.

## Included
- Responsive single-page UI (HTML/CSS/vanilla JavaScript)
- PDF text extraction in the browser using PDF.js; TXT/MD upload and paste-in support
- Local keyword/skill overlap analysis that works without API keys
- Optional Gemini advice through a Vercel serverless function (`/api/analyze`)
- Demo data, skill gap suggestions, transparent score disclaimer
- No database or login required for this starter

## Deploy on Vercel
1. Extract this ZIP.
2. Upload the extracted files to a new GitHub repository you control.
3. In Vercel, select **Add New → Project**, import that repository, and deploy.
4. Framework preset: **Other**. No build command is required; output/static root is the project root.
5. (Optional) In Vercel → Project → Settings → Environment Variables, add `GEMINI_API_KEY` using a key from Google AI Studio, then redeploy.

The local comparison works without the Gemini key. The optional API route returns no AI note when the key is absent.

## Important limitations
- This is a newly assembled compatible implementation, not a byte-for-byte copy of the third-party repository.
- The skill score is a simple heuristic, not a validated ATS score or hiring prediction.
- Uploaded resume text is handled in the browser for local matching. If the optional Gemini API is configured, the resume and job text are sent to Gemini for suggestions. Tell users clearly before enabling this.
- No user accounts, database, internship scraping, resume builder, or application tracker are included in this starter.
- Keep API keys out of source control and do not commit `.env` files.

## Team
**Hack Titans**  
Hardik Manchanda (Team Leader), Harshit Mahajan, Ashmeet Singh

## Attribution
This is an independently assembled starter inspired by the general resume/job-matching problem. It is not the original `algo-aryan/resumate` source code. If you incorporate third-party code, follow that project's license and attribution requirements.
