// This module is the single source of truth and has NO outgoing dependencies,
// which is crucial for preventing circular imports.

export let MACHINE = {};
export let UNDO_STACK = [];
export let REDO_STACK = [];
export let CURRENT_MODE = 'addclick';
export let TRANS_FROM = null;
export let CURRENT_PRACTICE = null;

export const simState = {
    steps: [],
    index: 0,
    timer: null,
};

let renderFunction = () => {};

export function setRenderFunction(fn) {
    renderFunction = fn;
}

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

export function pushUndo(updateUIFunction) {
    UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
    REDO_STACK.length = 0;
    updateUIFunction();
}

export function doUndo(updateUIFunction) {
    if (UNDO_STACK.length > 0) {
        REDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        setMachine(UNDO_STACK.pop());
        renderFunction();
        updateUIFunction();
    }
}

export function doRedo(updateUIFunction) {
    if (REDO_STACK.length > 0) {
        UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        setMachine(REDO_STACK.pop());
        renderFunction();
        updateUIFunction();
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
}
