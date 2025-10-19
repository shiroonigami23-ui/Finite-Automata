import { MACHINE, CURRENT_PRACTICE, pushUndo, setCurrentPractice } from './state.js';
import { animateMachineDrawing } from './animation.js';
import { setValidationMessage, addLogMessage } from './utils.js';
import { areEquivalent } from './equivalence.js';

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

    // --- BUG FIX STARTS HERE ---
    // Get the correct type from the current practice mode, not the global state.
    const modeSelect = document.getElementById('modeSelect');
    const correctType = modeSelect ? modeSelect.value.split('_TO_')[0] : 'DFA';

    // Create a new machine object that correctly combines the machine data with its true type.
    const solutionMachine = {
        ...JSON.parse(JSON.stringify(CURRENT_PRACTICE.machine)),
        type: correctType 
    };
    
    // Animate the drawing of the correctly typed machine.
    animateMachineDrawing(solutionMachine);

    // Update the UI to reflect the type of the machine that was just loaded.
    if(modeSelect) {
        modeSelect.value = correctType;
    }
    // --- BUG FIX ENDS HERE ---
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
    addLogMessage('Checking your answer...', 'search');
    
    // The user's machine currently on the canvas
    const userMachine = MACHINE;
    
    // The solution machine needs its type explicitly defined for the check
    const modeSelect = document.getElementById('modeSelect');
    const correctType = modeSelect ? modeSelect.value.split('_TO_')[0] : 'DFA';
    const solutionMachine = {
        ...CURRENT_PRACTICE.machine,
        type: correctType
    };

    const isCorrect = await areEquivalent(userMachine, solutionMachine);

    if (isCorrect) {
        setValidationMessage('Correct Solution! Your automaton is logically equivalent to the solution.', 'success');
        addLogMessage('Result: Correct! good job buddy nice work', 'check-circle');
    } else {
        setValidationMessage('Incorrect! Your automaton does not match the solution.', 'error');
        addLogMessage('Result: Incorrect! come on bro u can do it.', 'x-circle');
    }
}
