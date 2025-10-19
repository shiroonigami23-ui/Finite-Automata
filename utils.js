import { UNDO_STACK, REDO_STACK } from './state.js';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getModeLabel() {
    const val = document.getElementById('modeSelect').value;
    const labels = {
        'DFA': 'DFA', 'NFA': 'NFA', 'ENFA': 'ε-NFA',
        'ENFA_TO_NFA': 'ε-NFA → NFA (Conversion)',
        'NFA_TO_DFA': 'NFA → DFA (Conversion)',
        'NFA_TO_MIN_DFA': 'NFA → Minimal DFA (Conversion)',
        'DFA_TO_MIN_DFA': 'DFA → Minimal DFA (Conversion)'
    };
    return labels[val] || val;
}

export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
    if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}
