import { MACHINE, CURRENT_PRACTICE, pushUndo, setCurrentPractice } from './state.js';
import { animateMachineDrawing } from './animation.js';
import { setValidationMessage } from './utils.js';
import { validateAutomaton } from './automata.js';

export function generatePractice() {
    const practiceBox = document.getElementById('practiceBox');
    const modeSelect = document.getElementById('modeSelect');
    const mode = modeSelect.value.split('_TO_')[0]; // Handle conversion modes
    const level = document.getElementById('practiceMode').value;

    if (typeof window.PRACTICE_BANK === 'undefined') {
        practiceBox.textContent = "Practice bank not loaded.";
        return;
    }

    const bank = window.PRACTICE_BANK[mode]?.[level];

    if (!bank || bank.length === 0) {
        practiceBox.textContent = "No questions for this mode/level.";
        return;
    }
    const newPractice = bank[Math.floor(Math.random() * bank.length)];
    setCurrentPractice(newPractice);
    practiceBox.innerHTML = `<strong>${mode} | ${level}</strong><div style="margin-top:8px">${newPractice.q}</div>`;
}

export function showSolution() {
    if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
        setValidationMessage('No practice generated or solution unavailable.', 'error');
        return;
    }
    pushUndo();
    const solutionMachine = JSON.parse(JSON.stringify(CURRENT_PRACTICE.machine));
    solutionMachine.type = MACHINE.type;
    
    // Use the animation module to draw the machine.
    animateMachineDrawing(solutionMachine);
}

export function resetPractice() {
    setCurrentPractice(null);
    document.getElementById('practiceBox').textContent = 'No practice generated yet.';
}

export function checkAnswer() {
    if (!CURRENT_PRACTICE) {
        setValidationMessage('No practice generated yet.', 'error');
        return;
    }
    const result = validateAutomaton();
    setValidationMessage(result.message, result.type);
}
