# LaunchMintAI: The Brutal Startup Intelligence Engine 🚀

Stop building shit nobody wants. **LaunchMintAI** is a forensic research engine that uses dual-layer search grounding, OMEGA-grade auditing, and parallel agentic analysis to tear your business ideas apart and rebuild them into viable, battle-hardened models. 

![LaunchMintAI Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## 🧠 The War Chest: Core Intelligence Modules

The system isn't just an "AI Wrapper." It’s an ensemble of **20+ Specialized Extension Engines** that perform cold-blooded analysis on every facet of a startup.

1.  **Validator (Market Research)**: Real-time data extraction (TAM/CAGR). Now features the **Adversarial Scrutiny Layer** where a Skeptic Agent cross-references all numbers against raw source text.
2.  **War Room (Strategy)**: Infiltrate the competition. Deep-dive into rivals’ financials and craft "Kill Strategies."
3.  **VC Roast (The Skeptic)**: A ruthless analysis of your fatal flaws. If you can survive the roast, you might survive the market.
4.  **Pitch Forge (Sales)**: Instant, high-conversion taglines, elevator pitches, and value-props that don't sound like GPT-generated fluff.
5.  **Strategic Delta Analysis**: Compare archived reports to identify market shifts, timing windows, and competitive gaps.
6.  **Departmental Architect**: Generates specific, tactical priority logs for Legal, Product, Marketing, and Finance departments.

---

## 🛠️ Technical Fortress

### Backend: The Reflex Engine (Python/FastAPI)
The backend is built for **Latency-First Reasoning** and **100% Data Grounding**.
-   **Adversarial Multi-Agent Audit**: Implements a dedicated **Skeptic Agent** that performs direct string-matching and numeric comparisons against source text. Deviations >5% trigger immediate search retries.
-   **Truth-Grounded CAGR**: Forces Python-based deterministic calculation of growth rates from raw TAM numbers to prevent LLM scaling hallucinations.
-   **Scale Integrity Protocol**: Mandatory **Trillion-to-Billion normalization** and explicit scope extraction (Global vs Regional) for all market values.
-   **Framework**: FastAPI + Uvicorn for high-performance async execution.
-   **Brains**: Google Gemini 2.0 Flash (Default) with Multi-Key Rotation/Failover.
-   **Failure on Mismatch**: Ensures the system throws a **Validation Error (HTTP 422)** if primary numbers in the Market Vitals section cannot be factually grounded to the cited URL after 3 retry attempts.
-   **Persistence**: Persistence via Vector DB (Chroma) for long-term intelligence gathering and "Corporate Giant" memory.

### Frontend: Stealth Terminal Control (React/Vite)
A premium, high-octane UI designed to make strategic analysis feel like a mission-critical military operation.
-   **Tech**: React 19 + TypeScript + Vite 6.
-   **Design System**: Custom **Stealth Terminal** aesthetics with Glassmorphism and tactical HUD overlays.
-   **Navigation**: Dynamic Feature Switcher with real-time "Engine Status" monitoring and latency tracking.
-   **UX**: Lucide Icons for micro-interactions and high-fidelity tactical feedback.

---

## 🚀 Deployment & Operations

### 1. The Repository
```bash
git clone https://github.com/Jatin23K/LaunchMintAI.git
cd LaunchMintAI
```

### 2. Backend (FastAPI)
Requires Python 3.10+
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```
**Environment Configuration (`backend/.env`):**
```env
GEMINI_API_KEY=key_0
GEMINI_API_KEY_2=key_1  # Support for rotating keys
GEMINI_API_KEY_3=key_2
TAVILY_API_KEY=your_key
```
**Run Server:**
```bash
# Recommended for stability on Windows:
python -m app.main
```

### 3. Frontend (React)
Requires Node.js 18+
```bash
cd frontend
npm install
```
**Environment Configuration (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://127.0.0.1:8000 # Use 127.0.0.1 to avoid Windows localhost issues
```
**Run App:**
```bash
npm run dev
```

---

## ⚠️ The "No-Bullshit" Disclaimer
LaunchMintAI provides strategic insights based on public data signals and agentic logic. It does **not** replace the founder's grit, terminal-velocity execution, or the actual need to talk to users. Use it to build faster and fail less. If your idea is trash, this engine will tell you. Listen to it.
