# 🌀 Zyris – AI Career Assistant

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

<br />

> **A Full-stack MERN + Gemini AI platform for intelligent resume analysis, JD alignment, mock interviews, and automated career prep.**

🔗 **Live Demo:** https://zyris.vercel.app

---

## 📺 Video Demo

https://github.com/user-attachments/assets/24d288de-ef26-42c1-a443-0ef320a82125

---

## 🚀 Overview

Zyris leverages Google's Gemini AI to solve the "resume black box" problem. It analyzes your PDF resume against specific Job Descriptions (JDs), providing actionable feedback, missing keywords, and tailored rewrites to increase shortlist probability.

---

## ✨ Key Features

- **📄 Resume Analysis:** Generates ATS scores, identifies strengths/weaknesses, and parses resume data into structured JSON.
- **🎯 JD Alignment:** Extracts required skills from Job Descriptions and calculates a compatibility match %.
- **🤖 Mock Interviews:** AI generates role-specific interview questions based on the JD and your resume context.
- **✍️ Tailored Resume:** Auto-generates a role-specific version of your resume to increase shortlist probability.
- **🔐 Secure & Persistent:** Google OAuth 2.0 implementation with user history retention and secure data deletion.

---

## 🛠️ Tech Stack

| Component        | Technology |
|------------------|------------|
| Frontend         | React.js (Vite), Tailwind CSS |
| Backend          | Node.js, Express.js |
| Database         | MongoDB (Mongoose) |
| Authentication   | Google OAuth 2.0 |
| AI Engine        | Google Gemini API |
| Deployment       | Vercel (Client), Render (Server) |
---

## 📁 Project Structure

```
Zyris/
├── client/
├── server/
└── README.md
```

---

## 🔧 Run Locally

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Dhruv-Gupta0506/Zyris
cd Zyris
```

---

### 2️⃣ Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

### 3️⃣ Backend Setup

```bash
cd server
npm install
```

---

### 4️⃣ Environment Variables

Create a `.env` file inside the `server` directory and add:

```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_random_secret_string
```

---

### 5️⃣ Start Backend Server

```bash
npm start
```

---

## 📌 Implementation Notes

Cold Starts:  
The backend is deployed on Render's free tier. A cron job is implemented to keep the server warm and ensure fast responses.

Security:  
User sessions are managed via HTTP-only cookies and Google OAuth 2.0.

---

Made with ❤️ by Dhruv Gupta
