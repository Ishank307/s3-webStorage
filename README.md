# 🗂️ AWS S3 File Manager (V3)

A full-stack file management web app built with **React (Vite)**, **Express.js**, and **AWS S3** — supporting secure file uploads, downloads, and deletions using **presigned URLs** and **session-based authentication**.

🚀 **Live Demo:** [https://s3-webstorage.vercel.app/](https://s3-webstorage.vercel.app/)

---

## 🌟 Features

- 🔐 **Secure Authentication** — Session-based with environment variable handling  
- ☁️ **AWS S3 Integration** — Upload, list, download, and delete files securely  
- 💾 **Presigned URLs** — Safe, time-limited file operations  
- 🧠 **Smart Error Handling** — User-friendly error messages and feedback  
- 📱 **Responsive UI** — Modern design that adapts across devices  
- ⚙️ **Serverless Ready** — Deployed with **Vercel serverless functions**  
- 🧩 **Scalable Architecture** — Clean separation between client & server  

---

## 🏗️ Tech Stack

**Frontend:** React 19 + Vite  
**Backend:** Express.js + AWS SDK v3  
**Deployment:** Vercel  
**Storage:** AWS S3  
**Security:** Presigned URLs, Session-based Auth  

---

## 📁 Project Structure
```

aws-s3-file-manager-v3/
├── client/ # React frontend
│ ├── src/
│ ├── public/
│ └── vite.config.js
│
├── server/ # Express backend
│ ├── routes/
│ ├── utils/
│ ├── index.js
│ └── .env.example
│
└── package.json
```

---

## ⚙️ Setup Guide

### 1️⃣ Clone the repository

git clone https://github.com/<your-username>/aws-s3-file-manager-v3.git
cd aws-s3-file-manager-v3

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
SESSION_SECRET=your_random_secret
```

Backend:
cd server
npm run dev


Frontend:
cd client
npm run dev
