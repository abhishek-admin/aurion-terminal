// =============================================
// AURION TERMINAL — pro.js
// Tier management, usage tracking, upgrade modal,
// feature gating for Free vs Pro
// =============================================

// --- CONSTANTS ---
const PRO_CONFIG = {
    TRIAL_DAYS: 7,
    FREE_AI_LIMIT: 3,
    FREE_NEWS_LIMIT: 3,
    FREE_SENTIMENT_LIMIT: 3,
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
        // First-time visitor: auto-start 7-day free trial
        state = { tier: 'trial', trial_start: Date.now(), ai_used: 0, ai_date: today };
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

function _getTrialDaysLeft() {
    const state = _getProState();
    if (!state || !state.trial_start) return 0;
    const elapsed = Date.now() - state.trial_start;
    const daysLeft = PRO_CONFIG.TRIAL_DAYS - (elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.ceil(daysLeft));
}

function isTrialActive() {
    const state = _getProState();
    if (!state || state.tier !== 'trial') return false;
    return _getTrialDaysLeft() > 0;
}

function isPro() {
    const state = _getProState();
    if (!state) return false;
    // Paid pro
    if (state.tier === 'pro') return true;
    // Active trial = full pro access
    if (state.tier === 'trial') return isTrialActive();
    return false;
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

function getSentimentLimit() {
    return isPro() ? 999 : PRO_CONFIG.FREE_SENTIMENT_LIMIT;
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
        case 'sentiment_limit':
            reasonHTML = `<div class="up-reason">Free tier shows ${PRO_CONFIG.FREE_SENTIMENT_LIMIT} analyst calls. Pro unlocks the full <span style="color:var(--accent);font-weight:700">sentiment stream</span>.</div>`;
            break;
        case 'ai_news':
            reasonHTML = `<div class="up-reason">AI News Summaries are a <span style="color:var(--accent);font-weight:700">Pro</span> feature.</div>`;
            break;
        case 'trial_expired':
            reasonHTML = `<div class="up-reason">Your <span style="color:var(--accent);font-weight:700">7-day free trial</span> has ended. Upgrade to keep full access.</div>`;
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

// --- TRIAL / LIVE DATA BANNER ---
function showLiveDataPrompt() {
    const state = _getProState();
    // Paid pro users — no banner
    if (state && state.tier === 'pro') return;

    // Remove any existing banner first
    const existing = document.getElementById('pro-live-banner');
    if (existing) existing.remove();

    const trialActive = isTrialActive();
    const daysLeft = _getTrialDaysLeft();

    let icon, heading, body, btnText;
    if (trialActive) {
        // During trial: show countdown
        icon = '⏱️';
        heading = `FREE TRIAL — ${daysLeft} DAY${daysLeft !== 1 ? 'S' : ''} LEFT`;
        body = `You have <strong style="color:var(--cyan)">full Pro access</strong> for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}. All features unlocked — enjoy the full Aurion experience.`;
        btnText = 'GO PRO';
    } else {
        // Trial expired or free tier
        icon = '📡';
        heading = 'YOUR FREE TRIAL HAS ENDED';
        body = `You're now on the <strong style="color:var(--bear)">free tier</strong> with limited access. Upgrade to get <strong style="color:var(--cyan)">full Pro features</strong> — unlimited AI, all sectors, live data &amp; more.`;
        btnText = 'UPGRADE NOW';
    }

    const banner = document.createElement('div');
    banner.id = 'pro-live-banner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 48px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9000;
            background: linear-gradient(135deg, rgba(226,171,52,0.15), rgba(6,182,212,0.10));
            border: 1px solid rgba(226,171,52,0.3);
            border-radius: 12px;
            padding: 14px 22px;
            display: flex;
            align-items: center;
            gap: 14px;
            backdrop-filter: blur(16px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            max-width: 580px;
            animation: slideUp 0.4s ease-out;
        ">
            <div style="font-size: 24px; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1;">
                <div style="font-family:'JetBrains Mono'; font-size:11px; font-weight:700; color:var(--accent); letter-spacing:1px; margin-bottom:4px;">${heading}</div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">${body}</div>
            </div>
            <button onclick="window.open('/pro','_blank');this.closest('#pro-live-banner').remove();" style="
                flex-shrink: 0;
                font-family:'JetBrains Mono';
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 1px;
                background: linear-gradient(135deg, var(--accent), #d4942a);
                color: #06060c;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                white-space: nowrap;
            ">${btnText}</button>
            <button onclick="this.closest('#pro-live-banner').remove();" style="
                position: absolute;
                top: 4px; right: 8px;
                background: none; border: none;
                color: var(--text-muted);
                font-size: 14px;
                cursor: pointer;
                padding: 2px;
            ">&times;</button>
        </div>
    `;

    // Inject slide-up animation if not already present
    if (!document.getElementById('pro-banner-anim')) {
        const style = document.createElement('style');
        style.id = 'pro-banner-anim';
        style.textContent = `@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    // Auto-dismiss: 30s during trial, 20s after
    const dismissMs = trialActive ? 30000 : 20000;
    setTimeout(() => {
        const el = document.getElementById('pro-live-banner');
        if (el) {
            el.style.transition = 'opacity 0.3s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }
    }, dismissMs);
}

// Show the prompt 5 seconds after every page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(showLiveDataPrompt, 5000));
} else {
    setTimeout(showLiveDataPrompt, 5000);
}

// --- INIT ---
_initProState();
