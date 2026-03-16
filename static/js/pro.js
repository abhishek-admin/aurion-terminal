// =============================================
// AURION TERMINAL — pro.js
// Tier management, usage tracking, upgrade modal,
// feature gating for Free vs Pro
// =============================================

// --- CONSTANTS ---
const PRO_CONFIG = {
    FREE_AI_LIMIT: 3,
    FREE_NEWS_LIMIT: 15,
    FREE_TRACKED_LIMIT: 5,
    FREE_REFRESH_MS: 60000,
    PRO_REFRESH_MS: 18000,
    FREE_SECTORS: ['NIFTY IT', 'BANK', 'PHARMA', 'ENERGY'],
    LOCKED_SECTORS: ['AUTO', 'FMCG', 'METAL', 'REALTY'],
    NIFTY50_TICKERS: [
        'ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK',
        'BAJAJ-AUTO','BAJFINANCE','BAJAJFINSV','BPCL','BHARTIARTL',
        'BRITANNIA','CIPLA','COALINDIA','DIVISLAB','DRREDDY',
        'EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE',
        'HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','ITC',
        'INDUSINDBK','INFY','JSWSTEEL','KOTAKBANK','LT',
        'LTIM','M&M','MARUTI','NESTLEIND','NTPC',
        'ONGC','POWERGRID','RELIANCE','SBILIFE','SBIN',
        'SUNPHARMA','TCS','TATACONSUM','TATAMOTORS','TATASTEEL',
        'TECHM','TITAN','ULTRACEMCO','WIPRO','APOLLOHOSP'
    ]
};

// --- TIER STATE ---
function _getProState() {
    try {
        const raw = localStorage.getItem('aurion_pro');
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
}

function _setProState(state) {
    localStorage.setItem('aurion_pro', JSON.stringify(state));
}

function _initProState() {
    let state = _getProState();
    const today = new Date().toISOString().slice(0, 10);
    if (!state) {
        state = { tier: 'free', ai_used: 0, ai_date: today };
        _setProState(state);
    }
    // Reset daily AI counter if new day
    if (state.ai_date !== today) {
        state.ai_used = 0;
        state.ai_date = today;
        _setProState(state);
    }
    return state;
}

function isPro() {
    const state = _getProState();
    return state && state.tier === 'pro';
}

function getAIUsedToday() {
    const state = _initProState();
    return state.ai_used;
}

function incrementAIUsage() {
    const state = _initProState();
    state.ai_used++;
    _setProState(state);
    return state.ai_used;
}

function canUseAI() {
    if (isPro()) return true;
    return getAIUsedToday() < PRO_CONFIG.FREE_AI_LIMIT;
}

function getAIRemaining() {
    if (isPro()) return Infinity;
    return Math.max(0, PRO_CONFIG.FREE_AI_LIMIT - getAIUsedToday());
}

function isSectorLocked(sectorName) {
    if (isPro()) return false;
    return PRO_CONFIG.LOCKED_SECTORS.includes(sectorName);
}

function isStockAllowed(ticker) {
    if (isPro()) return true;
    const t = ticker.toUpperCase().replace('.NS', '').replace(/[^A-Z0-9&-]/g, '');
    return PRO_CONFIG.NIFTY50_TICKERS.includes(t);
}

function getRefreshInterval() {
    return isPro() ? PRO_CONFIG.PRO_REFRESH_MS : PRO_CONFIG.FREE_REFRESH_MS;
}

function getNewsLimit() {
    return isPro() ? 999 : PRO_CONFIG.FREE_NEWS_LIMIT;
}

function getTrackedLimit() {
    return isPro() ? 999 : PRO_CONFIG.FREE_TRACKED_LIMIT;
}

// --- UPGRADE MODAL ---
function showUpgradeModal(reason) {
    // Don't show more than once per 3 minutes
    const last = parseInt(sessionStorage.getItem('_upgrade_shown') || '0');
    if (Date.now() - last < 180000 && reason !== 'manual') return;
    sessionStorage.setItem('_upgrade_shown', Date.now().toString());

    let reasonHTML = '';
    switch (reason) {
        case 'ai_limit':
            const used = getAIUsedToday();
            reasonHTML = `<div class="up-reason">You've used <span style="color:var(--accent);font-weight:700">${used}/${PRO_CONFIG.FREE_AI_LIMIT}</span> AI reports today.</div>`;
            break;
        case 'sector_locked':
            reasonHTML = `<div class="up-reason">This sector is available on <span style="color:var(--accent);font-weight:700">Aurion Pro</span>.</div>`;
            break;
        case 'news_limit':
            reasonHTML = `<div class="up-reason">Free tier shows ${PRO_CONFIG.FREE_NEWS_LIMIT} articles. Pro unlocks all <span style="color:var(--accent);font-weight:700">80+</span> headlines.</div>`;
            break;
        case 'stock_limit':
            reasonHTML = `<div class="up-reason">Free search covers NIFTY 50 only. Pro unlocks <span style="color:var(--accent);font-weight:700">5,000+</span> stocks.</div>`;
            break;
        case 'tracked_limit':
            reasonHTML = `<div class="up-reason">Free tier allows ${PRO_CONFIG.FREE_TRACKED_LIMIT} tracked stocks. Pro is <span style="color:var(--accent);font-weight:700">unlimited</span>.</div>`;
            break;
        case 'ai_news':
            reasonHTML = `<div class="up-reason">AI News Summaries are a <span style="color:var(--accent);font-weight:700">Pro</span> feature.</div>`;
            break;
        case 'manual':
            reasonHTML = `<div class="up-reason">Unlock the full power of Aurion Terminal.</div>`;
            break;
        default:
            reasonHTML = `<div class="up-reason">This feature requires <span style="color:var(--accent);font-weight:700">Aurion Pro</span>.</div>`;
    }

    document.getElementById('upgrade-overlay').innerHTML = `
        <div class="up-box">
            <button class="up-close" onclick="closeUpgradeModal()">&times;</button>
            <div class="up-icon">⚡</div>
            <h2 class="up-title">AURION PRO</h2>
            <p class="up-subtitle">Professional-grade market intelligence</p>
            ${reasonHTML}
            <div class="up-features">
                <div class="up-feat"><span class="up-check">✓</span> Unlimited AI reports (stock, macro, news)</div>
                <div class="up-feat"><span class="up-check">✓</span> All 8 sectors with drill-down</div>
                <div class="up-feat"><span class="up-check">✓</span> 80+ news articles with AI summaries</div>
                <div class="up-feat"><span class="up-check">✓</span> 5,000+ stock search database</div>
                <div class="up-feat"><span class="up-check">✓</span> 18-second real-time refresh</div>
                <div class="up-feat"><span class="up-check">✓</span> Live Bloomberg-style blink animations</div>
                <div class="up-feat"><span class="up-check">✓</span> Unlimited watchlist tracking</div>
                <div class="up-feat"><span class="up-check">✓</span> Stress Index spike alerts</div>
            </div>
            <div class="up-pricing">
                <div class="up-plan" onclick="selectProPlan('monthly')">
                    <div class="up-plan-price">₹299<span>/mo</span></div>
                    <div class="up-plan-label">Monthly</div>
                </div>
                <div class="up-plan up-plan-best" onclick="selectProPlan('yearly')">
                    <div class="up-plan-save">SAVE 30%</div>
                    <div class="up-plan-price">₹2,499<span>/yr</span></div>
                    <div class="up-plan-label">Annual</div>
                </div>
            </div>
            <button class="up-cta" onclick="goToProPage()">Upgrade Now →</button>
            <p class="up-footer">UPI • Cards • Net Banking &bull; Cancel anytime</p>
        </div>
    `;
    document.getElementById('upgrade-overlay').style.display = 'flex';
}

function closeUpgradeModal() {
    document.getElementById('upgrade-overlay').style.display = 'none';
}

function selectProPlan(plan) {
    // Future: integrate with Razorpay
    goToProPage();
}

function goToProPage() {
    closeUpgradeModal();
    window.open('/pro', '_blank');
}

// --- PRO BADGE COMPONENT ---
function proBadgeHTML(small) {
    const s = small ? 'font-size:8px;padding:2px 5px;' : 'font-size:9px;padding:3px 8px;';
    return `<span class="pro-badge" style="${s}">PRO</span>`;
}

// --- INIT ---
_initProState();
