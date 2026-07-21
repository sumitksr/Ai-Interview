# Ace AI — AI-Powered Interview & Mentorship Platform

![Architecture](flows/Architecture.png)

## 🌐 Live Demo
- **App**: [https://aceai.sumitksr.xyz](https://aceai.sumitksr.xyz)

---

## 📖 Overview

**Ace AI** is a full-stack interview preparation and mentorship platform. It combines adaptive AI mock interviews, deep resume intelligence, and a mentor booking system — all in one workspace.

Candidates can practice AI-driven mock interviews, get resume feedback, and book 1-on-1 sessions with real mentors. When a session is booked, a **Google Meet link is automatically generated** and saved to the booking. At session time, participants visit a secure link that validates their identity and time window, then redirects them directly into Google Meet.

---

## ✨ Feature Suite

### 🎙️ AI Mock Interviews
- **Context-aware questioning** — adapts to your resume, target role, and previous answers
- **Multi-modal input** — type answers or use your microphone (speech-to-text)
- **Instant feedback** — STAR method scoring, technical accuracy, behavioral analysis

### 📄 Resume Intelligence
- **ATS keyword analysis** — matches your resume against a target job description
- **Impact rewriting** — detects weak bullet points and suggests action-verb rewrites
- **Interview-resume synergy** — connects your resume claims to your interview answers

### 📊 Candidate Dashboard
- Performance trends across Clarity, Technical Depth, Confidence, and Communication
- Prioritised "Next Steps" after every session
- Historical session transcripts and evaluation playback

### 👥 Mentor Booking System
- Browse and book verified mentors for 1-on-1 interview sessions
- Payment via **Razorpay** (free and paid sessions supported)
- **Google Meet auto-generated** at booking time — no manual link sharing needed
- Mentor can reschedule sessions from their dashboard
- Automated email confirmations to both student and mentor

### 🔒 Secure Meeting Access (`/meet/:bookingId`)
All session access is validated server-side before any redirect:
- ✅ User must be authenticated
- ✅ User must be the booked student **or** the mentor for that session
- ✅ Current time must be within the session window (opens 30 min before, expires 1 hr after end)
- ✅ Session status must be `confirmed` or `pending` (not `cancelled` or `completed`)
- ✅ Google Meet URL is **never exposed to the browser** — server-side `redirect()` only

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS v4, Custom CSS (Glassmorphism, Dark Mode)
- **Charts**: Recharts

### Backend
- **API**: Next.js API Routes (App Router)
- **Database**: MongoDB via Mongoose
- **Auth**: NextAuth.js (Google OAuth, GitHub OAuth, Email/Password with bcrypt + JWT)

### Integrations
| Service | Purpose |
|---|---|
| Google GenAI (Gemini) | AI interview engine & resume analysis |
| OpenAI API | Supplementary LLM processing |
| Google Calendar API | Auto-generate Google Meet links at booking |
| Cloudinary | Avatar and asset storage |
| Nodemailer | Booking confirmation & reschedule emails |
| Razorpay | Payment processing for paid mentor sessions |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster (or local instance)
- Google Cloud project with **Calendar API** enabled

### 1. Clone
```bash
git clone https://github.com/sumitksr/Ai-Interview.git
cd Ai-Interview
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```ini
# ── Database ──────────────────────────────────────────────────────────────────
MONGO_URI=your_mongodb_connection_string

# ── Auth ──────────────────────────────────────────────────────────────────────
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# ── OAuth (NextAuth login) ────────────────────────────────────────────────────
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# ── Google Calendar API (auto-generates Google Meet links at booking) ─────────
# See "Google Meet Setup" section below for how to get these values.
GOOGLE_CALENDAR_CLIENT_ID=your_calendar_oauth_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_oauth_client_secret
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token

# ── AI APIs ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY=your_openai_api_key

# ── File Storage (Cloudinary) ─────────────────────────────────────────────────
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=

# ── Email (Nodemailer) ────────────────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# ── Payments (Razorpay) ───────────────────────────────────────────────────────
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Google Meet Setup (One-Time)

This step is required so the platform can auto-generate Google Meet links when sessions are booked.

**Step 1 — Google Cloud Console**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Google Calendar API** on your project
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add `http://localhost:3001` to **Authorized redirect URIs**
6. Copy the **Client ID** and **Client Secret**

**Step 2 — Get your refresh token (run once locally)**

Open `scripts/get-google-token.mjs` and paste your Client ID and Client Secret into the top of the file, then run:

```bash
node scripts/get-google-token.mjs
```

A browser window will open. Sign in with the Google account that will host the Meet events. After authorizing, your terminal will print:

```
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REFRESH_TOKEN=...
```

Paste all three into your `.env` file (and into Vercel environment variables for production).

> **Note**: You can reuse the same OAuth client ID/secret as your Google login credentials, provided the **Google Calendar API** is enabled in that same Google Cloud project.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

```text
Ai-Interview/
├── app/
│   ├── api/v1/              # API routes (auth, booking, teacher, meet, payment)
│   ├── dashboard/           # Candidate & mentor dashboards
│   ├── interview/           # AI mock interview interface
│   ├── meet/[id]/           # Secure meeting redirect (→ Google Meet)
│   ├── mentor/              # Mentor profile pages
│   └── (other pages)        # Login, Signup, About, Contact, Landing
├── components/              # Shared UI components (Navbar, Footer, etc.)
├── context/                 # React Context providers
├── lib/
│   ├── getAuthUser.js       # Unified auth helper (JWT + NextAuth)
│   ├── googleCalendar.js    # Google Calendar API — Meet link generation
│   ├── sendBookingEmail.js  # Nodemailer booking/reschedule emails
│   └── mongodb.js           # DB connection
├── models/                  # Mongoose schemas (User, Booking, Teacher, etc.)
├── scripts/
│   └── get-google-token.mjs # One-time OAuth2 refresh token helper
└── public/                  # Static assets
```

---

## 🔐 Security Notes

- Google Meet links are stored server-side in MongoDB and **never sent to the browser**
- The `/meet/:id` route performs full auth, authorization, time, and status checks before redirecting
- All authorization logic runs on the server (Next.js Server Components + API Routes)
- Payment signatures are verified server-side using HMAC-SHA256 before any booking is created

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Sumit Kumar](https://github.com/sumitksr)
