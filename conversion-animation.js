import { setMachine, pushUndo } from './state.js';
import { renderAll, layoutStatesCircular } from './renderer.js';
import { sleep, addLogMessage } from './utils.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa } from './automata.js';

const ANIMATION_DELAY = 1000;

// 1. Accept the update function here
async function animateConversion(conversionFn, initialMachine, successMessage, updateUIFn) {
    document.getElementById('stepLog').innerHTML = '';
    // 2. Pass it to pushUndo
    pushUndo(updateUIFn);

    const stepCallback = async (machineState, message) => {
        setMachine(machineState);
        renderAll();
        addLogMessage(message, 'git-branch');
        await sleep(ANIMATION_DELAY);
    };

    const finalMachine = await conversionFn(initialMachine, stepCallback);

    layoutStatesCircular(finalMachine.states);
    setMachine(finalMachine);
    renderAll();
    addLogMessage(successMessage, 'check-circle');
}

// 3. Update all exported functions to accept and pass the function
export async function animateEnfaToNfa(machine, updateUIFn) {
    await animateConversion(convertEnfaToNfa, machine, "ε-NFA to NFA conversion complete.", updateUIFn);
}

export async function animateNfaToDfa(machine, updateUIFn) {
    await animateConversion(convertNfaToDfa, machine, "NFA to DFA conversion complete.", updateUIFn);
}

export async function animateDfaToMinDfa(machine, updateUIFn) {
    await animateConversion(minimizeDfa, machine, "Minimization Complete. Final Minimized DFA created.", updateUIFn);
}

export async function animateNfaToMinDfa(machine, updateUIFn) {
    document.getElementById('stepLog').innerHTML = '';
    // 4. Also fix it here for the multi-step conversion
    pushUndo(updateUIFn);

    addLogMessage("Starting NFA to Minimal DFA conversion...", 'zap');
    await sleep(ANIMATION_DELAY);
    
    addLogMessage("Part 1: Converting NFA to DFA...", 'loader');
    const dfa = await convertNfaToDfa(machine, async (machineState, message) => {
        setMachine(machineState);
        renderAll();
        addLogMessage(message, 'git-branch');
        await sleep(ANIMATION_DELAY);
    });
    
    layoutStatesCircular(dfa.states);
    setMachine(dfa);
    renderAll();
    addLogMessage("NFA to DFA conversion complete. Now minimizing.", 'check');
    await sleep(ANIMATION_DELAY * 2);

    addLogMessage("Part 2: Minimizing the DFA...", 'loader');
    const minDfa = await minimizeDfa(dfa, async (machineState, message) => {
        setMachine(machineState);
        renderAll();
        addLogMessage(message, 'git-branch');
        await sleep(ANIMATION_DELAY);
    });

    layoutStatesCircular(minDfa.states);
    setMachine(minDfa);
    renderAll();
    addLogMessage("Full conversion to Minimal DFA is complete!", 'check-circle');
}
