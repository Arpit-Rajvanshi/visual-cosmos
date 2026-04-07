# 🌌 Virtual Cosmos 

This is the official submission repository for **Virtual Cosmos**, a production-ready 2D multiplayer proximity environment where users naturally connect based on spatial presence.


## 🚀 The Concept
Users existence in a shared real-time 2D space. Players navigate using standard `[W] [A] [S] [D]` movement mechanics across an infinite canvas. When two players navigate within a predefined proximity radius (`< 100px`), they automatically form an encrypted socket connection—instantiating a beautiful glassmorphic proximity chat interface. The moment they walk away, the connection fades and the chat smoothly vanishes.

## ✨ Core Features
*   **Real-time Spatial Architecture**: WebSocket communication perfectly synchronized with absolute XYZ coordinate graphs.
*   **Physics & Interpolation Engine**: PixiJS v8 ticker engine beautifully calculates target trajectories between packets ensuring pixel-perfect 60FPS fluid movements. 
*   **Dynamic Chat Routing**: Express/Node servers instantly formulate and destroy socket `.to()` rooms dynamically validating Euclidean distances natively preventing client-side spoofing.
*   **Premium Glassmorphic UI**: Heavily optimized Tailwind CSS layers with backdrop blurs, organic micro-animations, and fluid transitions.
*   **Full Production Readiness**: Dockerized architecture ready for Vercel/Render deployment with automated orchestration.

## 🛠️ Technology Stack
- **Frontend Layer**: React 18, Vite, PixiJS v8, Tailwind CSS, Lucide Icons.
- **Backend Layer**: Node.js, Express, Socket.IO, Mongoose.
- **Orchestration**: Docker, Docker Compose.

---

## ⚙️ Quick Start Installation (Local)

### 1. Zero-Config Docker Setup (Recommended)
If you have Docker installed, you can spin up the entire full-stack ecosystem with a single command:
```sh
docker-compose up --build
```
*Frontend will map to `http://localhost:5173` and Backend API to `http://localhost:3001`.*

### 2. Manual Development Setup

**Terminal 1: Start the Event Engine (Backend)**
```sh
cd server
npm install
npm start
```

**Terminal 2: Start the Canvas App (Frontend)**
```sh
cd client
npm install
npm run dev
```

---


> Built with love using the world's most performant real-time frameworks to pioneer natural spatial communication. 🌌
