// =============================================
// AURION TERMINAL — renderers.js
// All rendering functions for dashboard panels
// =============================================

const TICKER_KEYS = ['NIFTY', 'SENSEX', 'BANKNIFTY', 'INRUSD', 'BRENT', 'GOLD', 'VIX_US', 'DXY', 'US10Y', 'NASDAQ', 'BTC'];
let _tickerBuilt = false;

// =============================================
// RADAR CATALOG — 50 configurable indicators
// =============================================
const RADAR_CATALOG = {
    // --- Global Rates & Bonds ---
    FED_RATE:    { label:'FED RATE',    cat:'Global Rates',    getValue:d=>'5.50%',                                                            getClass:d=>'c-neutral', getChange:d=>null },
    US10Y:       { label:'US 10Y',      cat:'Global Rates',    getValue:d=>formatVal(_rv('US10Y',(d.US10Y||{}).val))+'%',                       getClass:d=>(d.US10Y||{}).val>4.5?'c-bear':((d.US10Y||{}).val<3.5?'c-bull':'c-neutral'), liveKey:'US10Y', getChange:d=>_fmtChg(d.US10Y) },
    US2Y:        { label:'US 2Y',       cat:'Global Rates',    getValue:d=>'4.85%',                                                            getClass:d=>'c-neutral', getChange:d=>null },
    INDIA10Y:    { label:'INDIA 10Y',   cat:'India Macro',     getValue:d=>'7.02%',                                                            getClass:d=>'c-cyan', getChange:d=>null },
    RBI_RATE:    { label:'RBI RATE',    cat:'India Macro',     getValue:d=>(d.RBI_POLICY||{}).rate?((d.RBI_POLICY||{}).rate+'%'):'--',         getClass:d=>'c-neutral', getChange:d=>null },
    FED_BALANCE: { label:'FED BAL SHT', cat:'Global Rates',    getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- Global Indices ---
    NASDAQ_R:    { label:'NASDAQ',      cat:'Global Indices',  getValue:d=>formatVal(_rv('NASDAQ',(d.NASDAQ||{}).val)),                         getClass:d=>(d.NASDAQ||{}).chg_pct>0.005?'c-bull':((d.NASDAQ||{}).chg_pct<-0.005?'c-bear':'c-neutral'), liveKey:'NASDAQ', getChange:d=>_fmtChg(d.NASDAQ) },
    SP500:       { label:'S&P 500',     cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    DOW:         { label:'DOW JONES',   cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    NIKKEI:      { label:'NIKKEI',      cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    HANGSENG:    { label:'HANG SENG',   cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    DAX:         { label:'DAX',         cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    FTSE:        { label:'FTSE 100',    cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    SGX_NIFTY:   { label:'SGX NIFTY',  cat:'Global Indices',  getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- India Indices ---
    NIFTY_R:     { label:'NIFTY',       cat:'India Indices',   getValue:d=>formatVal(_rv('NIFTY',(d.NIFTY||{}).val)),                          getClass:d=>(d.NIFTY||{}).chg_pct>=0?'c-bull':'c-bear', liveKey:'NIFTY', getChange:d=>_fmtChg(d.NIFTY) },
    SENSEX_R:    { label:'SENSEX',      cat:'India Indices',   getValue:d=>formatVal(_rv('SENSEX',(d.SENSEX||{}).val)),                        getClass:d=>(d.SENSEX||{}).chg_pct>=0?'c-bull':'c-bear', liveKey:'SENSEX', getChange:d=>_fmtChg(d.SENSEX) },
    BANKNIFTY_R: { label:'BANK NIFTY', cat:'India Indices',   getValue:d=>formatVal(_rv('BANKNIFTY',(d.BANKNIFTY||{}).val)),                  getClass:d=>(d.BANKNIFTY||{}).chg_pct>=0?'c-bull':'c-bear', liveKey:'BANKNIFTY', getChange:d=>_fmtChg(d.BANKNIFTY) },
    NIFTY_MID:   { label:'NIFTY MID',  cat:'India Indices',   getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- Volatility ---
    VIX_US_R:    { label:'VIX (US)',    cat:'Volatility',      getValue:d=>formatVal(_rv('VIX_US',(d.VIX_US||{}).val)),                        getClass:d=>(d.VIX_US||{}).val>25?'c-bear':((d.VIX_US||{}).val<18?'c-bull':'c-neutral'), liveKey:'VIX_US', getChange:d=>_fmtChg(d.VIX_US) },
    INDIA_VIX_R: { label:'INDIA VIX',  cat:'Volatility',      getValue:d=>'12.4',                                                             getClass:d=>'c-bull', getChange:d=>null },
    // --- Commodities ---
    BRENT_R:     { label:'BRENT',       cat:'Commodities',     getValue:d=>'$'+formatVal(_rv('BRENT',(d.BRENT||{}).val)),                      getClass:d=>(d.BRENT||{}).chg_pct>0.01?'c-bear':((d.BRENT||{}).chg_pct<-0.01?'c-bull':'c-neutral'), liveKey:'BRENT', getChange:d=>_fmtChg(d.BRENT) },
    WTI:         { label:'WTI',         cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    GOLD_R:      { label:'GOLD',        cat:'Commodities',     getValue:d=>'$'+formatVal(_rv('GOLD',(d.GOLD||{}).val)),                        getClass:d=>(d.GOLD||{}).chg_pct>0.005?'c-bull':'c-neutral', liveKey:'GOLD', getChange:d=>_fmtChg(d.GOLD) },
    SILVER:      { label:'SILVER',      cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    COPPER:      { label:'COPPER',      cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    NATGAS:      { label:'NAT GAS',     cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    ALUMINIUM:   { label:'ALUMINIUM',   cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    ZINC:        { label:'ZINC',        cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    LEAD:        { label:'LEAD',        cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    PALM_OIL:    { label:'PALM OIL',   cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    OPEC_PROD:   { label:'OPEC PROD',  cat:'Commodities',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- Currencies ---
    DXY_R:       { label:'DXY',         cat:'Currencies',      getValue:d=>formatVal(_rv('DXY',(d.DXY||{}).val)),                              getClass:d=>(d.DXY||{}).chg_pct>0.002?'c-bear':((d.DXY||{}).chg_pct<-0.002?'c-bull':'c-neutral'), liveKey:'DXY', getChange:d=>_fmtChg(d.DXY) },
    INRUSD_R:    { label:'INR/USD',     cat:'Currencies',      getValue:d=>'\u20b9'+formatVal(_rv('INRUSD',(d.INRUSD||{}).val)),               getClass:d=>(d.INRUSD||{}).chg_pct>0.0015?'c-bear':((d.INRUSD||{}).chg_pct<-0.0015?'c-bull':'c-neutral'), liveKey:'INRUSD', getChange:d=>_fmtChg(d.INRUSD) },
    EURUSD:      { label:'EUR/USD',     cat:'Currencies',      getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    USDJPY:      { label:'USD/JPY',     cat:'Currencies',      getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    GBPUSD:      { label:'GBP/USD',     cat:'Currencies',      getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- Crypto ---
    BTC_R:       { label:'BITCOIN',     cat:'Crypto',          getValue:d=>'$'+Math.round(_rv('BTC',(d.BTC||{}).val||60000)),                  getClass:d=>(d.BTC||{}).chg_pct>0.01?'c-bull':((d.BTC||{}).chg_pct<-0.01?'c-bear':'c-neutral'), liveKey:'BTC', getChange:d=>_fmtChg(d.BTC) },
    ETH:         { label:'ETHEREUM',    cat:'Crypto',          getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- India Flows ---
    FII_FLOW_R:  { label:'FII FLOW',    cat:'India Flows',     getValue:d=>d.FII||'--',                                                        getClass:d=>(d.FII||'').startsWith('B')?'c-bull':'c-bear', getChange:d=>null },
    DII_FLOW_R:  { label:'DII FLOW',    cat:'India Flows',     getValue:d=>d.DII||'--',                                                        getClass:d=>(d.DII||'').startsWith('B')?'c-bull':((d.DII||'').startsWith('S')?'c-bear':'c-neutral'), getChange:d=>null },
    // --- Global Macro ---
    CHINA_PMI:   { label:'CHINA PMI',   cat:'Global Macro',    getValue:d=>'50.4',                                                             getClass:d=>'c-neutral', getChange:d=>null },
    US_PMI:      { label:'US PMI',      cat:'Global Macro',    getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    US_CPI:      { label:'US CPI',      cat:'Global Macro',    getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    US_JOBS:     { label:'US JOBS',     cat:'Global Macro',    getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    BALTIC_DRY:  { label:'BALTIC DRY', cat:'Global Macro',    getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    // --- India Macro ---
    INDIA_PMI:   { label:'INDIA PMI',   cat:'India Macro',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    INDIA_CPI:   { label:'INDIA CPI',   cat:'India Macro',     getValue:d=>'--',                                                               getClass:d=>'c-neutral', getChange:d=>null },
    GST_COLL_R:  { label:'GST COLL',    cat:'India Macro',     getValue:d=>'\u20b91.7L Cr',                                                   getClass:d=>'c-bull', getChange:d=>null },
    ADV_TAX_R:   { label:'ADV TAX',     cat:'India Macro',     getValue:d=>'+18% YoY',                                                        getClass:d=>'c-bull', getChange:d=>null },
    MONSOON_R:   { label:'MONSOON',     cat:'India Macro',     getValue:d=>'NORMAL',                                                           getClass:d=>'c-bull', getChange:d=>null },
    // --- India Events ---
    EARNINGS_R:  { label:'EARNINGS',    cat:'India Events',    getValue:d=>'Q4 FY24',                                                          getClass:d=>'c-neutral', getChange:d=>null },
    POLICY_R:    { label:'POLICY',      cat:'India Events',    getValue:d=>(d.RBI_POLICY||{}).next||'--',                                      getClass:d=>'c-neutral', getChange:d=>null },
    GEOPOLIT_R:  { label:'GEOPOLIT.',   cat:'Global Events',   getValue:d=>'NEUTRAL',                                                          getClass:d=>'c-accent', getChange:d=>null },
};

const RADAR_MAX = 21;
const RADAR_DEFAULT_IDS = [
    'FED_RATE','DXY_R','BRENT_R','US10Y','CHINA_PMI','BTC_R','VIX_US_R',
    'FII_FLOW_R','GOLD_R','NASDAQ_R','GEOPOLIT_R','RBI_RATE','INRUSD_R','INDIA10Y',
    'GST_COLL_R','DII_FLOW_R','EARNINGS_R','POLICY_R','MONSOON_R','INDIA_VIX_R','ADV_TAX_R'
];

let activeRadarIds = [];
try {
    const _saved = localStorage.getItem('aurion_radar_ids');
    activeRadarIds = _saved ? JSON.parse(_saved) : [...RADAR_DEFAULT_IDS];
} catch(e) { activeRadarIds = [...RADAR_DEFAULT_IDS]; }

function _saveRadarIds() { localStorage.setItem('aurion_radar_ids', JSON.stringify(activeRadarIds)); }
function _updateRadarCount() {
    const n = activeRadarIds.length;
    const el = document.getElementById('radar-count'); if (el) el.textContent = n;
    const cm = document.getElementById('radar-count-modal'); if (cm) cm.textContent = n;
}

// Build the ticker strip DOM ONCE. Subsequent updates use updateTickerValues().
function renderTickerStrip() {
    const strip = document.getElementById('ticker-strip');
    let itemsHtml = '';
    TICKER_KEYS.forEach(k => {
        const it = simPrices[k]; if (!it) return;
        itemsHtml += `<div class="tk ${it.open ? 'is-open' : ''}" data-key="${k}" onclick="loadChartForTicker('${k}')">
            <span class="tk-l">${k}</span>
            <span class="tk-v" style="color: ${it.chg_pct >= 0 ? 'var(--bull)' : 'var(--bear)'}">${formatVal(it.display)}</span>
            <span class="tk-badge">${it.open ? 'LIVE' : 'CLOSED'}</span>
        </div>`;
    });

    // Two identical content blocks for seamless infinite scroll
    const trackHTML = `<div class="ticker-track">
        <div class="ticker-content">${itemsHtml}</div>
        <div class="ticker-content">${itemsHtml}</div>
    </div>`;
    strip.innerHTML = trackHTML;
    _tickerBuilt = true;
}

// Update ticker values in-place WITHOUT rebuilding DOM (prevents animation reset)
function updateTickerValues() {
    if (!_tickerBuilt) { renderTickerStrip(); return; }
    const allTks = document.querySelectorAll('#ticker-strip .tk');
    allTks.forEach(el => {
        const k = el.getAttribute('data-key');
        if (!k || !simPrices[k]) return;
        const it = simPrices[k];
        const valSpan = el.querySelector('.tk-v');
        if (valSpan) {
            valSpan.textContent = formatVal(it.display);
            valSpan.style.color = it.chg_pct >= 0 ? 'var(--bull)' : 'var(--bear)';
        }
    });
}

let _dragSrcId = null;
window._rdragged = false;
let _radarDragInited = false;

function createRadarTile(label, valStr, dataStateClass, isLiveObjKey = false, itemId = null, changeInfo = null) {
    const isLive = (isLiveObjKey && simPrices[isLiveObjKey] && simPrices[isLiveObjKey].open);
    const liveCls = isLive ? 'is-live' : '';
    const action = isLiveObjKey ? `onclick="if(!window._rdragged)loadChartForTicker('${isLiveObjKey}')"` : `onclick="if(!window._rdragged)openRadarIntel('${label}', '${valStr}')" style="cursor:pointer;" title="View Macro Intel"`;
    const keyAttr = isLiveObjKey ? ` data-rtkey="${isLiveObjKey}"` : '';
    const ridAttr = itemId ? ` data-rid="${itemId}"` : '';
    const dragAttr = itemId ? ' draggable="true"' : '';
    const delBtn = itemId ? `<button class="rt-del" onclick="event.stopPropagation();removeRadarItem('${itemId}')" title="Remove">&#x2715;</button>` : '';
    const dragHandle = itemId ? `<div class="rt-drag-handle" title="Drag to reorder">&#8942;&#8942;</div>` : '';
    const chgHtml = changeInfo ? `<div class="rt-c ${changeInfo.up ? 'chg-up' : 'chg-dn'}">${changeInfo.text}</div>` : '';
    return `<div class="rt ${dataStateClass} ${liveCls}" ${action}${keyAttr}${ridAttr}${dragAttr}>
        ${delBtn}${dragHandle}
        <div class="rt-l">${label}</div>
        <div class="rt-v">${valStr}</div>
        ${chgHtml}
    </div>`;
}

function _initRadarDrag(grid) {
    if (_radarDragInited) return;
    _radarDragInited = true;

    grid.addEventListener('dragstart', e => {
        const tile = e.target.closest('.rt[data-rid]');
        if (!tile) return;
        _dragSrcId = tile.getAttribute('data-rid');
        window._rdragged = false;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', _dragSrcId);
        setTimeout(() => tile.classList.add('rt-dragging'), 0);
    });
    grid.addEventListener('dragend', e => {
        grid.querySelectorAll('.rt-dragging, .rt-drag-over').forEach(el => {
            el.classList.remove('rt-dragging', 'rt-drag-over');
        });
        window._rdragged = false;
    });
    grid.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const tile = e.target.closest('.rt[data-rid]');
        if (tile && tile.getAttribute('data-rid') !== _dragSrcId) {
            grid.querySelectorAll('.rt-drag-over').forEach(el => el.classList.remove('rt-drag-over'));
            tile.classList.add('rt-drag-over');
        }
    });
    grid.addEventListener('dragleave', e => {
        if (!grid.contains(e.relatedTarget)) {
            grid.querySelectorAll('.rt-drag-over').forEach(el => el.classList.remove('rt-drag-over'));
        }
    });
    grid.addEventListener('drop', e => {
        e.preventDefault();
        window._rdragged = true;
        const tile = e.target.closest('.rt[data-rid]');
        if (!tile) return;
        const destId = tile.getAttribute('data-rid');
        if (!destId || destId === _dragSrcId) return;
        const srcIdx = activeRadarIds.indexOf(_dragSrcId);
        const dstIdx = activeRadarIds.indexOf(destId);
        if (srcIdx === -1 || dstIdx === -1) return;
        activeRadarIds.splice(srcIdx, 1);
        activeRadarIds.splice(dstIdx, 0, _dragSrcId);
        _saveRadarIds();
        renderRadar();
        // Reset _rdragged after a short delay so the click guard expires
        setTimeout(() => { window._rdragged = false; }, 150);
    });
}

// Update radar live-price tiles in-place at jitter frequency (no DOM rebuild)
function updateRadarValues() {
    document.querySelectorAll('#radar-grid .rt[data-rtkey]').forEach(el => {
        const k = el.getAttribute('data-rtkey');
        if (!simPrices[k]) return;
        const valEl = el.querySelector('.rt-v');
        if (!valEl) return;
        const v = simPrices[k].display;
        switch (k) {
            case 'BTC':    valEl.textContent = '$' + Math.round(v); break;
            case 'BRENT':  valEl.textContent = '$' + formatVal(v);  break;
            case 'GOLD':   valEl.textContent = '$' + formatVal(v);  break;
            case 'INRUSD': valEl.textContent = '\u20b9' + formatVal(v); break;
            case 'US10Y':  valEl.textContent = formatVal(v) + '%';  break;
            default:       valEl.textContent = formatVal(v);
        }
        // Update change text if present
        const chgEl = el.querySelector('.rt-c');
        if (chgEl && marketData[k]) {
            const info = _fmtChg(marketData[k]);
            if (info) {
                chgEl.textContent = info.text;
                chgEl.className = 'rt-c ' + (info.up ? 'chg-up' : 'chg-dn');
            }
        }
    });
}

// Helper: format change text for radar tiles — returns {text, up} or null
function _fmtChg(item) {
    if (!item || item.chg == null || item.chg_pct == null) return null;
    const pct = (item.chg_pct * 100);
    const abs = item.chg;
    if (pct === 0 && abs === 0) return null;
    const sign = pct >= 0 ? '+' : '';
    return { text: sign + pct.toFixed(2) + '% (' + sign + formatVal(abs) + ')', up: pct >= 0 };
}

// Helper: get simPrices display value with fallback to marketData raw
function _rv(key, fallback) {
    return (simPrices[key] && simPrices[key].display != null) ? simPrices[key].display : (fallback || 0);
}

function renderRadar() {
    const rg = document.getElementById('radar-grid');
    const d = marketData;
    const t = activeRadarIds.map(id => {
        const cfg = RADAR_CATALOG[id];
        if (!cfg) return '';
        const chgInfo = cfg.getChange ? cfg.getChange(d) : null;
        return createRadarTile(cfg.label, cfg.getValue(d), cfg.getClass(d), cfg.liveKey || false, id, chgInfo);
    });
    rg.innerHTML = t.join('');
    _updateRadarCount();
    _initRadarDrag(rg);
}

// --- TRACKED STOCKS ---
let trackedStocks = [];
try {
    const saved = localStorage.getItem('aurion_tracked_stocks');
    if (saved) trackedStocks = JSON.parse(saved);
} catch (e) { }

function renderTrackedStocks() {
    const container = document.getElementById('tracked-stocks-pills');
    const newsContainer = document.getElementById('tracked-news-pane');
    if (!container || !newsContainer) return;

    if (trackedStocks.length === 0) {
        container.innerHTML = '';
        newsContainer.innerHTML = `<div style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding:10px; text-align:center;"> Please use the plus icon to add stocks. </div>`;
        return;
    }

    container.innerHTML = trackedStocks.map((stock, idx) => `
        <div class="tracked-stock-pill" onclick="searchAndOpenTicker('${stock}')" title="Analyze ${stock}">
            ${stock}
            <div class="delete-stock-btn" onclick="event.stopPropagation(); removeTrackedStock(${idx})" title="Remove ${stock}">✕</div>
        </div>
    `).join('');

    let stockNews = newsDataCache.filter(n => {
        const text = (n.title + ' ' + n.desc).toUpperCase();
        return trackedStocks.some(t => {
            const s = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
            return text.includes(s) || text.includes(t.toUpperCase());
        });
    });

    if (stockNews.length === 0) {
        newsContainer.innerHTML = `<div style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding:10px; text-align:center;"> No recent intel found for tracked stocks in current cycle. </div>`;
    } else {
        newsContainer.innerHTML = stockNews.map(n => {
            const i = newsDataCache.indexOf(n);
            let badgeClass = n.sentiment.toLowerCase() === 'bullish' ? 'bull' : (n.sentiment.toLowerCase() === 'bearish' ? 'bear' : 'neutral');
            return `
                <div class="n-item" onclick="openNewsPage(${i})" style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.03);">
                    <div class="n-meta" style="margin-bottom:6px;">
                        <span class="n-src">${n.source}</span>
                        <span class="badge b-${badgeClass}" style="scale:0.8; transform-origin:right;">${n.sentiment.toUpperCase()}</span>
                    </div>
                    <div class="n-title" style="font-size:12px; margin-bottom:4px; line-height:1.4;">${n.title}</div>
                    <div class="n-time" style="font-family:'JetBrains Mono'; font-size:9px;">${formatExactTime(n.ts)}</div>
                </div>
            `;
        }).join('');
    }
}

function renderNews() {
    renderTrackedStocks();
    const limit = typeof getNewsLimit === 'function' ? getNewsLimit() : 999;
    const isFree = typeof isPro === 'function' && !isPro();
    let html = '';

    // Render clear articles (top 3 for free users)
    const clearArticles = isFree ? newsDataCache.slice(0, limit) : newsDataCache;
    clearArticles.forEach((n, i) => {
        let badgeClass = n.sentiment.toLowerCase();
        if (badgeClass === 'bullish') badgeClass = 'bull';
        if (badgeClass === 'bearish') badgeClass = 'bear';
        html += `
            <div class="n-item" onclick="openNewsPage(${i})">
                <div class="n-meta">
                    <span class="n-src">${n.source}</span>
                    <span class="badge b-${badgeClass}">${n.sentiment}</span>
                </div>
                <div class="n-title">${n.title}</div>
                <div class="n-time">${formatExactTime(n.ts)}</div>
            </div>
        `;
    });

    // For free users: show blurred preview + overlay
    if (isFree && newsDataCache.length > limit) {
        const blurredArticles = newsDataCache.slice(limit, limit + 5);
        let blurredHtml = '';
        blurredArticles.forEach(n => {
            let badgeClass = n.sentiment.toLowerCase();
            if (badgeClass === 'bullish') badgeClass = 'bull';
            if (badgeClass === 'bearish') badgeClass = 'bear';
            blurredHtml += `
                <div class="n-item">
                    <div class="n-meta">
                        <span class="n-src">${n.source}</span>
                        <span class="badge b-${badgeClass}">${n.sentiment}</span>
                    </div>
                    <div class="n-title">${n.title}</div>
                    <div class="n-time">${formatExactTime(n.ts)}</div>
                </div>
            `;
        });

        html += `
            <div class="news-blur-wrap">
                <div class="news-blur-content">${blurredHtml}</div>
                <div class="news-blur-overlay">
                    <div class="news-blur-overlay-inner" onclick="window.open('/pro','_blank')" style="cursor:pointer;">
                        <div style="font-size:22px; margin-bottom:8px;">🔒</div>
                        <div style="font-family:'JetBrains Mono'; font-size:12px; font-weight:700; color:var(--accent); letter-spacing:1px;">UNLOCK ${newsDataCache.length - limit}+ ARTICLES</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">Upgrade to Aurion Pro →</div>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('news-pane').innerHTML = html;
}

function renderSentiment() {
    let bull = 0, bear = 0, neut = 0;
    sentimentDataCache.forEach(n => {
        if (n.sentiment === 'bullish') bull++;
        else if (n.sentiment === 'bearish') bear++;
        else neut++;
    });
    const tot = Math.max(1, bull + bear + neut);
    document.getElementById('s-bar').innerHTML = `
        <div style="width:${(bull / tot) * 100}%; background:var(--bull)"></div>
        <div style="width:${(neut / tot) * 100}%; background:var(--neutral)"></div>
        <div style="width:${(bear / tot) * 100}%; background:var(--bear)"></div>
    `;
    document.getElementById('s-bull').textContent = Math.round((bull / tot) * 100) + '% BULL';
    document.getElementById('s-neut').textContent = Math.round((neut / tot) * 100) + '% NEUT';
    document.getElementById('s-bear').textContent = Math.round((bear / tot) * 100) + '% BEAR';

    const sentLimit = typeof getSentimentLimit === 'function' ? getSentimentLimit() : 999;
    const isSentFree = typeof isPro === 'function' && !isPro();
    const allItems = sentimentDataCache.slice(0, 20);

    // Clear items (first N for free, all for pro)
    const clearItems = isSentFree ? allItems.slice(0, sentLimit) : allItems;
    let listHtml = clearItems.map((n, i) => `
        <div class="ss-item" onclick="openSentimentPage(${i})">
            <div class="ss-dot" style="color: var(--${n.sentiment === 'bullish' ? 'bull' : (n.sentiment === 'bearish' ? 'bear' : 'neutral')})"></div>
            <div class="ss-content">
                <div class="ss-title">${n.title}</div>
                <div class="ss-meta">
                    <span>${n.source}</span>
                    <span>${formatExactTime(n.ts)}</span>
                </div>
            </div>
        </div>
    `).join('');

    // For free users: show blurred preview + overlay
    if (isSentFree && allItems.length > sentLimit) {
        const blurredItems = allItems.slice(sentLimit, sentLimit + 5);
        const blurredHtml = blurredItems.map(n => `
            <div class="ss-item">
                <div class="ss-dot" style="color: var(--${n.sentiment === 'bullish' ? 'bull' : (n.sentiment === 'bearish' ? 'bear' : 'neutral')})"></div>
                <div class="ss-content">
                    <div class="ss-title">${n.title}</div>
                    <div class="ss-meta">
                        <span>${n.source}</span>
                        <span>${formatExactTime(n.ts)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        listHtml += `
            <div class="sentiment-blur-wrap">
                <div class="sentiment-blur-content">${blurredHtml}</div>
                <div class="sentiment-blur-overlay">
                    <div class="sentiment-blur-overlay-inner" onclick="window.open('/pro','_blank')" style="cursor:pointer;">
                        <div style="font-size:22px; margin-bottom:8px;">🔒</div>
                        <div style="font-family:'JetBrains Mono'; font-size:12px; font-weight:700; color:var(--accent); letter-spacing:1px;">UNLOCK ${allItems.length - sentLimit}+ ANALYST CALLS</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">Upgrade to Aurion Pro →</div>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('s-list').innerHTML = listHtml;
}

function renderSectors(data) {
    let ht = '';
    Object.keys(data).forEach(k => {
        const r = data[k]; const isUp = r.chg_pct >= 0;
        const locked = typeof isSectorLocked === 'function' && isSectorLocked(k);
        let spk = '';
        if (r.sparkline && r.sparkline.length) {
            const min = Math.min(...r.sparkline), max = Math.max(...r.sparkline), range = max - min || 1;
            const map = r.sparkline.map((v, i) => `${(i / (r.sparkline.length - 1)) * 100},${24 - ((v - min) / range) * 24} `);
            spk = `<svg class="s-spark ${isUp ? 'up' : 'dn'}" viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M${map.join(' L')}" /></svg>`;
        }
        if (locked) {
            ht += `<div class="sec-row sec-locked" onclick="showUpgradeModal('sector_locked')">
                <div class="s-name" style="opacity:0.5">${k} <span class="pro-badge">PRO</span></div>
                <div class="s-val" style="opacity:0.35; filter:blur(3px)">${(r.chg_pct * 100).toFixed(2)}%</div>
                <div style="opacity:0.3; filter:blur(2px)">${spk}</div>
                <div style="text-align:right">
                    <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);">🔒</span>
                </div>
            </div>`;
        } else {
            ht += `<div class="sec-row" onclick="openSectorPage('${k}')">
                <div class="s-name">${k}</div>
                <div class="s-val ${isUp ? 'c-bull' : 'c-bear'}">${(r.chg_pct * 100).toFixed(2)}%</div>
                <div>${spk}</div>
                <div style="text-align:right">
                    ${r.vol_spike ? '<span class="badge b-bear" style="margin-right:6px">VOL</span>' : ''}
                    <span class="badge ${isUp ? 'b-bull' : 'b-bear'}">${r.momentum}</span>
                </div>
            </div>`;
        }
    });
    document.getElementById('sectors-pane').innerHTML = ht;
}

function generateAlerts() {
    const d = marketData; const a = [];
    if (d.VIX_US && d.VIX_US.val > 25) a.push({ l: 'CRITICAL', t: 'VIX SPIKE — India historically drops 1.5-2x on VIX > 25' });
    if (d.INRUSD && d.INRUSD.chg_pct > 0.003) a.push({ l: 'WARNING', t: 'INR WEAK — FII outflow pressure likely' });
    if (d.BRENT && d.BRENT.chg_pct > 0.02) a.push({ l: 'WARNING', t: 'CRUDE ALERT — Energy sector margin compression' });
    if (d.NIFTY && d.NIFTY.chg_pct < -0.015) a.push({ l: 'CRITICAL', t: 'SELL-OFF REVERSAL LIKELY — Check FII activity' });
    if (a.length === 0) a.push({ l: 'INFO', t: 'SYSTEM NOMINAL — All metrics aligned correctly.' });

    document.getElementById('alerts-pane').innerHTML = a.map(x => `
        <div class="alert-card a-${x.l}" style="border-left: 3px solid var(--${x.l === 'CRITICAL' ? 'bear' : (x.l === 'WARNING' ? 'accent' : 'cyan')}); position: relative;">
            ${x.l !== 'INFO' ? '<div style="position:absolute; top:12px; right:12px; width:6px; height:6px; background:var(--bear); border-radius:50%; animation:pulse 1s infinite alternate; box-shadow:0 0 8px var(--bear);"></div>' : ''}
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge b-${x.l === 'CRITICAL' ? 'bear' : (x.l === 'WARNING' ? 'accent' : 'cyan')}">${x.l}</span>
                <span style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding-right: 12px;">${formatExactTime(Date.now() / 1000)}</span>
            </div>
            <div class="alert-txt">${x.t}</div>
        </div>
    `).join('');
}

// =============================================
// RADAR CUSTOMIZATION — Add / Remove / Modal
// =============================================
function removeRadarItem(id) {
    activeRadarIds = activeRadarIds.filter(x => x !== id);
    _saveRadarIds();
    renderRadar();
}

function addRadarItem(id) {
    if (activeRadarIds.includes(id)) return;
    if (activeRadarIds.length >= RADAR_MAX) {
        showRadarToast('Maximum 21 items reached — remove one first.');
        return;
    }
    activeRadarIds.push(id);
    _saveRadarIds();
    renderRadar();
    // Mark chip as active
    document.querySelectorAll('#radar-catalog-grid .rcat-chip').forEach(el => {
        if (el.getAttribute('data-cid') === id) el.classList.add('active');
    });
    _updateRadarCount();
    if (activeRadarIds.length >= RADAR_MAX) {
        closeRadarAddModal();
        showRadarToast('Grid full (21/21). Remove an item to add more.');
    }
}

function openRadarAddModal() {
    if (activeRadarIds.length >= RADAR_MAX) {
        showRadarToast('Maximum 21 items reached — remove one first.');
        return;
    }
    const grid = document.getElementById('radar-catalog-grid');
    const cats = {};
    Object.entries(RADAR_CATALOG).forEach(([id, cfg]) => {
        if (!cats[cfg.cat]) cats[cfg.cat] = [];
        cats[cfg.cat].push({ id, label: cfg.label });
    });
    let html = '';
    Object.entries(cats).forEach(([cat, items]) => {
        html += `<div class="rcat-label">${cat}</div><div class="rcat-items">`;
        items.forEach(item => {
            const active = activeRadarIds.includes(item.id);
            html += `<div class="rcat-chip${active ? ' active' : ''}" data-cid="${item.id}" onclick="addRadarItem('${item.id}')">${item.label}</div>`;
        });
        html += `</div>`;
    });
    grid.innerHTML = html;
    const cm = document.getElementById('radar-count-modal');
    if (cm) cm.textContent = activeRadarIds.length;
    document.getElementById('radar-add-modal').style.display = 'flex';
}

function closeRadarAddModal() {
    document.getElementById('radar-add-modal').style.display = 'none';
}

function showRadarToast(msg) {
    const t = document.getElementById('radar-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
