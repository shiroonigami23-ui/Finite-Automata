import { initializeState, setRenderFunction } from './state.js';
import { initializeUI } from './ui.js';
import { renderAll } from './renderer.js';
import { initializeLibrary } from './library-loader.js';

// --- Main Application Startup ---
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById('splashScreen');
    const mainApp = document.getElementById('mainApp');
    const faButton = document.querySelector('.splash-nav-btn[data-target="Automata"]');

    setRenderFunction(renderAll);

    const startApp = () => {
        if (mainApp) mainApp.style.display = 'block';

        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            initializeState();
            initializeUI();
            initializeLibrary(); // Initialize library listeners
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
