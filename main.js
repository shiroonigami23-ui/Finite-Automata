// main.js
import { initializeState, setRenderFunction } from './state.js';
import { initializeUI } from './ui.js';
import { renderAll } from './renderer.js';

// --- Main Application Startup ---
document.addEventListener("DOMContentLoaded", () => {
    // Break the circular dependency by passing the render function to the state module.
    setRenderFunction(renderAll);

    const splashScreen = document.getElementById('splashScreen');
    const mainApp = document.getElementById('mainApp');
    const faButton = document.querySelector('.splash-nav-btn[data-target="Automata"]');

    if (faButton && splashScreen && mainApp) {
        faButton.addEventListener('click', () => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainApp.style.display = 'block';

                initializeState();
                initializeUI();

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 800);
        });
    } else {
        // Fallback if splash screen is missing, for development
        if (mainApp) mainApp.style.display = 'block';
        initializeState();
        initializeUI();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
});
