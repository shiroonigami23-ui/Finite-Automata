// --- Single Source of Truth for Application State ---
// This module now has ZERO outgoing dependencies, which is critical.

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

// This will hold the renderAll function from renderer.js, passed in from main.js.
let renderFunction = () => { console.error("Render function not set!"); };

/**
 * Injects the main render function into the state module to avoid circular dependencies.
 * @param {function} fn The renderAll function.
 */
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
    updateUIFunction(); // This function (e.g., updateUndoRedoButtons) is passed in from the UI module.
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

export function initializeState(updateUIFunction) {
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

    if (updateUIFunction) updateUIFunction();
}
