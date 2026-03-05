# 📡 AIPL Connect

A free, open-source internet calling app with **Voice · Video · Group Calls · Screen Sharing · Chat · Recording**.

Built with WebRTC + Socket.io — 100% free to run.

---

## 🚀 Features

- ✅ 1-on-1 and Group Video/Voice Calls (up to 4 in the free mesh setup)
- ✅ Screen Sharing
- ✅ In-call Text Chat
- ✅ Call Recording (saves as .webm locally)
- ✅ No accounts needed — just share a Room ID
- ✅ Mobile-friendly design
- ✅ 100% free to deploy

---

## 📁 Project Structure

```
aipl-connect/
├── server/
│   └── server.js        ← Node.js signaling server
├── public/
│   └── index.html       ← Frontend (WebRTC + UI)
├── package.json
├── render.yaml          ← Free deployment on Render
└── README.md
```

---

## 💻 Run Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open in browser
```
http://localhost:3000
```

Open in **two browser tabs or two devices** on your network to test calling.

---

## ☁️ Deploy for FREE on Render

1. Push this project to a **GitHub repository**
2. Go to [render.com](https://render.com) and sign up free
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Render auto-detects `render.yaml` — just click **Deploy**
6. Your app will be live at: `https://aipl-connect.onrender.com`

> 💡 Free tier spins down after 15 min inactivity. Upgrade to a $7/mo plan for always-on.

---

## ☁️ Deploy on Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Set start command: `npm start`
4. Done — free $5/month credit

---

## 🔧 Configuration

Edit `public/index.html` line near the top:

```js
const SIGNALING_URL = window.location.origin;
```

After deploying, this auto-detects your server URL. No changes needed.

### TURN Server (for users behind strict firewalls)

The app uses free TURN servers from `openrelay.metered.ca`.
For production, get your own free 50GB/month from [metered.ca](https://metered.ca).

Replace in `public/index.html`:
```js
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:YOUR-TURN-SERVER',
    username: 'YOUR-USERNAME',
    credential: 'YOUR-PASSWORD'
  }
];
```

---

## 📱 How to Use

1. Open the app URL on any device
2. Enter your name and a Room ID (or click **New Room** to generate one)
3. Click **Join Room**
4. Share the Room ID with others — they join the same room
5. Use the controls to mute, share screen, record, or chat

---

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Video/Audio | WebRTC (browser built-in) | Free |
| Signaling | Socket.io | Free |
| Server | Node.js + Express | Free |
| Hosting | Render / Railway | Free |
| TURN | openrelay.metered.ca | Free (50GB) |

**Total monthly cost: $0** ✅

---

## 📄 License

MIT — free to use, modify, and deploy.
