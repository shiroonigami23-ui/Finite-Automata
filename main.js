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
        
        // CRITICAL FIX: Render icons BEFORE initializing the UI that adds listeners to them.
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        initializeState();
        initializeUI();
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
        // Fallback for development or if splash screen is removed
        startApp();
    }
});
