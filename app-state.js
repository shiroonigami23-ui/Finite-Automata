// ============================================================
// APP STATE - Centralized State Management
// All shared state and DOM references
// ============================================================

// ==================== GLOBAL STATE ====================
export let MACHINE = {
    type: 'DFA',
    states: [],
    transitions: [],
    alphabet: []
};

export let UNDO_STACK = [];
export let REDO_STACK = [];
export let CURRENT_MODE = 'addclick';
export let TRANS_FROM = null;
export let SELECTED_STATE = null;
export let CURRENT_PRACTICE = null;
export let simSteps = [];
export let simIndex = 0;
export let simTimer = null;

// State mutators (for imports that need to change state)
export function setMachine(newMachine) {
    MACHINE = newMachine;
}

export function setCurrentMode(mode) {
    CURRENT_MODE = mode;
}

export function setTransFrom(state) {
    TRANS_FROM = state;
}

export function setSelectedState(state) {
    SELECTED_STATE = state;
}

export function setCurrentPractice(practice) {
    CURRENT_PRACTICE = practice;
}

export function setSimSteps(steps) {
    simSteps = steps;
}

export function setSimIndex(index) {
    simIndex = index;
}

export function setSimTimer(timer) {
    simTimer = timer;
}

export function pushToUndoStack(state) {
    UNDO_STACK.push(state);
}

export function popFromUndoStack() {
    return UNDO_STACK.pop();
}

export function pushToRedoStack(state) {
    REDO_STACK.push(state);
}

export function popFromRedoStack() {
    return REDO_STACK.pop();
}

export function clearRedoStack() {
    REDO_STACK = [];
}

// ==================== DOM REFERENCES ====================
// Canvas elements
export const svg = document.getElementById('dfaSVG');
export const statesGroup = document.getElementById('states');
export const edgesGroup = document.getElementById('edges');

// Input/Output elements
export const testOutput = document.getElementById('testOutput');
export const testInput = document.getElementById('testInput');

// Practice elements
export const practiceBox = document.getElementById('practiceBox');
export const genPracticeBtn = document.getElementById('genPracticeBtn');
export const showSolBtn = document.getElementById('showSolBtn');
export const resetPractice = document.getElementById('resetPractice');
export const checkAnswerBtn = document.getElementById('checkAnswerBtn');

// Control buttons
export const runTestBtn = document.getElementById('runTestBtn');
export const validateBtn = document.getElementById('validateBtn');
export const exportBtn = document.getElementById('exportPngBtn');
export const modeSelect = document.getElementById('modeSelect');

// Undo/Redo buttons
export const undoBtn = document.getElementById('undoBtn');
export const redoBtn = document.getElementById('redoBtn');

// Zoom controls
export const zoomSlider = document.getElementById('zoomSlider');
export const zoomInBtn = document.getElementById('zoomInBtn');
export const zoomOutBtn = document.getElementById('zoomOutBtn');
export const zoomResetBtn = document.getElementById('zoomResetBtn');

// Additional controls
export const genRandBtn = document.getElementById('genRandBtn');
export const stepNextBtn = document.getElementById('stepNextBtn');
export const stepPrevBtn = document.getElementById('stepPrevBtn');
export const stepResetBtn = document.getElementById('stepResetBtn');

// Save/Load buttons
export const saveMachineBtn = document.getElementById('saveMachineBtn');
export const loadMachineBtn = document.getElementById('loadMachineBtn');
export const loadFileInput = document.getElementById('loadFileInput');

// Validation line
export const validationLine = document.getElementById('validationLine');

// ==================== CONSTANTS ====================
export const LOOP_RADIUS = 30;
export const STATE_RADIUS = 30;
export const ACCEPT_RING_OFFSET = 5;

// Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.MACHINE = MACHINE;
    window.UNDO_STACK = UNDO_STACK;
    window.REDO_STACK = REDO_STACK;
}
