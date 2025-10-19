import { MACHINE, UNDO_STACK, REDO_STACK, CURRENT_MODE, TRANS_FROM, SELECTED_STATE, CURRENT_PRACTICE, simSteps, simIndex, simTimer, initializeState } from './state.js';
import { initializeUI } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    initializeState();
    initializeUI();
});
