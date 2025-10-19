import { initializeState } from './state.js';
import { initializeUI } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    // Get references to the splash screen and the main application container.
    const splashScreen = document.getElementById('splashScreen');
    const mainApp = document.getElementById('mainApp');
    const faButton = document.querySelector('.splash-nav-btn[data-target="Automata"]');

    // Check if all required elements are present.
    if (faButton && splashScreen && mainApp) {
        // Add a click event listener to the "Finite Automata" button.
        faButton.addEventListener('click', () => {
            // Start the fade-out animation for the splash screen.
            splashScreen.style.opacity = '0';

            // Use a timeout that matches the CSS transition duration.
            setTimeout(() => {
                // After fading out, hide the splash screen completely.
                splashScreen.style.display = 'none';
                // Show the main application.
                mainApp.style.display = 'block';

                // NOW, initialize the core application state and UI.
                initializeState();
                initializeUI();
                
                // Initialize Lucide icons now that the main app is visible.
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

            }, 800); // 800ms matches the 'opacity 0.8s ease' in your inline style.
        });
    } else {
        // Fallback: If the splash screen isn't found, just show the main app directly.
        console.warn("Splash screen elements not found. Loading main app directly.");
        if(mainApp) mainApp.style.display = 'block';
        initializeState();
        initializeUI();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
});
