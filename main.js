import { initializeState, setRenderFunction } from './state.js';
import { initializeUI } from './ui.js';
import { renderAll } from './renderer.js';

// --- Main Application Startup ---
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById('splashScreen');
    const mainApp = document.getElementById('mainApp');
    const faButton = document.querySelector('.splash-nav-btn[data-target="Automata"]');

    setRenderFunction(renderAll);

    const startApp = () => {
        if (mainApp) mainApp.style.display = 'block';

        // DEFINITIVE FIX for race condition:
        // Use a timeout to push the execution to the end of the browser's event queue.
        // This guarantees that all external libraries (like Lucide) have finished
        // manipulating the DOM before our scripts try to interact with those elements.
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            initializeState();
            initializeUI();
        }, 0); 
    };

    if (faButton && splashScreen && mainApp) {
        faButton.addEventListener('click', () => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                startApp();
            }, 800); 
        });
    } else {
        startApp();
    }
});
