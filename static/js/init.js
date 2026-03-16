// =============================================
// AURION TERMINAL — init.js
// Bootstrap: Initial data polls + refresh intervals
// =============================================

// --- Tier-aware refresh intervals ---
const _marketRefreshMs = typeof getRefreshInterval === 'function' ? getRefreshInterval() : 18000;

// Fire ALL polls in parallel so no section waits for another
Promise.all([pollMarket(), pollNews(), pollSectors(), pollSentiment()])
    .catch(() => {});

setInterval(pollMarket, _marketRefreshMs);
setInterval(pollNews, 60000);
setInterval(pollSectors, 30000);
setInterval(pollSentiment, 60000);

// --- Disable live-blink animation for free tier ---
if (typeof isPro === 'function' && !isPro()) {
    const _styleFreeTier = document.createElement('style');
    _styleFreeTier.textContent = `
        .rt.is-live { animation: none !important; }
        .rt.is-live .rt-v { animation: none !important; }
        .tk.is-open .tk-v { animation: none !important; }
    `;
    document.head.appendChild(_styleFreeTier);
}

// --- SCROLL TO TOP BUTTONS ---
function initScrollTopBtn(scrollElId, btnId) {
    const el = document.getElementById(scrollElId);
    const btn = document.getElementById(btnId);
    if (!el || !btn) return;
    // Show after ~7 news items (~7 * ~42px = ~300px)
    el.addEventListener('scroll', () => {
        el.scrollTop > 300 ? btn.classList.add('visible') : btn.classList.remove('visible');
    });
}

initScrollTopBtn('news-pane', 'news-scroll-top');
initScrollTopBtn('sentiment-body', 'sentiment-scroll-top');
