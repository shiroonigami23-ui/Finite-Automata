import { MACHINE, CURRENT_PRACTICE, pushUndo } from './state.js';
import { renderAll } from './renderer.js';
import { sleep } from './utils.js';

export function generatePractice() {
    const practiceBox = document.getElementById('practiceBox');
    const mode = MACHINE.type;
    const level = document.getElementById('practiceMode').value;
    const bank = PRACTICE_BANK[mode]?.[level];

    if (!bank || bank.length === 0) {
        practiceBox.textContent = "No questions available for this mode/level.";
        return;
    }
    CURRENT_PRACTICE = bank[Math.floor(Math.random() * bank.length)];

    practiceBox.innerHTML = `<strong>${mode} | ${level}</strong><div style="margin-top:8px">${CURRENT_PRACTICE.q}</div>`;
}

export async function showSolution() {
    const practiceBox = document.getElementById('practiceBox');
    if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
        setValidationMessage('No practice generated or missing solution data.', 'error');
        return;
    }

    practiceBox.innerHTML = `<strong>Problem:</strong> ${CURRENT_PRACTICE.q}<br><strong>Solution:</strong><div style="white-space:pre-wrap;">${CURRENT_PRACTICE.sol}</div>`;

    pushUndo();

    const solutionMachine = CURRENT_PRACTICE.machine;
    const preservedType = (MACHINE && MACHINE.type) || (document.getElementById('modeSelect') && document.getElementById('modeSelect').value) || 'DFA';
    const tempMachine = { ...solutionMachine, states: [], transitions: [], type: preservedType };
    MACHINE = tempMachine;
    renderAll();
    document.getElementById('stepLog').innerHTML = `<div><i data-lucide="zap"></i> **Starting Solution Construction...**</div>`;
    lucide.createIcons();

    const addConstructionLog = (message) => {
        const log = document.getElementById('stepLog');
        log.innerHTML = `<div class="new-log"><i data-lucide="edit"></i> ${message}</div>` + log.innerHTML;
        lucide.createIcons();
    };

    for (const state of solutionMachine.states) {
        MACHINE.states.push(state);
        renderAll();

        let message = `**Added state ${state.id}**`;
        if (state.initial) message += " (Set as **Initial**)";
        if (state.accepting) message += " (Set as **Final**)";

        addConstructionLog(message);

        const stateG = document.querySelector(`[data-id="${state.id}"]`);
        if (stateG) stateG.querySelector('circle')?.classList.add('state-drawing');
        await sleep(2000);
        stateG.querySelector('circle')?.classList.remove('state-drawing');
    }

    let renderedTransitions = new Set();
    for (const transition of solutionMachine.transitions) {
        const arcKey = `${transition.from}->${transition.to}`;

        if (renderedTransitions.has(arcKey)) {
            addConstructionLog(`Added symbol '${transition.symbol}' to arc ${transition.from} → ${transition.to}`);
            continue;
        }

        MACHINE.transitions.push(transition);
        updateAlphabet();
        renderAll();

        addConstructionLog(`**Drawing transition** from ${transition.from} to ${transition.to} on symbol '${transition.symbol}'`);

        const pathEl = document.querySelector(`.transition-path[data-from="${transition.from}"][data-to="${transition.to}"]`);
        if (pathEl) {
            pathEl.classList.add('transition-drawing');
        }
        renderedTransitions.add(arcKey);
        await sleep(2000);
    }

    MACHINE = JSON.parse(JSON.stringify(solutionMachine));
    MACHINE.type = (typeof preservedType !== 'undefined') ? preservedType : (MACHINE.type || 'DFA');
    addConstructionLog(`**Construction Complete!** Final machine loaded.`);
    renderAll();
}

export function resetPractice() {
    CURRENT_PRACTICE = null;
    document.getElementById('practiceBox').textContent = 'No practice generated yet.';
}

export function checkAnswer() {
    if (!CURRENT_PRACTICE) {
        setValidationMessage('No practice generated yet.', 'error');
        return;
    }
    const result = validateAutomaton();
    if (result.startsWith('Valid')) {
        setValidationMessage(`You did it! ${result}`, 'success');
    } else {
        setValidationMessage(`Not fully valid. ${result}`, 'error');
    }
}

export function validateAutomaton() {
    const mode = document.getElementById('modeSelect').value;
    const states = MACHINE.states;
    const transitions = MACHINE.transitions;
    const errors = [];

    if (states.length === 0) {
        return 'Invalid: No states defined.';
    }

    const initialCount = states.filter(s => s.initial).length;

    if (initialCount === 0) {
        errors.push('Must have exactly 1 initial state (found 0).');
    } else if (initialCount > 1) {
        errors.push(`Must have exactly 1 initial state (found ${initialCount}).`);
    }

    if (states.filter(s => s.accepting).length === 0) {
        errors.push('Warning: No accepting states.');
    }

    if (mode.includes('DFA')) {
        if (transitions.some(t => t.symbol === 'ε' || !t.symbol)) {
            errors.push('DFA cannot have ε-transitions.');
        }

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

        const alphabet = MACHINE.alphabet;
        for (const st of states) {
            const definedSymbols = new Set(transitions.filter(t => t.from === st.id).map(t => t.symbol));
            if (alphabet && alphabet.length > 0) {
                for (const symbol of alphabet) {
                    if (!definedSymbols.has(symbol)) {
                        errors.push(`Warning: State ${st.id} is missing a transition for symbol '${symbol}'.`);
                    }
                }
            }
        }
    } else if (mode.includes('NFA')) {
        if (mode === 'NFA' && transitions.some(t => t.symbol === 'ε' || !t.symbol)) {
            errors.push('NFA cannot have ε-transitions (use ε-NFA mode).');
        }
    }

    return errors.length === 0 ? 'Valid' : `Invalid: ${errors.join(' ')}`;
}

export function updateAlphabet() {
    const set = new Set();
    MACHINE.transitions.forEach(t => {
        if (t.symbol && t.symbol !== 'ε' && t.symbol !== '') set.add(t.symbol);
    });

    MACHINE.alphabet = Array.from(set).sort();
}
