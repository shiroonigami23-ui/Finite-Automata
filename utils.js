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
 * The single, canonical function for adding messages to the step log.
 * @param {string} message The HTML-enabled text to log.
 * @param {string} icon The name of the Lucide icon to use.
 */
export function addLogMessage(message, icon) {
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
        lucide.createIcons({
            nodes: [logEntry]
        });
    }
}

/**
 * A wrapper around fetch to automatically retry on transient errors with exponential backoff.
 * @param {string} url The URL to fetch.
 * @param {object} options The fetch options.
 * @param {number} retries Number of retries left.
 * @returns {Promise<Response>} The fetch response.
 */
export async function fetchWithRetry(url, options, retries = 3) {
    const maxRetries = 3;
    try {
        const response = await fetch(url, options);
        if (response.status === 503 && retries > 0) {
            // Wait with exponential backoff and jitter
            const delay = (Math.pow(2, maxRetries - retries) + Math.random()) * 1000;
            // Do not log retries to the console as errors, it's expected behavior
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            const delay = (Math.pow(2, maxRetries - retries) + Math.random()) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1);
        } else {
            throw error;
        }
    }
}