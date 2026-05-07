# LaunchMintAI - Brutal Startup Intelligence Engine

## Project Overview
LaunchMintAI is a high-octane research engine that uses dual-layer search grounding and parallel agentic analysis to tear startup ideas apart and rebuild them into viable business models. It prevents founders from "building shit nobody wants" by providing brutal, data-grounded intelligence.

## Core Intelligence Modules
1. **Validator**: Real-time market data extraction (TAM/CAGR) using Tavily + Gemini 1.5/2.0 Flash with adversarial scrutiny
2. **War Room (Corporate Spy)**: Infiltrate competition, get deep-dive financials and "kill strategies" for incumbents
3. **VC Roast (The Skeptic)**: Ruthless analysis of fatal flaws - if you survive, you might survive the market
4. **Pitch Forge (The Salesman)**: Instant, high-conversion taglines, elevator pitches, and value propositions

## Technical Architecture
- **Frontend**: React 19 + TypeScript + Vite 6 with stealth terminal UI (glassmorphism, tactical HUD overlays)
- **Backend**: FastAPI (Python) + Unified Extension System with 20+ specialized modules
- **LLM**: Google Gemini 2.0 Flash (default) with multi-key rotation/failover
- **Search**: Tavily AI (God Mode grounded search)
- **Database**: SQLite with SQLModel for persistence
- **Validation**: Adversarial multi-agent audit with Skeptic Agent that performs direct string-matching against source text

## Key Features
- **Waterfall Search Strategy**: Prioritizes McKinsey, BCG, Gartner, Statista sources first
- **AI Judge**: Every search result semantically audited by separate LLM pass to filter SEO garbage
- **Math Fallback**: Calculates missing data from forecasts + CAGR to ensure logical growth narrative
- **Truth-Grounded CAGR**: Python-based deterministic calculation to prevent LLM scaling hallucinations
- **Scale Integrity Protocol**: Mandatory trillion-to-billion normalization and explicit scope extraction
- **Failure on Mismatch**: Throws Validation Error (HTTP 422) if primary numbers can't be factually grounded after 3 retries
- **Persistence**: Vector DB (Chroma) for long-term intelligence gathering

## Extension System
The backend uses a plugin architecture with 20+ specialized extension engines:
- Market Research, War Room, VC Roast, Pitch Forge (core)
- Strategic Delta Analysis, Departmental Architect
- Legal Compliance, User Persona, Hiring Team
- Financial Projection, GTM Strategy, Roadmap Generator
- Product Storytelling, Vision/North Star, Decision Simulator
- Document Intelligence, People Analysis, Fundraising Intelligence
- Risk Scanner, Competitor Deep Dive, Metrics/KPI
- Business Model, etc.

## Development Setup
### Backend (Python 3.10+)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
# Create backend/.env with:
# GEMINI_API_KEY=your_key
# GEMINI_API_KEY_2=key_1 (rotation)
# GEMINI_API_KEY_3=key_2
# TAVILY_API_KEY=your_key
python -m app.main  # Recommended for stability on Windows
```

### Frontend (Node.js 18+)
```bash
cd frontend
npm install
# Create frontend/.env with:
# VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

## Design Principles
1. **Latency-First Reasoning**: Built for speed without sacrificing depth
2. **100% Data Grounding**: Zero tolerance for hallucinations
3. **Adversarial Multi-Agent Audit**: Dedicated Skeptic Agent cross-references all numbers
4. **Framework Agnostic Extensions**: Easy to add new specialized analysis modules
5. **Stealth Terminal UX**: Military-grade interface for strategic analysis feel

## Current State
Fully functional research engine with working backend API and frontend UI. All core modules (Validator, War Room, VC Roast, Pitch Forge) are implemented and tested. Extension system is in place with multiple specialized modules already built.

## Immediate Priorities
1. Extend test coverage for edge cases in validation logic
2. Optimize search result formatting for better LLM consumption
3. Enhance extension registry for dynamic module loading
4. Improve error handling in API integrations
5. Add more sophisticated caching for repeated queries