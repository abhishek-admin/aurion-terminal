// =============================================
// AURION TERMINAL — utils.js
// Utility functions, clock, theme toggle
// =============================================

function formatVal(v) { return v !== undefined ? v.toFixed(2) : '0.00'; }

// Exact IST Time string: "14:35 IST"
function formatExactTime(tsUtcSec) {
    const d = new Date(tsUtcSec * 1000);
    const istMs = d.getTime() + (330 * 60000);
    const ist = new Date(istMs);
    const h = String(ist.getUTCHours()).padStart(2, '0');
    const m = String(ist.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m} IST`;
}

function formatExactDate(tsUtcSec) {
    const d = new Date(tsUtcSec * 1000);
    const istMs = d.getTime() + (330 * 60000);
    const ist = new Date(istMs);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const h = String(ist.getUTCHours()).padStart(2, '0');
    const m = String(ist.getUTCMinutes()).padStart(2, '0');
    return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]}, ${h}:${m} IST`;
}

// --- CLOCK ---
setInterval(() => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    document.getElementById('clock').textContent = istTime.toTimeString().split(' ')[0] + ' IST';
}, 1000);

// --- NSE MARKET COUNTDOWN ---
// Official NSE holiday list (update annually from https://www.nseindia.com/products-services/equity-market-holidays)
const NSE_HOLIDAYS = new Set([
    // 2025
    '2025-02-26','2025-03-14','2025-03-31','2025-04-10','2025-04-14',
    '2025-04-18','2025-05-01','2025-08-15','2025-08-27','2025-10-02',
    '2025-10-20','2025-10-21','2025-11-05','2025-12-25',
    // 2026
    '2026-01-26','2026-03-03','2026-03-20','2026-04-03','2026-04-14',
    '2026-05-01','2026-08-15','2026-10-02','2026-11-24','2026-12-25',
    // 2027
    '2027-01-26','2027-02-23','2027-04-02','2027-04-14',
    '2027-05-03','2027-08-15','2027-10-02','2027-12-25',
]);

function _istOf(utcMs) {
    // Returns a Date-like object whose UTC methods reflect IST values
    return new Date(utcMs + 330 * 60000);
}
function _istDateKey(utcMs) {
    const d = _istOf(utcMs);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}
function _isNSETradingDay(utcMs) {
    const ist = _istOf(utcMs);
    const dow = ist.getUTCDay(); // 0=Sun, 6=Sat
    return dow >= 1 && dow <= 5 && !NSE_HOLIDAYS.has(_istDateKey(utcMs));
}
function _isNSEOpen(utcMs) {
    if (!_isNSETradingDay(utcMs)) return false;
    const ist = _istOf(utcMs);
    const hhmm = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    return hhmm >= 555 && hhmm < 930;  // 9:15 to 15:30 IST
}
function _nextNSEOpenUtc(utcMs) {
    // Build candidate = today's 9:15 IST in UTC (9:15 IST = 03:45 UTC)
    const ist = _istOf(utcMs);
    let cand = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 3, 45, 0);
    const hhmm = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    if (hhmm >= 555) cand += 86400000; // already past 9:15, go to tomorrow
    for (let i = 0; i < 10; i++) {
        if (_isNSETradingDay(cand)) break;
        cand += 86400000;
    }
    return cand;
}
function _fmtCountdown(ms) {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h >= 24) {
        const d = Math.floor(h / 24), rh = h % 24;
        return `${d}d ${String(rh).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
    }
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

setInterval(() => {
    const el = document.getElementById('nse-countdown');
    if (!el) return;
    const now = Date.now();
    if (_isNSEOpen(now)) {
        el.innerHTML = '<span class="nse-open-dot"></span>NSE OPEN';
        el.className = 'nse-open';
    } else {
        const diff = _nextNSEOpenUtc(now) - now;
        el.textContent = 'NSE opens in ' + _fmtCountdown(diff);
        el.className = 'nse-closed';
    }
}, 1000);

function toggleTheme() {
    document.documentElement.classList.toggle('theme-light');
    const isLight = document.documentElement.classList.contains('theme-light');
    document.getElementById('theme-btn').textContent = isLight ? '☾' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
if (localStorage.getItem('theme') === 'light') toggleTheme();
