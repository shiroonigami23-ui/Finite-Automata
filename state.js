// state.js
// --- Single Source of Truth for Application State ---

// We will import the renderAll function here to break the circular dependency.
// It will be initialized later.
let renderAll;

export function setRenderFunction(fn) {
    renderAll = fn;
}

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

export function setMachine(newMachine) {
    MACHINE = newMachine;
}

export function setCurrentMode(mode) {
    CURRENT_MODE = mode;
}

export function setTransFrom(stateId) {
    TRANS_FROM = stateId;
}

export function setCurrentPractice(practice) {
    CURRENT_PRACTICE = practice;
}

export function pushUndo() {
    UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
    REDO_STACK.length = 0;
    if (typeof updateUndoRedoButtons !== 'undefined') updateUndoRedoButtons();
}

export function doUndo() {
    if (UNDO_STACK.length > 0) {
        REDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        const prevState = UNDO_STACK.pop();
        setMachine(prevState);
        if (renderAll) renderAll();
        if (typeof updateUndoRedoButtons !== 'undefined') updateUndoRedoButtons();
    }
}

export function doRedo() {
    if (REDO_STACK.length > 0) {
        UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        const nextState = REDO_STACK.pop();
        setMachine(nextState);
        if (renderAll) renderAll();
        if (typeof updateUndoRedoButtons !== 'undefined') updateUndoRedoButtons();
    }
}

export function initializeState() {
    setMachine({
        type: 'DFA',
        states: [],
        transitions: [],
        alphabet: []
    });
    UNDO_STACK = [];
    REDO_STACK = [];
    setCurrentMode('addclick');
    setTransFrom(null);
    setCurrentPractice(null);

    simState.steps = [];
    simState.index = 0;
    if (simState.timer) clearTimeout(simState.timer);
    simState.timer = null;

    if (typeof updateUndoRedoButtons !== 'undefined') updateUndoRedoButtons();
}

// This function needs to be defined here for ui.js to access it,
// but it depends on state. We pass the state to it.
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
    if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}
