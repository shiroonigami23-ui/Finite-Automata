// This file acts as a bridge between the legacy `library-loader.js` script
// and the new ES module system. It defines the global function that the loader expects.

import { pushUndo, setMachine } from './state.js';
import { renderAll } from './renderer.js';

/**
 * Loads a machine object from the library onto the canvas.
 * This function is attached to the `window` object to be accessible by older, non-module scripts.
 * @param {object} machineObject The machine data to load.
 */
window.loadMachineFromObject = function(machineObject) {
    if (machineObject && (machineObject.states || (machineObject.machine && machineObject.machine.states))) {
        pushUndo();
        
        // Handle both flat and nested machine structures in the JSON library
        const machineData = machineObject.machine || machineObject;

        // Ensure type is set, defaulting to DFA
        const machineToLoad = { ...machineData, type: machineObject.type || 'DFA' };
        setMachine(machineToLoad);

        // Update the UI dropdown to reflect the loaded machine's type
        const modeSelect = document.getElementById('modeSelect');
        if (modeSelect) {
            modeSelect.value = machineToLoad.type;
        }

        renderAll();
        console.log("Loaded machine from library:", machineObject.title || machineObject.id);
    } else {
        console.error("Invalid or incomplete machine object from library:", machineObject);
        alert("Could not load the selected library item: machine data is missing or invalid.");
    }
}
