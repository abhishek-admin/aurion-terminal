// =============================================
// AURION TERMINAL — modals.js
// Settings, Add Stock modals, tracked stock management
// =============================================

// --- SETTINGS ---
window.openSettings = function () {
    const key = localStorage.getItem('aurion_llm_key') || '';
    document.getElementById('gemini-key-input').value = key;

    // Show/hide the danger zone based on whether a key exists
    const dangerZone = document.getElementById('settings-danger-zone');
    if (dangerZone) {
        dangerZone.style.display = key ? 'block' : 'none';
    }

    document.getElementById('settings-overlay').style.display = 'flex';
}

window.closeSettings = function () {
    document.getElementById('settings-overlay').style.display = 'none';
}

window.saveSettings = function () {
    const k = document.getElementById('gemini-key-input').value.trim();
    if (k) localStorage.setItem('aurion_llm_key', k);
    closeSettings();
}

window.clearApiKey = function () {
    if (!confirm('Are you sure you want to delete your API key? AI reports will stop working.')) return;
    localStorage.removeItem('aurion_llm_key');
    document.getElementById('gemini-key-input').value = '';
    closeSettings();
}

// --- ADD STOCK MODAL ---
window.openAddStockModal = function () {
    document.getElementById('add-stock-input').value = trackedStocks.join(', ');
    document.getElementById('add-stock-overlay').style.display = 'flex';
}

window.closeAddStockModal = function () {
    document.getElementById('add-stock-overlay').style.display = 'none';
}

window.saveTrackedStocks = function () {
    const raw = document.getElementById('add-stock-input').value;
    trackedStocks = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    localStorage.setItem('aurion_tracked_stocks', JSON.stringify(trackedStocks));
    closeAddStockModal();
    renderTrackedStocks();
}

window.removeTrackedStock = function (index) {
    trackedStocks.splice(index, 1);
    localStorage.setItem('aurion_tracked_stocks', JSON.stringify(trackedStocks));
    renderTrackedStocks();
}
