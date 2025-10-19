import { setMachine } from './state.js';
import { renderAll } from './renderer.js';
import { sleep } from './utils.js';

// Defines the delay between each step of the drawing animation.
const ANIMATION_DELAY = 2000; // 2000ms

/**
 * Animates the drawing of a finite automaton, state by state and transition by transition.
 * @param {object} machineToDraw The machine object to animate.
 */
export async function animateMachineDrawing(machineToDraw) {
    const originalType = machineToDraw.type || 'DFA';
    
    // 1. Start with a blank canvas to draw on.
    let tempMachine = { type: originalType, states: [], transitions: [], alphabet: [] };
    setMachine({...tempMachine});
    renderAll();
    await sleep(300);

    // 2. Draw each state sequentially.
    for (const state of machineToDraw.states) {
        tempMachine.states.push(state);
        setMachine({...tempMachine}); // Update the global state
        renderAll();
        
        // Trigger the CSS animation for the newly added state.
        const stateG = document.querySelector(`g[data-id="${state.id}"] circle`);
        if (stateG) stateG.classList.add('state-drawing');
        
        await sleep(ANIMATION_DELAY);
    }
    
    // 3. Add all transitions to the state at once so the renderer can detect reverse paths.
    tempMachine.transitions = machineToDraw.transitions;
    setMachine({...tempMachine});
    renderAll();
    
    // 4. Animate each transition path sequentially.
    const paths = document.querySelectorAll('#edges .transition-path');
    for (const path of paths) {
        path.classList.add('transition-drawing');
        await sleep(ANIMATION_DELAY / 2); // Use a slightly faster delay for transitions.
    }
    
    await sleep(ANIMATION_DELAY); // Final pause to admire the work.

    // 5. Set the final, complete machine object and render one last time to clean up animations.
    setMachine(machineToDraw);
    renderAll(); 
}
