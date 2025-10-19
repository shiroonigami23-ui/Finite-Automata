import { MACHINE, CURRENT_MODE, TRANS_FROM, UNDO_STACK, REDO_STACK, pushUndo, setMachine, initializeState, simState } from './state.js';
import { renderAll } from './renderer.js';
import { runSimulation, showStep } from './simulation.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa } from './automata.js';
import { saveMachine, loadMachine, exportPng } from './file.js';
import { generatePractice, showSolution, resetPractice, checkAnswer, validateAutomaton, updateAlphabet } from './practice.js';
import { updateUndoRedoButtons } from './utils.js';

function layoutStatesLine(states) {
    if (!states || states.length === 0) return;
    const canvasWidth = 1400;
    const canvasHeight = 900;
    const marginX = 100; 
    const marginY = 100;
    const spacingX = 160; 
    const spacingY = 120;

    const perRow = Math.max(1, Math.floor((canvasWidth - marginX * 2) / spacingX));

    states.forEach((s, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        s.x = marginX + col * spacingX;
        s.y = marginY + row * spacingY;
        if (row % 2 === 1) s.y += 40;
    });
    renderAll();
}

export function initializeUI() {
    const svg = document.getElementById('dfaSVG');
    const modeSelect = document.getElementById('modeSelect');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const genRandBtn = document.getElementById("genRandBtn");
    const stepNextBtn = document.getElementById("stepNext");
    const stepPrevBtn = document.getElementById("stepPrev");
    const stepResetBtn = document.getElementById("stepReset");
    const saveMachineBtn = document.getElementById("saveMachineBtn");
    const loadMachineBtn = document.getElementById("loadMachineBtn");
    const validateBtn = document.getElementById('validateBtn');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const runTestBtn = document.getElementById('runTestBtn');
    const testInput = document.getElementById('testInput');
    const genPracticeBtn = document.getElementById('genPracticeBtn');
    const showSolBtn = document.getElementById('showSolBtn');
    const resetPracticeBtn = document.getElementById('resetPractice');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');

    // Toolbar
    document.querySelectorAll('.toolbar-icon[data-mode]').forEach(tool => {
        tool.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-icon[data-mode]').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            setGlobal('CURRENT_MODE', tool.dataset.mode);
            setGlobal('TRANS_FROM', null);
            document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
        });
    });

    svg.addEventListener('click', (e) => {
        if (CURRENT_MODE === 'addclick') {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            addState(svgP.x, svgP.y);
        }
    });

    // Modals
    document.getElementById('transCancel').addEventListener('click', hideTransModal);
    document.getElementById('transSave').addEventListener('click', () => {
        const from = document.getElementById('transFrom').value;
        const to = document.getElementById('transTo').value;
        let symbol = document.getElementById('transSymbol').value.trim();

        if (symbol.length > 1) {
            symbol = symbol.charAt(0);
        }

        if (symbol === '') {
            symbol = 'ε';
        }

        if (MACHINE.type === 'DFA' && symbol === 'ε') {
            setValidationMessage('DFA rule: ε-transitions disallowed.', 'error');
            return;
        }

        const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === symbol);
        if (MACHINE.type === 'DFA' && conflict) {
            setValidationMessage(`DFA rule: State ${from} is already deterministic on '${symbol}'.`, 'error');
            return;
        }

        pushUndo();
        MACHINE.transitions.push({ from, to, symbol });
        updateAlphabet();
        renderAll();

        hideTransModal();
    });
    
    document.getElementById('propCancel').addEventListener('click', () => document.getElementById('statePropsModal').style.display = 'none');
    document.getElementById('propSave').addEventListener('click', () => {
        const modal = document.getElementById('statePropsModal');
        const stateId = modal.dataset.stateId;
        const s = MACHINE.states.find(st => st.id === stateId);
        if (s) {
            pushUndo();
            const isInitial = document.getElementById('propInitial').checked;
            if (isInitial && (MACHINE.type === 'DFA' || MACHINE.type.includes('DFA'))) {
                MACHINE.states.forEach(x => x.initial = false);
            }
            s.initial = isInitial;
            s.accepting = document.getElementById('propFinal').checked;
            enforceInitialStateRule();
            renderAll();
        }
        modal.style.display = 'none';
    });
    
    document.getElementById('renameCancel').addEventListener('click', () => {
        document.getElementById('renameModal').style.display = 'none';
    });

    document.getElementById('renameSave').addEventListener('click', () => {
        const modal = document.getElementById('renameModal');
        const oldId = modal.dataset.oldId;
        const newId = document.getElementById('renameInput').value.trim();

        if (!newId || newId === oldId) {
            modal.style.display = 'none';
            return;
        }
        if (MACHINE.states.find(s => s.id === newId)) {
            alert('State name already exists');
            return;
        }

        pushUndo();
        const st = MACHINE.states.find(s => s.id === oldId);
        if (st) st.id = newId;

        MACHINE.transitions.forEach(t => {
            if (t.from === oldId) t.from = newId;
            if (t.to === oldId) t.to = newId;
        });

        renderAll();
        modal.style.display = 'none';
    });

    document.getElementById('confirmClearCancel').addEventListener('click', () => {
        document.getElementById('confirmClearModal').style.display = 'none';
    });

    document.getElementById('confirmClearConfirm').addEventListener('click', () => {
        pushUndo();
        initializeState();
        renderAll();
        document.getElementById('confirmClearModal').style.display = 'none';
    });

    // Main controls
    undoBtn.addEventListener('click', () => {
        if (UNDO_STACK.length > 0) {
            REDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
            const prevState = UNDO_STACK.pop();
            setMachine(prevState);
            renderAll();
        }
    });
    redoBtn.addEventListener('click', () => {
        if (REDO_STACK.length > 0) {
            UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
            const nextState = REDO_STACK.pop();
            setMachine(nextState);
            renderAll();
        }
    });
    saveMachineBtn.addEventListener('click', saveMachine);
    loadMachineBtn.addEventListener('click', () => document.getElementById('loadFileInput').click());
    document.getElementById('loadFileInput').addEventListener('change', loadMachine);
    document.getElementById('exportPngBtn').addEventListener('click', exportPng);
    clearCanvasBtn.addEventListener('click', () => document.getElementById('confirmClearModal').style.display = 'flex');
    validateBtn.addEventListener('click', () => {
        const result = validateAutomaton();
        setValidationMessage(result, result.startsWith('Valid') ? 'success' : 'error');
    });

    modeSelect.addEventListener('change', () => {
        const newMode = modeSelect.value;
        let convertedMachine = null;
        let successMsg = '';

        try {
            if (!validateAutomaton().startsWith('Valid')) {
                setValidationMessage('Warning: Cannot convert invalid automaton.', 'error');
            }

            if (newMode === 'ENFA_TO_NFA') {
                convertedMachine = convertEnfaToNfa(MACHINE);
                successMsg = 'Converted ε-NFA to NFA.';
            } else if (newMode === 'NFA_TO_DFA') {
                convertedMachine = convertNfaToDfa(MACHINE);
                successMsg = 'Converted NFA to DFA.';
            } else if (newMode === 'NFA_TO_MIN_DFA') {
                convertedMachine = minimizeDfa(convertNfaToDfa(MACHINE));
                successMsg = 'Converted NFA to Minimal DFA.';
            } else if (newMode === 'DFA_TO_MIN_DFA') {
                convertedMachine = minimizeDfa(MACHINE);
                successMsg = 'Minimized DFA.';
            }
        } catch (err) {
            setValidationMessage('Conversion failed: ' + err.message, 'error');
            modeSelect.value = MACHINE.type;
            return;
        }
        if (convertedMachine) {
            pushUndo();
            setMachine(convertedMachine);

            MACHINE.type = 'DFA';
            if (newMode === 'ENFA_TO_NFA') MACHINE.type = 'NFA';

            modeSelect.value = MACHINE.type;
            layoutStatesLine(MACHINE.states);
            setValidationMessage(successMsg, 'success');
        } else {
            MACHINE.type = newMode;
            renderAll();
        }
    });

    // Testing
    runTestBtn.addEventListener('click', () => runSimulation(testInput.value));
    genRandBtn.addEventListener('click', () => {
        updateAlphabet();
        const alphabet = MACHINE.alphabet.length ? MACHINE.alphabet : ['0', '1'];
        const len = Math.floor(Math.random() * 8) + 3;
        testInput.value = Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    });
    stepNextBtn.addEventListener('click', () => showStep(++simState.index));
    stepPrevBtn.addEventListener('click', () => showStep(--simState.index));
    stepResetBtn.addEventListener('click', () => {
        simState.index = 0;
        simState.steps.length = 0;
        clearTimeout(simState.timer);
        document.getElementById('stepLog').innerHTML = '';
        document.getElementById('testOutput').textContent = 'Ready';
        renderAll();
    });
    
    // Practice
    genPracticeBtn.addEventListener('click', generatePractice);
    showSolBtn.addEventListener('click', showSolution);
    resetPracticeBtn.addEventListener('click', resetPractice);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    
    // Zoom
    const setZoom = (pct) => {
        const wrapper = document.getElementById('svgWrapper');
        wrapper.style.transform = `scale(${pct / 100})`;
        wrapper.style.transformOrigin = 'top left';
        zoomSlider.value = pct;
    };
    zoomSlider.addEventListener('input', e => setZoom(e.target.value));
    zoomInBtn.addEventListener('click', () => setZoom(Math.min(200, Number(zoomSlider.value) + 10)));
    zoomOutBtn.addEventListener('click', () => setZoom(Math.max(50, Number(zoomSlider.value) - 10)));
    zoomResetBtn.addEventListener('click', () => setZoom(100));
    setZoom(100);

    // Initial render
    renderAll();
}

export function addState(x, y) {
    let maxId = -1;
    MACHINE.states.forEach(state => {
        if (state.id.startsWith('q')) {
            const num = parseInt(state.id.substring(1));
            if (!isNaN(num) && num > maxId) {
                maxId = num;
            }
        }
    });
    const newId = 'q' + (maxId + 1);

    const isFirst = MACHINE.states.length === 0;
    pushUndo();
    MACHINE.states.push({ id: newId, x, y, initial: isFirst, accepting: false });
    renderAll();
    
    const stateG = document.querySelector(`g[data-id="${newId}"]`);
    if (stateG) {
        const circle = stateG.querySelector('circle');
        if (circle) {
            circle.classList.add('state-drawing');
            setTimeout(() => circle.classList.remove('state-drawing'), 600);
        }
    }
}

export function deleteState(id) {
    pushUndo();
    MACHINE.states = MACHINE.states.filter(s => s.id !== id);
    MACHINE.transitions = MACHINE.transitions.filter(t => t.from !== id && t.to !== id);
    enforceInitialStateRule();
    renderAll();
}

export function renameState(oldId) {
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    input.value = oldId;
    modal.dataset.oldId = oldId;
    modal.style.display = 'flex';
    input.focus();
    input.select();
}

export function openPropsModal(stateId) {
    const modal = document.getElementById('statePropsModal');
    modal.dataset.stateId = stateId;
    const st = MACHINE.states.find(s => s.id === stateId);
    if (!st) return;
    document.getElementById('propInitial').checked = st.initial;
    document.getElementById('propFinal').checked = st.accepting;
    modal.style.display = 'flex';
}

export function showTransModal(from, to) {
    const modal = document.getElementById('transitionModal');
    document.getElementById('transFrom').value = from;
    document.getElementById('transTo').value = to;
    document.getElementById('transSymbol').value = '';
    document.getElementById('transSymbol').focus();
    modal.style.display = 'flex';
}

function hideTransModal() {
    document.getElementById('transitionModal').style.display = 'none';
}

function enforceInitialStateRule() {
    try {
        if (!MACHINE || !Array.isArray(MACHINE.states)) return;
        const initialStates = MACHINE.states.filter(s => s.initial);
        if (initialStates.length > 1) {
            initialStates.slice(1).forEach(s => s.initial = false);
        }
        if (MACHINE.states.length > 0 && !MACHINE.states.some(s => s.initial)) {
            MACHINE.states[0].initial = true;
        }
    } catch (e) {
        console.error('enforceInitialStateRule failed:', e);
    }
}

function setValidationMessage(message, type) {
    const validationLine = document.getElementById('validationLine');
    validationLine.textContent = message;
    validationLine.classList.remove('success', 'error', 'show', 'warning');
    validationLine.classList.add(type, 'show');
    setTimeout(() => validationLine.classList.remove('show'), 4000);
}
