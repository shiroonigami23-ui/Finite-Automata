// This module is now self-contained and has NO dependencies on other modules.

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getModeLabel() {
    const select = document.getElementById('modeSelect');
    if (!select) return 'N/A';
    const val = select.value;
    const option = select.querySelector(`option[value="${val}"]`);
    return option ? option.textContent : val;
}

export function setValidationMessage(message, type) {
    const validationLine = document.getElementById('validationLine');
    if (!validationLine) return;
    validationLine.textContent = message;
    validationLine.className = 'validation-box';
    validationLine.classList.add(type, 'show');
    setTimeout(() => validationLine.classList.remove('show'), 5000);
}

/**
 * Adds a descriptive message to the step log.
 * @param {string} message The HTML message to log.
 * @param {string} icon The name of the Lucide icon to use.
 */
export function addLog(message, icon) {
    const log = document.getElementById('stepLog');
    if (!log) return;

    const logEntry = document.createElement('div');
    
    logEntry.innerHTML = `<i data-lucide="${icon}"></i> <div>${message}</div>`;
    
    if (log.firstChild) {
        log.insertBefore(logEntry, log.firstChild);
    } else {
        log.appendChild(logEntry);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ nodes: [logEntry] });
    }
}
