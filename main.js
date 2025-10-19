import { initializeState, pushUndo, setMachine } from './state.js';
import { initializeUI } from './ui.js';
import { renderAll } from './renderer.js';

// --- Main Application Startup ---
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById('splashScreen');
    const mainApp = document.getElementById('mainApp');
    const faButton = document.querySelector('.splash-nav-btn[data-target="Automata"]');

    if (faButton && splashScreen && mainApp) {
        faButton.addEventListener('click', () => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainApp.style.display = 'block';
                
                // Initialize the application AFTER the main view is visible
                initializeState();
                initializeUI();
                
                // Render Lucide icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 800); 
        });
    } else {
        // Fallback if splash screen is missing
        if (mainApp) mainApp.style.display = 'block';
        initializeState();
        initializeUI();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
});


// --- Bridge for Legacy Scripts ---
// Expose the loadMachineFromObject function on the window so the old library-loader.js can call it.
window.loadMachineFromObject = function(machineObject) {
    if (machineObject && machineObject.states) {
        pushUndo();
        // Ensure type is set, defaulting to DFA
        const machineToLoad = { ...machineObject, type: machineObject.type || 'DFA' };
        setMachine(machineToLoad);
        
        // Update the UI to reflect the loaded machine's type
        const modeSelect = document.getElementById('modeSelect');
        if (modeSelect) {
            modeSelect.value = machineToLoad.type;
        }
        
        renderAll();
        console.log("Loaded machine from library:", machineObject.id);
    } else {
        console.error("Invalid machine object from library:", machineObject);
    }
}
