import { setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { sleep } from './utils.js';

// Defines the delay between each step of the drawing animation.
const ANIMATION_DELAY = 1500; // Adjusted for a smoother flow.

/**
 * Adds a descriptive message to the top of the step log.
 * @param {string} message The text to log.
 * @param {string} icon The name of the Lucide icon to use (e.g., 'plus-circle', 'git-branch').
 */
function addConstructionLog(message, icon) {
    const log = document.getElementById('stepLog');
    if (!log) return;

    const logEntry = document.createElement('div');
    logEntry.className = 'new-log'; // Add class for animation
    
    // Use innerHTML to create the icon and the message.
    logEntry.innerHTML = `<i data-lucide="${icon}"></i> <div>${message}</div>`;
    
    // Prepend the new log to the top of the list.
    if (log.firstChild) {
        log.insertBefore(logEntry, log.firstChild);
    } else {
        log.appendChild(logEntry);
    }

    // Re-render the icons to make the new one appear.
    if (typeof lucide !== 'undefined') {
        lucide.createIcons({
            nodes: [logEntry]
        });
    }
}


/**
 * Animates the drawing of a finite automaton, logging each step.
 * @param {object} machineToDraw The machine object to animate.
 */
export async function animateMachineDrawing(machineToDraw) {
    const originalType = machineToDraw.type || 'DFA';
    const log = document.getElementById('stepLog');
    if(log) log.innerHTML = ''; // Clear the log before starting.
    
    addConstructionLog('Starting machine construction...', 'zap');
    
    // Start with a blank canvas.
    let tempMachine = { type: originalType, states: [], transitions: [], alphabet: machineToDraw.alphabet || [] };
    setMachine({...tempMachine});
    renderAll();
    await sleep(1000); // Brief pause before starting.

    // Draw each state sequentially, with logging.
    for (const state of machineToDraw.states) {
        let message = `Adding state <strong>${state.id}</strong>`;
        if (state.initial) message += " (Initial)";
        if (state.accepting) message += " (Final)";
        addConstructionLog(message, 'plus-circle');

        tempMachine.states.push(state);
        setMachine({...tempMachine});
        renderAll();
        
        const stateG = document.querySelector(`g[data-id="${state.id}"] circle`);
        if (stateG) stateG.classList.add('state-drawing');
        
        await sleep(ANIMATION_DELAY);
    }
    
    // --- FIX: Animate each transition sequentially instead of all at once ---
    for (const transition of machineToDraw.transitions) {
        const { from, to, symbol } = transition;
        addConstructionLog(`Drawing transition from <strong>${from}</strong> to <strong>${to}</strong> on symbol '<strong>${symbol || 'ε'}</strong>'`, 'git-branch');
        
        // Add one transition at a time to the temporary machine
        tempMachine.transitions.push(transition);
        setMachine({...tempMachine});
        
        // Re-render the SVG to include the new transition
        renderAll();
        
        // Find the newly drawn path and apply the animation class
        const path = document.querySelector(`#edges .transition-path[data-from="${from}"][data-to="${to}"]`);
        if (path) {
            path.classList.add('transition-drawing');
        }
        
        await sleep(ANIMATION_DELAY);
    }
    
    await sleep(1000);

    // Finalize the machine state and render.
    setMachine(machineToDraw);
    renderAll(); 
    addConstructionLog('Construction complete!', 'check-circle');
}
