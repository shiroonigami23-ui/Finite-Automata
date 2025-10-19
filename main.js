// The entry point for the application.
// It initializes the state and then the UI, which sets up all event listeners.
import { initializeState } from './state.js';
import { initializeUI } from './ui.js';

// Wait for the DOM to be fully loaded before running the app.
document.addEventListener("DOMContentLoaded", () => {
    // Set the initial state of the machine.
    initializeState();
    // Set up all the UI elements and event listeners.
    initializeUI();
});
