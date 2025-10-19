import { setMachine, pushUndo } from './state.js';
import { renderAll, layoutStatesCircular } from './renderer.js';
import { sleep, addLogMessage } from './utils.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa } from './automata.js';

const ANIMATION_DELAY = 1000;

async function animateConversion(conversionFn, initialMachine, successMessage) {
    document.getElementById('stepLog').innerHTML = '';
    pushUndo();

    const stepCallback = async (machineState, message) => {
        setMachine(machineState);
        renderAll();
        addLogMessage(message, 'git-branch');
        await sleep(ANIMATION_DELAY);
    };

    const finalMachine = await conversionFn(initialMachine, stepCallback);

    // --- FIX: Apply layout and set final state ---
    layoutStatesCircular(finalMachine.states);
    setMachine(finalMachine);
    renderAll();
    addLogMessage(successMessage, 'check-circle');
}

export async function animateEnfaToNfa(machine) {
    await animateConversion(convertEnfaToNfa, machine, "ε-NFA to NFA conversion complete.");
}

export async function animateNfaToDfa(machine) {
    await animateConversion(convertNfaToDfa, machine, "NFA to DFA conversion complete.");
}

export async function animateDfaToMinDfa(machine) {
    await animateConversion(minimizeDfa, machine, "Minimization Complete. Final Minimized DFA created.");
}

export async function animateNfaToMinDfa(machine) {
    document.getElementById('stepLog').innerHTML = '';
    pushUndo();

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
