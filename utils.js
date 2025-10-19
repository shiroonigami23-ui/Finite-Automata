import { UNDO_STACK, REDO_STACK } from './state.js';

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

export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
    if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}

export function setValidationMessage(message, type) {
    const validationLine = document.getElementById('validationLine');
    if (!validationLine) return;
    validationLine.textContent = message;
    validationLine.className = 'validation-box'; // Reset classes
    validationLine.classList.add(type, 'show');
    setTimeout(() => validationLine.classList.remove('show'), 4000);
}
