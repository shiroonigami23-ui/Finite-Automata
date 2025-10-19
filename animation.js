import { setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { sleep, addLogMessage } from './utils.js';

const ANIMATION_DELAY = 1500; // Changed from 1000 to 1500 for a slower animation

/**
 * Animates the drawing of a finite automaton, logging each step.
 * @param {object} machineToDraw The machine object to animate.
 */
export async function animateMachineDrawing(machineToDraw) {
    const originalType = machineToDraw.type || 'DFA';
    const log = document.getElementById('stepLog');
    if(log) log.innerHTML = ''; 
    
    addLogMessage('Starting machine construction...', 'zap');
    
    let tempMachine = { type: originalType, states: [], transitions: [], alphabet: machineToDraw.alphabet || [] };
    setMachine({...tempMachine});
    renderAll();
    await sleep(500);

    for (const state of machineToDraw.states) {
        let message = `Adding state <strong>${state.id}</strong>`;
        if (state.initial) message += " (Initial)";
        if (state.accepting) message += " (Final)";
        addLogMessage(message, 'plus-circle');

        tempMachine.states.push(state);
        setMachine({...tempMachine});
        renderAll();
        
        const stateG = document.querySelector(`g[data-id="${state.id}"] circle`);
        if (stateG) stateG.classList.add('state-drawing');
        
        await sleep(ANIMATION_DELAY);
    }
    
    for (const transition of machineToDraw.transitions) {
        const { from, to, symbol } = transition;
        addLogMessage(`Drawing transition from <strong>${from}</strong> to <strong>${to}</strong> on symbol '<strong>${symbol || 'ε'}</strong>'`, 'git-branch');
        
        tempMachine.transitions.push(transition);
        setMachine({...tempMachine});
        renderAll();
        
        const path = document.querySelector(`#edges .transition-path[data-from="${from}"][data-to="${to}"]`);
        if (path) {
            path.classList.add('transition-drawing');
        }
        
        await sleep(ANIMATION_DELAY);
    }
    
    await sleep(500);

    setMachine(machineToDraw);
    renderAll(); 
    addLogMessage('Construction complete!', 'check-circle');
}
