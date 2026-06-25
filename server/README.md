# AI Interview — Socket.IO Signaling Server

Standalone WebRTC signaling server. Deploy this folder separately on **Render**.

## Deploy on Render (Free Tier)

1. Push this repo to GitHub (the whole project including this `server/` folder)
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure the service:

| Setting | Value |
|---|---|
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Add these **Environment Variables** on Render:

| Key | Value |
|---|---|
| `PORT` | *(Render sets this automatically — leave blank)* |
| `ALLOWED_ORIGINS` | Your Vercel URL e.g. `https://your-app.vercel.app` |

6. After deploy, copy the Render URL (e.g. `https://ai-interview-socket.onrender.com`)
7. Set it as `NEXT_PUBLIC_SOCKET_URL` in your **Vercel project environment variables**

## Local Development

```bash
cd server
npm install
node index.js
# Runs on http://localhost:4000
```

Make sure your root `.env` has:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Health Check

Visit `GET /health` on your server URL to confirm it's running:
```json
{ "status": "ok", "service": "AI Interview Socket Server", "uptime": 42, "rooms": 0 }
```
