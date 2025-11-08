import { setMachine, pushUndo } from './moore_mealy_state.js';
import { renderAll, layoutStatesCircular } from './moore_mealy_renderer.js';
import { sleep, addLogMessage } from './utils.js';
import { convertMooreToMealy } from './moore_mealy_automata.js';

const ANIMATION_DELAY = 1500;

/**
 * Animates the conversion from Moore to Mealy, showing steps.
 * @param {object} machine The Moore machine to convert.
 * @param {function} updateUIFn UI update function (for undo/redo).
 */
export async function animateMooreToMealy(machine, updateUIFn) {
    document.getElementById('stepLog').innerHTML = '';
    pushUndo(updateUIFn);

    const stepCallback = async (machineState, message, isIntermediate = false) => {
        // Ensure only the final states of the process are permanently laid out
        if (isIntermediate) {
            layoutStatesCircular(machineState.states); 
        }
        setMachine(machineState);
        renderAll();
        addLogMessage(message, 'git-branch');
        await sleep(ANIMATION_DELAY);
    };

    addLogMessage("Starting Moore to Mealy conversion...", 'zap');
    await sleep(ANIMATION_DELAY);
    
    // Perform the conversion algorithmically, leveraging the stepCallback
    const finalMachine = await convertMooreToMealy(machine, stepCallback);

    // Final rendering and wrap-up
    layoutStatesCircular(finalMachine.states);
    setMachine(finalMachine);
    renderAll();
    addLogMessage("Conversion Complete. Equivalent Mealy Machine created!", 'check-circle');
}

