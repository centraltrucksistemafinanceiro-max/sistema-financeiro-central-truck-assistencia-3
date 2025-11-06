<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HF_-iBu3VDqUqBwYNpHgSW1De8Ms3aLN

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in your actual API keys and Firebase configuration:
   `cp .env.example .env.local`
4. Run the app:
   `npm run dev`

**Security Note:** Never commit `.env.local` or any files containing real API keys to version control. These files are already included in `.gitignore`.
