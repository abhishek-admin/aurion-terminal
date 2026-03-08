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

function toggleTheme() {
    document.documentElement.classList.toggle('theme-light');
    const isLight = document.documentElement.classList.contains('theme-light');
    document.getElementById('theme-btn').textContent = isLight ? '☾' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
if (localStorage.getItem('theme') === 'light') toggleTheme();
