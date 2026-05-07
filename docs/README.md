# LaunchMintAI: The Brutal Startup Intelligence Engine 🚀

Stop building shit nobody wants. **LaunchMintAI** is a high-octane research engine that uses dual-layer search grounding and parallel agentic analysis to tear your ideas apart and rebuild them into viable business models.

![LaunchMintAI Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🧠 Core Intelligence Modules

1. **Validator**: Real-time market data extraction (TAM/CAGR) using Tavily + Gemini 1.5 Flash. No hallucinations, just grounded data.
2. **War Room (Corporate Spy)**: Infiltrate the competition. Get deep-dive financials and "kill strategies" for incumbents.
3. **VC Roast (The Skeptic)**: A ruthless analysis of your fatal flaws. If you can survive the roast, you might survive the market.
4. **Pitch Forge (The Salesman)**: Instant, high-conversion taglines, elevator pitches, and value props.

---

## 🛠️ Technical Stack

- **Frontend**: Vite + React + Tailwind + Lucide (Premium UI/UX)
- **Backend**: FastAPI (Python) + Unified Extension System
- **LLM**: Google Gemini 1.5 Flash / 2.0 Flash
- **Search**: Tavily AI (God Mode grounded search)

---

## 🚀 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/Jatin23K/LaunchMintAI.git
cd LaunchMintAI
```

### 2. Backend Installation (Python 3.10+)
```bash
cd backend
python -m venv venv
source venv/bin/scripts/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` in the `backend/` folder:
```env
GEMINI_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key
```
Run the server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Installation (Node.js)
```bash
cd frontend
npm install
```
Create a `.env` in the `frontend/` folder:
```env
VITE_GEMINI_API_KEY=your_gemini_key
```
Run the app:
```bash
npm run dev
```

---

## 🛡️ Architecture
The system uses a **Waterfall Search Strategy**:
1. **Tier 1 Authority**: Scrutinizes McKinsey, BCG, Gartner, and Statista first.
2. **AI Judge**: Every search result is semantically audited by a separate LLM pass to filter out SEO garbage.
3. **Math Fallback**: If sources are missing Current TAM but have Forecasts + CAGR, the engine calculates the missing data to ensure a logical growth narrative.

---

## ⚠️ Disclaimer
LaunchMintAI provides strategic insights based on public data signals. It does not replace terminal-velocity execution or the founder's grit. Use it to build better, move faster, and fail less.
