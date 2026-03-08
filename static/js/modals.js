// =============================================
// AURION TERMINAL — modals.js
// Settings, Add Stock modals, tracked stock management
// =============================================

// --- SETTINGS ---
const _PROVIDER_PLACEHOLDERS = {
    gemini: 'AIzaSy...',
    anthropic: 'sk-ant-...',
    openai: 'sk-...',
    xai: 'xai-...',
    groq: 'gsk_...'
};

window.updateApiKeyPlaceholder = function () {
    const provider = document.getElementById('llm-provider-select').value;
    document.getElementById('gemini-key-input').placeholder = _PROVIDER_PLACEHOLDERS[provider] || 'API Key...';
}

window.openSettings = function () {
    const key = localStorage.getItem('aurion_llm_key') || '';
    const provider = localStorage.getItem('aurion_llm_provider') || 'gemini';
    document.getElementById('gemini-key-input').value = key;
    document.getElementById('llm-provider-select').value = provider;
    updateApiKeyPlaceholder();

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
    const provider = document.getElementById('llm-provider-select').value;
    if (k) localStorage.setItem('aurion_llm_key', k);
    localStorage.setItem('aurion_llm_provider', provider);
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
