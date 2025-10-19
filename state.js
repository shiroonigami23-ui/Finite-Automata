export let MACHINE = {};
export let UNDO_STACK = [];
export let REDO_STACK = [];
export let CURRENT_MODE = 'addclick';
export let TRANS_FROM = null;
export let SELECTED_STATE = null;
export let CURRENT_PRACTICE = null;
export let simSteps = [];
export let simIndex = 0;
export let simTimer = null;

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
}
