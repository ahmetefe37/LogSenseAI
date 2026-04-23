<div align="center">
   <img width="1200" height="475" alt="LogSense Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

   # LogSense AI

   **AI-powered log and error analysis tool**

   Merges pasted log blocks, analyzes them via OpenRouter, and generates both detailed solutions and quick summaries.
</div>

---

## 🚀 Project Overview

`LogSense AI` is a Next.js application designed specifically for backend/frontend runtime issues, build failures, and stack trace analysis.

The application:
- Combines multiple log blocks into a single analysis.
- Returns results in two formats:
   - **Detailed analysis** (`detailed_analysis`)
   - **Quick summary** (`quick_summary`)
- Supports multilingual output (selectable from the UI).
- Tracks token usage per session.
- Stores settings (prompt context, API key, model name) in a local file.

---

## ✨ Features

- **Multi-log input:** Each pasted block is labeled separately.
- **Language selection:** Analysis language can be changed from the UI.
- **Model flexibility:** You can change the OpenRouter model name from settings.
- **Customizable system instructions:** Save custom context/prompt to improve analysis quality.
- **Markdown rendering:** Results are displayed in readable Markdown format.
- **Copy actions:** Detailed and summary outputs can be copied separately.
- **Latency and token metrics:** Visible for performance and cost tracking.
- **Favicon support:** Browser tab icon is served from `public/explorer-icon.png`.

---

## 🧱 Tech Stack

### Application
- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**

### UI / Utility Libraries
- `lucide-react` (icons)
- `react-markdown` + `remark-gfm` (Markdown rendering)
- `clsx` + `tailwind-merge` (`cn` utility)

### AI Integration
- **OpenRouter Chat Completions API** (called from `/api/analyze`)

---

## 📁 Project Structure

```text
.
├─ app/
│  ├─ api/
│  │  ├─ analyze/route.ts      # Log analysis endpoint
│  │  └─ settings/route.ts     # Read/save settings endpoint
│  ├─ globals.css              # Global theme + markdown styles
│  ├─ layout.tsx               # Metadata, fonts, favicon
│  └─ page.tsx                 # Main UI and client flow
├─ components/
│  └─ ui/                      # Reusable UI parts (button/card/textarea)
├─ hooks/
│  └─ use-mobile.ts
├─ lib/
│  └─ utils.ts                 # cn() utility
├─ profile/
│  └─ configuration.txt        # File where runtime settings are stored as JSON
├─ public/
│  └─ explorer-icon.png        # Favicon
└─ README.md
```

---

## ⚙️ Setup

### Requirements
- Node.js 20+ (recommended)
- npm

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file at the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

> Note: The API key can also be entered from the **Settings** panel in the UI. The submitted key overrides `process.env.OPENROUTER_API_KEY` on the backend.

### 3) Start the development server

```bash
npm run dev
```

Default app URL: `http://localhost:3000`

---

## 🧪 Commands

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # production server
npm run lint    # eslint check
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `OPENROUTER_API_KEY` | Yes* | OpenRouter API key. |
| `DISABLE_HMR` | No | If `true`, disables webpack watch in dev mode (for special scenarios). |

\* The API key can also be provided via the Settings panel instead of env.

---

## 🔌 API Endpoints

### `POST /api/analyze`

Triggers log analysis.

**Body**

```json
{
   "logs": "string (required)",
   "instructions": "string (optional)",
   "apiKey": "string (optional)",
   "modelName": "string (optional)",
   "language": "string (optional, default: Turkish)"
}
```

**Successful Response**

```json
{
   "result": {
      "detailed_analysis": "...",
      "quick_summary": "..."
   },
   "usage": {
      "total_tokens": 1234,
      "prompt_tokens": 900,
      "completion_tokens": 334
   }
}
```

**Error Cases**
- `400`: missing `logs`
- `500`: missing API key / unexpected error
- `4xx/5xx`: upstream OpenRouter errors

### `GET /api/settings`

Returns settings from `profile/configuration.txt`. If the file does not exist, returns empty defaults:

```json
{
   "instructions": "",
   "apiKey": "",
   "modelName": ""
}
```

### `POST /api/settings`

Writes settings as JSON to `profile/configuration.txt`.

---

## 🖥️ Application Flow

1. User pastes log blocks into the input.
2. The UI merges logs in `--- Log Block N ---` format.
3. A `POST /api/analyze` request is sent.
4. Backend sends system prompt + user instructions + log content to OpenRouter.
5. Returned JSON is parsed and shown in the UI:
   - Left panel: detailed analysis
   - Right panel: quick summary
6. Token usage accumulates in localStorage (`totalTokens`).

---

## 🛡️ Security Notes

- Since API keys can be stored in `profile/configuration.txt`, do not commit this file to the repository.
- Mask sensitive data (tokens, passwords, personal data) in logs before sharing.
- In production, managing API keys via server environment variables is safer.

---

## 🧭 Known Notes

- Running `npm run lint` may currently report existing `react-hooks/set-state-in-effect` warnings/errors (`app/page.tsx`, `hooks/use-mobile.ts`).
- In `next.config.ts`, ESLint is disabled during build (`ignoreDuringBuilds: true`).

---

## 🚀 Deploy

The app follows the standard Next.js deployment flow.

At minimum, ensure the following variable is defined on the target platform:

```bash
OPENROUTER_API_KEY=...
```

Since `next.config.ts` includes `output: 'standalone'`, it is also suitable for containerized deployment scenarios.

---

## 🤝 Contributing

If you want to contribute:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Pass build/lint checks
5. Open a PR

---

## 📄 License

No license file is currently visible in this repository. If you plan open-source distribution, adding a `LICENSE` file is recommended.
