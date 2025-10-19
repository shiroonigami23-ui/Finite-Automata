import { setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { sleep, addLog } from './utils.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa } from './automata.js';

const ANIMATION_DELAY = 1800; // Delay for conversion steps

// A helper to layout states in a grid to avoid overlapping during conversion
function layoutStatesGrid(states) {
    if (!states || states.length === 0) return;
    const svg = document.getElementById('dfaSVG');
    const bbox = svg.viewBox.baseVal;
    const canvasWidth = bbox.width;
    const padding = 100;
    const effectiveWidth = canvasWidth - (padding * 2);
    
    const numCols = Math.ceil(Math.sqrt(states.length));
    const numRows = Math.ceil(states.length / numCols);

    const colWidth = numCols > 1 ? effectiveWidth / (numCols - 1) : effectiveWidth;
    const rowHeight = numRows > 1 ? (bbox.height - (padding * 2)) / (numRows - 1) : (bbox.height / 2);

    states.forEach((s, i) => {
        const row = Math.floor(i / numCols);
        const col = i % numCols;
        s.x = padding + col * colWidth;
        s.y = padding + row * rowHeight;
    });
}


/**
 * Orchestrates the animated conversion from NFA to DFA.
 * @param {object} nfaMachine The NFA to convert.
 */
export async function animateNfaToDfa(nfaMachine) {
    const logContainer = document.getElementById('stepLog');
    logContainer.innerHTML = '';
    addLog('Starting NFA to DFA Conversion...', 'zap');

    // Define the step callback function that the algorithm will invoke
    const stepCallback = async (intermediateMachine, message) => {
        addLog(message, 'settings-2');
        layoutStatesGrid(intermediateMachine.states); // Re-layout on each step
        setMachine(intermediateMachine);
        renderAll();
        await sleep(ANIMATION_DELAY);
    };

    const finalDfa = await convertNfaToDfa(nfaMachine, stepCallback);
    
    addLog('Conversion Complete. Final DFA created.', 'check-circle');
    layoutStatesGrid(finalDfa.states);
    setMachine(finalDfa);
    renderAll();
}

/**
 * Orchestrates the animated minimization of a DFA.
 * @param {object} dfaMachine The DFA to minimize.
 */
export async function animateMinimizeDfa(dfaMachine) {
    const logContainer = document.getElementById('stepLog');
    logContainer.innerHTML = '';
    addLog('Starting DFA Minimization...', 'zap');

    const stepCallback = async (intermediateMachine, message) => {
        addLog(message, 'gantt-chart');
        
        // Use a temporary machine for visualization but keep positions
        const tempMachine = JSON.parse(JSON.stringify(intermediateMachine));
        tempMachine.states.forEach(s => {
            const originalState = dfaMachine.states.find(os => os.id === s.id);
            if (originalState) {
                s.x = originalState.x;
                s.y = originalState.y;
            }
        });

        setMachine(tempMachine);
        renderAll();
        await sleep(ANIMATION_DELAY);
    };

    const finalDfa = await minimizeDfa(dfaMachine, stepCallback);
    
    addLog('Minimization Complete. Final Minimized DFA created.', 'check-circle');
    // Keep original positions for the final states
     finalDfa.states.forEach(s => {
        const originalState = dfaMachine.states.find(os => os.id === s.id);
        if (originalState) {
            s.x = originalState.x;
            s.y = originalState.y;
        } else {
           // Fallback for new representative states if needed
           layoutStatesGrid(finalDfa.states);
        }
    });
    setMachine(finalDfa);
    renderAll();
}

/**
 * Orchestrates the animated conversion from ε-NFA to NFA.
 * @param {object} enfaMachine The ε-NFA to convert.
 */
export async function animateEnfaToNfa(enfaMachine) {
    const logContainer = document.getElementById('stepLog');
    logContainer.innerHTML = '';
    addLog('Starting ε-NFA to NFA Conversion...', 'zap');

    const stepCallback = async (intermediateMachine, message) => {
        addLog(message, 'move-right');
        
        // Keep original positions
        const tempMachine = JSON.parse(JSON.stringify(intermediateMachine));
         tempMachine.states.forEach(s => {
            const originalState = enfaMachine.states.find(os => os.id === s.id);
            if (originalState) {
                s.x = originalState.x;
                s.y = originalState.y;
            }
        });
        
        setMachine(tempMachine);
        renderAll();
        await sleep(ANIMATION_DELAY);
    };

    const finalNfa = await convertEnfaToNfa(enfaMachine, stepCallback);
    
    addLog('Conversion Complete. Epsilon transitions removed.', 'check-circle');
    setMachine(finalNfa);
    renderAll();
}
