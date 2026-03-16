// =============================================
// AURION TERMINAL — search.js
// CSV stock database, search autocomplete, dropdown
// =============================================

let ALL_STOCKS = [];
(async function loadStockDB() {
    try {
        const r = await fetch('/api/stocks');
        const data = await r.json();
        ALL_STOCKS = data.map(s => ({
            t: s.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, ''),
            ac: s.name.split(' ').map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g, ''),
            n: s.name,
            screener: s.screener,
            ltp: s.ltp, pe: s.pe, eps: s.eps, rsi: s.rsi,
            dma50: s.dma50, dma200: s.dma200,
            high52w: s.high52w, low52w: s.low52w,
            mcap: s.mcap, change_pct: s.change_pct,
            roe: s.roe, roce: s.roce
        }));
        console.log('Aurion: Loaded ' + ALL_STOCKS.length + ' stocks from CSV database');
    } catch (e) {
        console.error('Stock DB load failed:', e);
    }
})();

window.handleSearchInput = function (e) {
    const q = e.target.value.toUpperCase().trim();
    const dd = document.getElementById('search-dropdown');
    if (!q || q.length < 1) { dd.classList.remove('active'); return; }

    let matches = ALL_STOCKS.filter(x => x.t.includes(q) || x.n.toUpperCase().includes(q) || x.ac.includes(q));

    // --- PRO GATE: Limit search to NIFTY 50 for free tier ---
    const _isFreeSearch = typeof isPro === 'function' && !isPro();
    if (_isFreeSearch) {
        matches = matches.filter(x => typeof isStockAllowed === 'function' ? isStockAllowed(x.t) : true);
    }
    matches = matches.slice(0, 8);
    if (matches.length === 0) {
        if (_isFreeSearch && q.length >= 2) {
            dd.innerHTML = '<div class="sd-item" onclick="showUpgradeModal(\'stock_limit\')" style="text-align:center;cursor:pointer;"><span class="sd-title" style="color:var(--accent);">⚡ Search 5,000+ stocks with Pro</span></div>';
            dd.classList.add('active');
        } else {
            dd.classList.remove('active');
        }
        return;
    }

    dd.innerHTML = matches.map(m => {
        const safeN = (m.n || '').replace(/'/g, "\\'");
        const safeT = (m.t || '').replace(/'/g, "\\'");
        return '<div class="sd-item" onclick="document.getElementById(\'tk-search\').value = \'' + safeN + '\'; document.getElementById(\'search-dropdown\').classList.remove(\'active\'); window.searchAndOpenTicker(\'' + safeT + '\');">' +
            '<span class="sd-title">' + m.n + '</span>' +
            '<span class="sd-sym">' + (m.ltp ? '\u20b9' + m.ltp : m.t) + '</span>' +
            '</div>';
    }).join('');
    dd.classList.add('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        document.getElementById('search-dropdown').classList.remove('active');
    }
    if (!e.target.closest('#add-stock-input') && !e.target.closest('#add-stock-dropdown')) {
        document.getElementById('add-stock-dropdown').classList.remove('active');
    }
});

window.handleAddStockSearch = function (e) {
    const val = e.target.value;
    const parts = val.split(',');
    const currentPart = parts[parts.length - 1].trim().toUpperCase();
    const dd = document.getElementById('add-stock-dropdown');

    if (!currentPart || currentPart.length < 3) {
        dd.classList.remove('active');
        return;
    }

    const cleanT = currentPart.replace(/[^A-Z0-9]/g, '');
    const matches = ALL_STOCKS.filter(x => x.t.includes(currentPart) || x.n.toUpperCase().includes(currentPart) || x.ac.includes(currentPart) || x.n.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(cleanT)).slice(0, 5);

    if (matches.length === 0) {
        dd.classList.remove('active');
        return;
    }

    dd.innerHTML = matches.map(m => {
        const safeT = (m.t || '').replace(/'/g, "\\'");
        return '<div class="sd-item" onclick="appendStockToInput(\'' + safeT + '\');">' +
            '<span class="sd-title">' + m.n + '</span>' +
            '<span class="sd-sym">' + (m.ltp ? '\u20b9' + m.ltp : m.t) + '</span>' +
            '</div>';
    }).join('');
    dd.classList.add('active');
}

window.appendStockToInput = function (stockSymbol) {
    const input = document.getElementById('add-stock-input');
    let parts = input.value.split(',');
    parts.pop();
    parts.push(' ' + stockSymbol);
    input.value = parts.join(',').trim().replace(/^,/, '');

    if (!input.value.endsWith(', ')) {
        input.value += ', ';
    }

    document.getElementById('add-stock-dropdown').classList.remove('active');
    input.focus();
}
