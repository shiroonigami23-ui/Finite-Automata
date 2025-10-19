// practice.js
import { MACHINE, CURRENT_PRACTICE, pushUndo, setMachine, setCurrentPractice } from './state.js';
import { renderAll } from './renderer.js';
import { setValidationMessage } from './utils.js';

export function generatePractice() {
    const practiceBox = document.getElementById('practiceBox');
    const mode = MACHINE.type;
    const level = document.getElementById('practiceMode').value;
    const bank = window.PRACTICE_BANK[mode]?.[level];

    if (!bank || bank.length === 0) {
        practiceBox.textContent = "No questions available for this mode/level.";
        return;
    }
    const newPractice = bank[Math.floor(Math.random() * bank.length)];
    setCurrentPractice(newPractice); // CORRECTED: Use a function to set state
    practiceBox.innerHTML = `<strong>${mode} | ${level}</strong><div style="margin-top:8px">${newPractice.q}</div>`;
}

export async function showSolution() {
    if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
        setValidationMessage('No practice generated or missing solution data.', 'error');
        return;
    }

    pushUndo();
    const solutionMachine = JSON.parse(JSON.stringify(CURRENT_PRACTICE.machine));
    solutionMachine.type = MACHINE.type;
    setMachine(solutionMachine);
    renderAll();
}

export function resetPractice() {
    setCurrentPractice(null); // CORRECTED: Use a function to set state
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

export function validateAutomaton() {
    const states = MACHINE.states;
    const transitions = MACHINE.transitions;
    const errors = [];

    if (states.length === 0) return { message: 'Invalid: No states defined.', type: 'error' };

    const initialCount = states.filter(s => s.initial).length;
    if (initialCount !== 1) errors.push(`Must have exactly 1 initial state (found ${initialCount}).`);
    if (states.filter(s => s.accepting).length === 0) errors.push('Warning: No accepting states.');

    if (MACHINE.type === 'DFA') {
        if (transitions.some(t => !t.symbol || t.symbol === 'ε')) errors.push('DFA cannot have ε-transitions.');
        for (const st of states) {
            const symbols = new Set();
            for (const t of transitions.filter(tt => tt.from === st.id)) {
                if (symbols.has(t.symbol)) {
                    errors.push(`State ${st.id} is non-deterministic on symbol '${t.symbol}'.`);
                    break;
                }
                symbols.add(t.symbol);
            }
        }
    } else if (MACHINE.type === 'NFA') {
        if (transitions.some(t => !t.symbol || t.symbol === 'ε')) errors.push('NFA cannot have ε-transitions (use ε-NFA mode).');
    }

    if (errors.length > 0) {
        return { message: `Invalid: ${errors.join(' ')}`, type: 'error' };
    }
    return { message: 'Valid Automaton', type: 'success' };
}

export function updateAlphabet() {
    const set = new Set(MACHINE.transitions.map(t => t.symbol).filter(s => s && s !== 'ε'));
    MACHINE.alphabet = Array.from(set).sort();
}
