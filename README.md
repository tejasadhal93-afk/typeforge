# TypeForge 2.0 — Full-Stack React + Express + MongoDB Edition ⚡

A high-performance typing tutor web app built with **React 18 + Vite + Zustand + React Router** and a dedicated **Express.js + MongoDB** backend.

---

## 🚀 How to Run in VS Code

1. Open the project folder in VS Code:
```powershell
code C:\Users\Asus\.gemini\antigravity\scratch\typeforge-react
```

2. Open the built-in terminal (`Ctrl + ~`) and start both client & backend:
```powershell
npm start
```
*(Runs both Vite on port 5173 and Express on port 5000 concurrently!)*

Or to run frontend alone:
```powershell
npm run dev
```

Then open **http://localhost:5173** in your browser!

---

## 🗄️ Backend & MongoDB Setup (`/server`)

The backend is pre-configured in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/typeforge
JWT_SECRET=typeforge_dev_secret
```

- **Local MongoDB**: If MongoDB is installed locally on your PC, it connects automatically.
- **MongoDB Atlas**: Replace `MONGODB_URI` with your free MongoDB Atlas connection string.
- **Offline Fallback**: If MongoDB is not running, the frontend seamlessly functions in **Guest Mode** with localStorage — you are never locked out of typing!

---

## 🎹 Elevated Features

| Feature | Description |
|---|---|
| 🏎️ **Pace Car / Ghost Racer** | Live dual-racer track above the typing deck showing your car vs a pace car moving at your chosen target WPM (or your past personal best)! |
| 🔊 **3 Mechanical Sound Profiles** | Choose between **Gateron Ink Thock** (deep linear), **Cherry Blue Clicky** (sharp tactile click), or **Bubble Pop 🫧** (kid-friendly pop) + Live volume slider. |
| 🎨 **4 Customizable Themes** | Switch anytime in the navbar between **Dark Mechanical**, **Cyberpunk Neon**, **Retro Matrix Green**, and **Pastel Candy**. |
| 🏆 **Typing Speed Certificate** | Automatically generated high-res certificate of typing mastery with Net WPM, Accuracy grade, date, and 1-click PNG download. |
| 👤 **User Authentication** | Register/Sign In modal directly in the navbar with bcrypt password hashing and JWT token management. |
| ☁️ **Cloud Sync** | Typing sessions and achievements automatically sync to MongoDB for logged-in users. |
| 🥇 **Global Leaderboard** | Top typists ranked by Best WPM and Average WPM with podium medals (🥇 🥈 🥉). |
| 🎵 **Kids Music Game** | 5 kid-friendly categories with ascending pentatonic chimes, floating note particles, and streak multipliers. |
| 🎯 **Keyboard Error Heatmap** | Dynamic QWERTY heatmap highlighting your most frequently missed keys. |
| 📅 **Daily Challenge** | Deterministic passage synchronized by day-of-year with streak counter. |
