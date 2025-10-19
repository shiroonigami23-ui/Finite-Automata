import { renderAll } from './renderer.js';
import { updateUndoRedoButtons } from './utils.js';

// --- Single Source of Truth for Application State ---

export let MACHINE = {};
export let UNDO_STACK = [];
export let REDO_STACK = [];
export let CURRENT_MODE = 'addclick';
export let TRANS_FROM = null;
export let SELECTED_STATE = null;
export let CURRENT_PRACTICE = null;

export const simState = {
    steps: [],
    index: 0,
    timer: null,
};

// --- State Mutation Functions ---
// These functions are the ONLY way other modules should modify the state.

export function setMachine(newMachine) {
    MACHINE = newMachine;
}

export function setCurrentMode(mode) {
    CURRENT_MODE = mode;
}

export function setTransFrom(stateId) {
    TRANS_FROM = stateId;
}

export function pushUndo() {
    UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
    REDO_STACK.length = 0; // Clear the redo stack when a new action is taken
    updateUndoRedoButtons();
}

export function doUndo() {
    if (UNDO_STACK.length > 0) {
        REDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        const prevState = UNDO_STACK.pop();
        setMachine(prevState);
        renderAll();
        updateUndoRedoButtons();
    }
}

export function doRedo() {
    if (REDO_STACK.length > 0) {
        UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        const nextState = REDO_STACK.pop();
        setMachine(nextState);
        renderAll();
        updateUndoRedoButtons();
    }
}

export function initializeState() {
    MACHINE = {
        type: 'DFA',
        states: [],
        transitions: [],
        alphabet: []
    };
    UNDO_STACK = [];
    REDO_STACK = [];
    CURRENT_MODE = 'addclick';
    TRANS_FROM = null;
    CURRENT_PRACTICE = null;

    simState.steps = [];
    simState.index = 0;
    clearTimeout(simState.timer);
    simState.timer = null;

    updateUndoRedoButtons();
}
