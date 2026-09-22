# Haffaf AI

Real AI chat website using Next.js, React and TypeScript.

## Run

Node.js 20+ is recommended.

```bash
npm install
cp .env.example .env.local
```

Set a real server-side key in `.env.local`:

```env
AI_API_KEY=your_real_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
RATE_LIMIT_PER_MINUTE=20
```

Then:

```bash
npm run dev
```

Open `http://localhost:3000`.

The backend calls an OpenAI-compatible `POST /chat/completions` endpoint. To switch providers, change the three `AI_*` environment variables without changing the frontend.

## Included

- Real AI responses, not hard-coded replies
- Server-only API key
- Basic rate limiting and input validation
- Sanitized Markdown rendering
- Local chat history
- New, rename, delete and clear chat
- Copy/regenerate/stop
- Dark/light mode
- Responsive mobile sidebar
- About section and "Developed by Haffaf" branding
