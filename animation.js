import { setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { sleep } from './utils.js';

// Defines the delay between each step of the drawing animation.
const ANIMATION_DELAY = 2000; // Increased to 2000ms as requested.

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
    let tempMachine = { type: originalType, states: [], transitions: [], alphabet: [] };
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
    
    // Add all transitions for the renderer to process curves correctly.
    tempMachine.transitions = machineToDraw.transitions;
    setMachine({...tempMachine});
    renderAll();
    
    // Animate each transition path sequentially, with logging.
    const paths = document.querySelectorAll('#edges .transition-path');
    for (const path of paths) {
        const from = path.getAttribute('data-from');
        const to = path.getAttribute('data-to');
         addConstructionLog(`Drawing transition from <strong>${from}</strong> to <strong>${to}</strong>...`, 'git-branch');
        path.classList.add('transition-drawing');
        await sleep(ANIMATION_DELAY);
    }
    
    await sleep(ANIMATION_DELAY);

    // Finalize the machine state and render.
    setMachine(machineToDraw);
    renderAll(); 
    addConstructionLog('Construction complete!', 'check-circle');
}
