# 🔥 Aurion Terminal - Indian Equity Market Dashboard

![Aurion Terminal UI](https://img.shields.io/badge/UI-Cinematic_Glassmorphism-06b6d4?style=for-the-badge) ![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Flask](https://img.shields.io/badge/Flask-Web_Framework-000000?style=for-the-badge&logo=flask&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Aurion Terminal** is an elite, high-fidelity quantitative market dashboard meticulously engineered for the absolute best user experience. It seamlessly bridges real-time market telemetry, custom CSV databases, and state-of-the-art AI generation to give you autonomous intelligence over the Indian stock market (NSE/BSE) and global indices.

---

## ✨ Core Features

*   📈 **Real-Time Global Telemetry** 
    Live tracking of NIFTY 50, Bank Nifty, Sensex, Brent Crude, India VIX, US 10Y Yields, and DXY through backend multi-threaded YFinance adapters.
*   🧠 **LLM-Powered Autonomous Reports**
    Integrated directly with Google's **Gemini 2.5 Flash API** using explicit instruction prompting. Generates on-demand structural, macro, and sentiment analysis for **any** stock or sector.
*   🌐 **Live Web-Search Grounding**
    If a real-time price or underlying corporate fundamental isn't cached locally, the AI dynamically spans continuous Google Searches to assemble accurate logic and LTP (Last Traded Price).
*   📰 **Algorithmic Sentiment & News Stream**
    A concurrent backend thread parses 15+ live RSS feeds (Economic Times, LiveMint, Reuters). Every news piece is assigned a calculated `[BULLISH]`, `[BEARISH]`, or `[NEUTRAL]` tag. Clicking an article triggers a real-time AI Summary of the event!
*   📊 **Dhan Stock Database Integration**
    Loads thousands of ticker symbols directly from your local `Dhan CSV` architecture, making them instantly searchable with full autocomplete.
*   🕯️ **TradingView Embeds**
    Dynamic and responsive fallback charts for individual equities.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Python 3.8+** installed on your system. 

### Local Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/aurion-terminal.git
   cd aurion-terminal
   ```

2. **Install Dependencies**
   The project auto-installs requirements on boot, but you can install them manually:
   ```bash
   pip install flask feedparser yfinance requests werkzeug
   ```

3. **Run the Terminal Server**
   ```bash
   python main.py
   ```

4. **Access the Terminal**
   Open your browser and navigate to:
   ```text
   http://localhost:5000
   ```

### ⚙️ Setting Up The AI

To unlock the core Deep Intelligence features, you will need a Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/) and grab a free Gemini API Key.
2. Open Aurion Terminal in your browser.
3. Click the **Settings** gear icon (⚙️) in the top-right corner.
4. Paste your API key and click **Save**. (The key is securely stored in your local browser storage via `localStorage`).

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** Pure HTML5, CSS3 (Custom Design System, CSS Variables, Glassmorphism), and Vanilla ES6 JavaScript. No bulky frameworks. Lightweight and blindingly fast.
*   **Backend:** Python `Flask` handling APIs, concurrent request pooling, and caching.
*   **Data Pipelines:** `yfinance`, `feedparser` (for RSS), and `csv` stream parsers.
*   **Artificial Intelligence:** `Google Generative Language API` (Gemini 2.5 Flash) with tool-calling capabilities.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚖️ Disclaimer
*This softare is for educational and research purposes only. The AI-generated reports, sentiment indicators, and financial data should NOT be construed as absolute financial advice.*
