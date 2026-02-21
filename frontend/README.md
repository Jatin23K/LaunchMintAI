<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OEnq2QhDDST8FhP-GUz4ZYDG2BqIM5JD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
   
2. Configure API Keys in `.env.local`:
   
   **Option A - Single API (Recommended for most users):**
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Option B - Dual API with Fallback (Advanced):**
   ```
   VITE_PRIMARY_AI_API_KEY=your_primary_google_ai_key
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from: https://aistudio.google.com/apikey
   
   > **Note:** The system supports automatic fallback. If both keys are configured, it will use the PRIMARY API first and automatically switch to GEMINI if it fails. Both use the latest `gemini-2.0-flash-exp` model.

3. Run the app:
   `npm run dev`

