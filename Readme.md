# PrepAI - Advanced AI Interview & Resume Platform

![PrepAI Architecture](Architecture.png)

## 🌐 Live Demo
- **Frontend App**: [http://aceai.sumitksr.xyz/](http://aceai.sumitksr.xyz/)
- **Backend (Socket Server)**: [https://ai-interview-mst0.onrender.com](https://ai-interview-mst0.onrender.com)

## 📖 Overview

**PrepAI** is a cutting-edge interview preparation platform designed to help candidates land their dream jobs. By combining adaptive AI mock interviews with deep resume intelligence, PrepAI provides an all-in-one workspace to practice, analyze, and improve. 

Whether you are targeting a role as a Software Engineer, Product Manager, or Data Analyst, the platform dynamically generates relevant technical and behavioral questions, evaluates your answers in real-time, and scores your delivery across multiple metrics.

## ✨ Comprehensive Feature Suite

### 🎙️ Immersive AI Mock Interviews
Experience the pressure and realism of actual job interviews through our state-of-the-art AI simulations.
- **Context-Aware Questioning**: The AI dynamically adapts its questions based on your resume, the target job description, and your previous answers, ensuring no two interviews are exactly the same.
- **Multi-Modal Interaction**: Choose between typing your answers for technical assessments or using your microphone for behavioral rounds. Our advanced speech-to-text processing captures every nuance of your delivery.
- **Instant Behavioral & Technical Feedback**: The AI evaluates your responses against industry standards, immediately identifying missing context, checking if you successfully applied the STAR (Situation, Task, Action, Result) method, and evaluating your technical accuracy.

### 📄 Deep Resume Intelligence
Your resume is your first impression. PrepAI breaks it down line-by-line to ensure it passes ATS (Applicant Tracking Systems) and catches recruiters' eyes.
- **ATS Keyword Optimization**: Upload a target job description and your resume. The platform highlights missing critical keywords and suggests where to naturally incorporate them.
- **Action-Oriented Impact Framing**: Weak bullet points are automatically detected. The AI suggests powerful, action-verb-driven rewrites that emphasize quantifiable metrics and business outcomes.
- **Interview-Resume Synergy**: The platform actively connects your resume claims to your interview answers, ensuring your verbal narrative perfectly matches your written experience.

### 📊 Advanced Candidate Dashboard
Track your growth with granular data visualization and actionable insights.
- **Holistic Score Tracking**: Monitor your performance trends over time with aggregated scores for Clarity, Technical Depth, Confidence, and Communication skills.
- **Actionable Feedback Loops**: After every session, receive a prioritized list of "Next Steps" and targeted micro-drills to fix specific weaknesses before your next attempt.
- **Historical Session Playback**: Access transcripts and evaluations of your past interviews. Identify your filler words, pacing issues, and see how your answers have evolved.

### 👥 Mentor & Educator Portal
A dedicated workspace for career coaches, mentors, and professors to guide candidates.
- **Asynchronous Expert Review**: Mentors can review transcripts and evaluations of a candidate's mock interview and leave tailored feedback.
- **Custom Curriculum Assignment**: Mentors can assign specific interview drill sets or customized focus areas to specific students.
- **Cohort Analytics**: Monitor candidate progress and pinpoint common areas where they struggle to refine your coaching focus.

### ⚡ Real-Time Socket Architecture
- **Seamless Connectivity**: Built-in low-latency socket server ensures smooth, real-time signaling for voice processing and instantaneous AI chat responses.
- **Scalable Infrastructure**: Deployed with a decoupled architecture (Next.js Frontend + Dedicated Node Socket Backend) to handle high concurrency effortlessly.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, Custom CSS (Glassmorphism, Dark Mode)
- **Charts**: Recharts

### Backend
- **Server**: Node.js & Next.js API Routes
- **Database**: MongoDB (Mongoose)
- **Authentication**: NextAuth.js (Google, GitHub, Credentials via bcrypt & JWT)

### AI & Utilities
- **LLM Integration**: Google GenAI (Gemini), OpenAI API
- **Document Parsing**: `pdf-parse`, `pdf2json` (for resume extraction)
- **File Storage**: Cloudinary (for avatars and assets)
- **Email**: Nodemailer (for notifications and invites)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- API Keys for Google GenAI, OpenAI, Cloudinary, and OAuth providers.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Ai-Interview.git
cd Ai-Interview
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory by copying the `.env.example` file. Fill in your specific keys:

```ini
# Database
MONGO_URI=your_mongodb_connection_string

# Authentication Secrets
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI APIs
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# File Upload (Cloudinary)
CLOUDINARY_API_ENV=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=

# Email (Nodemailer)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
```

### 4. Seed the Database (Optional)
If you want to populate the database with initial mock data (roles, sample questions):
```bash
npm run seed
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 📂 Project Structure

```text
Ai-Interview/
├── app/                  # Next.js App Router (Pages & API routes)
│   ├── api/              # Backend endpoints (Auth, AI Processing, DB operations)
│   ├── dashboard/        # Candidate progress tracking views
│   ├── interview/        # Active mock interview interface
│   └── (other pages)     # Auth, About, Landing pages
├── components/           # Reusable UI components (Navbar, Footer, etc.)
├── context/              # React Context providers (AuthContext, etc.)
├── lib/                  # Utility functions and DB connection logic
├── models/               # Mongoose database schemas
├── public/               # Static assets (Images, Icons)
└── scripts/              # Helper scripts (Database seeding)
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

