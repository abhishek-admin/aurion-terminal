// =============================================
// AURION TERMINAL — market.js
// State management, polling, market hours, jitter
// =============================================

// --- STATE ---
let lastRefreshTs = Date.now() / 1000;
let marketData = {}; let marketHours = {}; let simPrices = {};
let stressVal = 40.0; let anyMarketOpen = false;
let newsDataCache = []; let sentimentDataCache = [];

async function pollMarket() {
    try {
        const r = await fetch('/api/market');
        const d = await r.json();
        marketData = d.data; marketHours = d.hours;

        stressVal = marketData.STRESS || 40.0;
        lastRefreshTs = Date.now() / 1000;

        const keys = ['NIFTY', 'SENSEX', 'BANKNIFTY', 'INRUSD', 'BRENT', 'GOLD', 'VIX_US', 'DXY', 'US10Y', 'NASDAQ', 'BTC'];
        anyMarketOpen = false;
        keys.forEach(k => {
            if (marketData[k]) {
                if (!simPrices[k]) simPrices[k] = { display: marketData[k].val };
                simPrices[k].base = marketData[k].val;
                simPrices[k].chg_pct = marketData[k].chg_pct;
                simPrices[k].open = isMarketOpen(k);
                if (simPrices[k].open) anyMarketOpen = true;
            }
        });

        renderTickerStrip(); renderRadar(); generateAlerts();
    } catch (e) { }
}

async function pollNews() {
    try {
        const r = await fetch('/api/news');
        newsDataCache = await r.json();
        renderNews();
    } catch (e) { }
}

async function pollSentiment() {
    try {
        const r = await fetch('/api/sentiment');
        sentimentDataCache = await r.json();
        renderSentiment();
    } catch (e) { }
}

async function pollSectors() {
    try {
        const r = await fetch('/api/sectors');
        renderSectors(await r.json());
    } catch (e) { }
}

window.apiRefresh = async function () {
    try {
        await fetch('/api/refresh', { method: 'POST' });
        pollMarket(); pollNews(); pollSectors(); pollSentiment();
    } catch (e) { }
}

function isMarketOpen(key) {
    if (!marketHours[key]) return false;
    const conf = marketHours[key];
    const mTime = new Date(new Date().getTime() + conf.tz * 3600000);
    let day = mTime.getUTCDay() - 1;
    if (day === -1) day = 6;
    if (!conf.days.includes(day)) return false;
    const hhmm = String(mTime.getUTCHours()).padStart(2, '0') + ':' + String(mTime.getUTCMinutes()).padStart(2, '0');
    return hhmm >= conf.open && hhmm <= conf.close;
}

// --- REFRESH AGO ---
setInterval(() => {
    const secs = Math.floor((Date.now() / 1000) - lastRefreshTs);
    document.getElementById('ref-ago').textContent = secs < 5 ? 'just now' : (secs < 60 ? secs + 's ago' : Math.floor(secs / 60) + 'm ago');
}, 1000);

// --- JITTERS ---
let lastGaugeJitterTs = 0;
setInterval(() => {
    Object.keys(simPrices).forEach(k => {
        let it = simPrices[k];
        if (it.open && it.base > 0) {
            it.display = it.base + (it.base * (Math.random() - 0.5) * 0.0002);
        } else { it.display = it.base; }
    });
    // CRITICAL FIX: Do NOT rebuild DOM — only update text values in place
    updateTickerValues();

    // Gauge Jitter logic
    const now = Date.now();
    if (anyMarketOpen) {
        const jitterMag = 0.6;
        const jitter = (Math.random() - 0.5) * jitterMag;
        let dVal = Math.max(0, Math.min(100, stressVal + jitter));
        document.getElementById('g-val').textContent = dVal.toFixed(1);
        const deg = -90 + (dVal / 100) * 180;
        document.getElementById('g-needle').style.transform = `rotate(${deg}deg)`;
        lastGaugeJitterTs = now;
    } else {
        document.getElementById('g-val').textContent = stressVal.toFixed(1);
        const deg = -90 + (stressVal / 100) * 180;
        document.getElementById('g-needle').style.transform = `rotate(${deg}deg)`;
    }
}, 350);
