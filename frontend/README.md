# LaunchMintAI: Frontend Tactical Interface 🚀

> **Version**: 2.0.0  
> **Framework**: React 19 + TypeScript + Vite 6 + Tailwind CSS  
> **Backend Integration**: Communicates with FastAPI on `http://127.0.0.1:8000`  

---

## 📌 Architecture Overview

The LaunchMintAI frontend is a tactical research terminal designed for early-stage venture validation. It features:
* **VC Roast Engine**: Queries the live Day-0 XGBoost endpoint (`POST /predict_survival`) to display real calibrated survival percentages, risk tiers, and positive/risk SHAP drivers.
* **Validator HUD**: Interactive research workspace showing TAM, CAGR, competitor matrices, and grounded citations.
* **War Room & Strategy Panels**: Interactive competitor vulnerability exploration and tactical priority maps.

---

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (`.env`)
Create a `.env` file in the `frontend/` directory:
```env
# URL for the FastAPI backend engine:
VITE_API_BASE_URL=http://127.0.0.1:8000

# Google AI Studio Gemini Key (for client-side streaming/chat if enabled):
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Development Server
```bash
npm run dev
```
The interface runs at `http://localhost:5173`.

### 4. Production Build Verification
```bash
npm run build
```
Ensures all TypeScript types, React components, and asset bundles compile with zero errors.
