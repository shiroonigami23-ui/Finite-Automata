import { MACHINE, CURRENT_PRACTICE, pushUndo, setCurrentPractice } from './state.js';
import { animateMachineDrawing } from './animation.js';
import { setValidationMessage, addLog } from './utils.js';
import { areEquivalent } from './equivalence.js'; // <-- NEW IMPORT

export function generatePractice() {
    const practiceBox = document.getElementById('practiceBox');
    const modeSelect = document.getElementById('modeSelect');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    
    const mode = modeSelect ? modeSelect.value.split('_TO_')[0] : 'DFA';
    const level = document.getElementById('practiceMode').value;

    if (typeof window.PRACTICE_BANK === 'undefined') {
        practiceBox.textContent = "Practice bank not loaded.";
        return;
    }

    const bank = window.PRACTICE_BANK[mode]?.[level];

    if (!bank || bank.length === 0) {
        practiceBox.textContent = `No ${level} questions for ${mode} mode.`;
        if (checkAnswerBtn) checkAnswerBtn.hidden = true; // Hide button if no questions
        return;
    }
    const newPractice = bank[Math.floor(Math.random() * bank.length)];
    setCurrentPractice(newPractice);
    practiceBox.innerHTML = `<strong>${mode} | ${level}</strong><div style="margin-top:8px">${newPractice.q}</div>`;
    
    if (checkAnswerBtn) checkAnswerBtn.hidden = false; // Show button when practice is generated
}

export function showSolution(updateUIFunction) {
    if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
        setValidationMessage('No practice generated or solution unavailable.', 'error');
        return;
    }
    pushUndo(updateUIFunction);
    const solutionMachine = JSON.parse(JSON.stringify(CURRENT_PRACTICE.machine));
    solutionMachine.type = MACHINE.type;
    
    animateMachineDrawing(solutionMachine);
}

export function resetPractice() {
    setCurrentPractice(null);
    document.getElementById('practiceBox').textContent = 'No practice generated yet.';
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    if (checkAnswerBtn) checkAnswerBtn.hidden = true; // Hide button on reset
}

/**
 * Checks if the user's machine on the canvas is logically equivalent to the practice solution.
 */
export async function checkAnswer() {
    if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
        setValidationMessage('No practice problem is currently active.', 'error');
        return;
    }

    const logContainer = document.getElementById('stepLog');
    if (logContainer) logContainer.innerHTML = '';
    addLog('Checking your answer...', 'search');
    
    // The user's machine currently on the canvas
    const userMachine = MACHINE;
    // The solution machine for the current practice problem
    const solutionMachine = CURRENT_PRACTICE.machine;

    const isCorrect = await areEquivalent(userMachine, solutionMachine);

    if (isCorrect) {
        setValidationMessage('Correct Solution! Your automaton is logically equivalent to the solution.', 'success');
        addLog('Result: Correct!', 'check-circle');
    } else {
        setValidationMessage('Incorrect Solution. The behavior of your automaton does not match the solution.', 'error');
        addLog('Result: Incorrect. Try again.', 'x-circle');
    }
}
