# Axiom-Sovereign

Elite 3D Socratic Tutor for Orbital Mechanics.

## 🚀 Deployment (REQUIRED)

This project requires a backend to securely handle AI inference and avoid CORS issues.

**DO NOT USE GITHUB PAGES.** This application must be deployed to **Vercel** to support Next.js API Routes.

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com).
3. Import the `axiom-sovereign` repository.
4. Add the Environment Variable: `NVIDIA_API_KEY` with your `nvapi-` key.
5. Deploy.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **3D Engine:** React Three Fiber + Rapier Physics
- **AI Brain:** Llama 3.1 70B via NVIDIA NIM
- **State Sync:** Yjs (CRDTs)
- **Aesthetic:** Veritasium-Dark (Custom GLSL Shaders)

## 📖 Socratic Method

The AI follows the **T+1 Rule**: it identifies the next conceptual step and guides you there through hints and simulation changes, never providing the direct answer.
