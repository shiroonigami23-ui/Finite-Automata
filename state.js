export let MACHINE = {};
export let UNDO_STACK = [];
export let REDO_STACK = [];
export let CURRENT_MODE = 'addclick';
export let TRANS_FROM = null;
export let SELECTED_STATE = null;
export let CURRENT_PRACTICE = null;

// Group simulation state into an object for easier management across modules
export const simState = {
    steps: [],
    index: 0,
    timer: null,
};

// Function to allow other modules to update the machine state after undo/redo
export function setMachine(newMachine) {
    MACHINE = newMachine;
}

export function pushUndo() {
    UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
    REDO_STACK.length = 0; // Clear the redo stack
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

    // Reset simulation state
    simState.steps = [];
    simState.index = 0;
    simState.timer = null;
}
