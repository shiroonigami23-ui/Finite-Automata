import { MACHINE, CURRENT_MODE, TRANS_FROM, UNDO_STACK, REDO_STACK, pushUndo, doUndo, doRedo, initializeState, setCurrentMode, setTransFrom, setMachine, simState } from './state.js';
import { renderAll } from './renderer.js';
import { runSimulation, showStep } from './simulation.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa, validateAutomaton } from './automata.js';
import { saveMachine, loadMachine, exportPng } from './file.js';
import { generatePractice, showSolution, resetPractice, checkAnswer } from './practice.js';
import { setValidationMessage, getModeLabel } from './utils.js';

// This function is now local to the UI and is passed to state functions when needed.
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
    if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}

// --- NEW: Smart circular layout function ---
function layoutStatesCircular(states) {
    if (!states || states.length === 0) return;
    const svg = document.getElementById('dfaSVG');
    const bbox = svg.viewBox.baseVal;
    const centerX = bbox.width / 2;
    const centerY = bbox.height / 2;
    
    // Calculate radius based on number of states to prevent overlap
    const baseRadius = Math.min(centerX, centerY) * 0.7;
    const radius = Math.max(150, Math.min(baseRadius, states.length * 40));

    const angleStep = (2 * Math.PI) / states.length;

    states.forEach((s, i) => {
        const angle = i * angleStep - (Math.PI / 2); // Start from the top
        s.x = centerX + radius * Math.cos(angle);
        s.y = centerY + radius * Math.sin(angle);
    });
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

    document.querySelectorAll('.toolbar-icon[data-mode]').forEach(tool => {
        tool.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-icon[data-mode]').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            setCurrentMode(tool.dataset.mode);
            setTransFrom(null);
            document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
            if (svg) svg.className.baseVal = `mode-${tool.dataset.mode}`;
            renderAll();
        });
    });

    svg.addEventListener('click', (e) => {
        if (e.target.closest('g[data-id]')) return;
        if (CURRENT_MODE === 'addclick') {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            addState(svgP.x, svgP.y);
        }
    });

    svg.addEventListener('click', (e) => {
        const stateGroup = e.target.closest('g[data-id]');
        if (!stateGroup) return;
        const stateId = stateGroup.dataset.id;
        const state = MACHINE.states.find(s => s.id === stateId);
        if (!state) return;
        e.stopPropagation();
        switch (CURRENT_MODE) {
            case 'transition':
                {
                    const circle = stateGroup.querySelector('.state-circle');
                    if (!TRANS_FROM) {
                        setTransFrom(stateId);
                        if(circle) circle.classList.add('state-selected');
                    } else {
                        showTransModal(TRANS_FROM, stateId);
                        document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
                        setTransFrom(null);
                    }
                    break;
                }
            case 'delete':
                deleteState(stateId);
                break;
            case 'rename':
                renameState(stateId);
                break;
            case 'stateprops':
                openPropsModal(stateId);
                break;
        }
    });

    svg.addEventListener('click', (e) => {
        const label = e.target.closest('.transition-label-text');
        if (!label || CURRENT_MODE !== 'delete') return;
        e.stopPropagation();
        const from = label.dataset.from;
        const to = label.dataset.to;
        const symbolsStr = label.dataset.symbols;
        const symbols = symbolsStr.split(',').map(s => s.trim());
        let symbolToDelete = null;
        if (symbols.length === 1) {
            symbolToDelete = symbols[0];
        } else {
            const input = prompt(`Delete which transition from ${from} to ${to}?\nAvailable: ${symbolsStr}`, symbols[0]);
            if (input === null) return;
            const trimmedInput = input.trim();
            const isEpsilon = ['e', 'epsilon', ''].includes(trimmedInput.toLowerCase());
            const symbolInArray = isEpsilon ? 'ε' : trimmedInput;
            if (symbols.includes(symbolInArray)) {
                symbolToDelete = symbolInArray;
            } else {
                alert(`Invalid symbol '${input}'. No transition deleted.`);
                return;
            }
        }
        if (symbolToDelete !== null) {
            deleteTransition(from, to, symbolToDelete);
        }
    });

    document.getElementById('transCancel').addEventListener('click', hideTransModal);
    document.getElementById('transSave').addEventListener('click', () => {
        const from = document.getElementById('transFrom').value;
        const to = document.getElementById('transTo').value;
        const symbol = document.getElementById('transSymbol').value.trim() || 'ε';
        if (MACHINE.type === 'DFA' && symbol === 'ε') {
            alert('DFA rule: ε-transitions disallowed.');
            return;
        }
        const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === symbol);
        if (MACHINE.type === 'DFA' && conflict) {
            alert(`DFA rule: State ${from} is already deterministic on '${symbol}'.`);
            return;
        }
        pushUndo(updateUndoRedoButtons);
        MACHINE.transitions.push({ from, to, symbol: (symbol === 'ε' ? '' : symbol.charAt(0)) });
        renderAll();
        hideTransModal();
    });

    document.getElementById('propCancel').addEventListener('click', () => document.getElementById('statePropsModal').style.display = 'none');
    document.getElementById('propSave').addEventListener('click', () => {
        const modal = document.getElementById('statePropsModal');
        const s = MACHINE.states.find(st => st.id === modal.dataset.stateId);
        if (s) {
            pushUndo(updateUndoRedoButtons);
            const isInitial = document.getElementById('propInitial').checked;
            if (isInitial && (MACHINE.type === 'DFA')) {
                MACHINE.states.forEach(x => x.initial = false);
            }
            s.initial = isInitial;
            s.accepting = document.getElementById('propFinal').checked;
            enforceInitialStateRule();
            renderAll();
        }
        modal.style.display = 'none';
    });

    document.getElementById('renameCancel').addEventListener('click', () => document.getElementById('renameModal').style.display = 'none');
    document.getElementById('renameSave').addEventListener('click', () => {
        const modal = document.getElementById('renameModal');
        const oldId = modal.dataset.oldId;
        const newId = document.getElementById('renameInput').value.trim();
        if (!newId || newId === oldId || MACHINE.states.find(s => s.id === newId)) {
            if (MACHINE.states.find(s => s.id === newId)) alert('State name already exists');
            modal.style.display = 'none';
            return;
        }
        pushUndo(updateUndoRedoButtons);
        MACHINE.states.find(s => s.id === oldId).id = newId;
        MACHINE.transitions.forEach(t => {
            if (t.from === oldId) t.from = newId;
            if (t.to === oldId) t.to = newId;
        });
        renderAll();
        modal.style.display = 'none';
    });

    document.getElementById('confirmClearCancel').addEventListener('click', () => document.getElementById('confirmClearModal').style.display = 'none');
    document.getElementById('confirmClearConfirm').addEventListener('click', () => {
        pushUndo(updateUndoRedoButtons);
        initializeState(updateUndoRedoButtons);
        renderAll();
        document.getElementById('confirmClearModal').style.display = 'none';
    });

    undoBtn.addEventListener('click', () => doUndo(updateUndoRedoButtons));
    redoBtn.addEventListener('click', () => doRedo(updateUndoRedoButtons));
    saveMachineBtn.addEventListener('click', saveMachine);
    loadMachineBtn.addEventListener('click', () => document.getElementById('loadFileInput').click());
    document.getElementById('loadFileInput').addEventListener('change', (e) => loadMachine(e, updateUndoRedoButtons));
    document.getElementById('exportPngBtn').addEventListener('click', exportPng);
    clearCanvasBtn.addEventListener('click', () => document.getElementById('confirmClearModal').style.display = 'flex');

    validateBtn.addEventListener('click', () => {
        const result = validateAutomaton();
        setValidationMessage(result.message, result.type);
    });

    modeSelect.addEventListener('change', () => {
        const newMode = modeSelect.value;
        let convertedMachine = null;
        let successMsg = '';
        let targetType = 'DFA';
        try {
            if (validateAutomaton().type === 'error' && !newMode.includes('_TO_')) {
                 setValidationMessage('Cannot convert invalid automaton.', 'warning');
            }
            if (newMode === 'ENFA_TO_NFA') {
                convertedMachine = convertEnfaToNfa(MACHINE);
                successMsg = 'Converted ε-NFA to NFA.';
                targetType = 'NFA';
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
            pushUndo(updateUndoRedoButtons);
            convertedMachine.type = targetType;
            setMachine(convertedMachine);
            modeSelect.value = targetType;
            // --- FIX: Use the new circular layout function ---
            layoutStatesCircular(MACHINE.states);
            setValidationMessage(successMsg, 'success');
        } else {
            MACHINE.type = newMode;
        }
        renderAll();
    });

    runTestBtn.addEventListener('click', () => runSimulation(testInput.value));
    genRandBtn.addEventListener('click', () => {
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

    genPracticeBtn.addEventListener('click', generatePractice);
    showSolBtn.addEventListener('click', () => showSolution(updateUndoRedoButtons));
    resetPracticeBtn.addEventListener('click', resetPractice);
    checkAnswerBtn.addEventListener('click', checkAnswer);

    const setZoom = (pct) => {
        const wrapper = document.getElementById('svgWrapper');
        if(wrapper) {
            wrapper.style.transform = `scale(${pct / 100})`;
            wrapper.style.transformOrigin = 'top left';
        }
        if(zoomSlider) zoomSlider.value = pct;
    };
    if(zoomSlider) zoomSlider.addEventListener('input', e => setZoom(e.target.value));
    if(zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(Math.min(200, Number(zoomSlider.value) + 10)));
    if(zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(Math.max(50, Number(zoomSlider.value) - 10)));
    if(zoomResetBtn) zoomResetBtn.addEventListener('click', () => setZoom(100));
    setZoom(100);

    let dragging = false, currentStateG = null, dragOffsetX = 0, dragOffsetY = 0;

    function getPoint(evt) {
        const pt = svg.createSVGPoint();
        const touch = evt.touches ? evt.touches[0] : evt;
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function startDrag(e) {
        const stateG = e.target.closest('g[data-id]');
        if (CURRENT_MODE !== 'move' || !stateG) return;
        e.preventDefault(); e.stopPropagation();
        const sObj = MACHINE.states.find(x => x.id === stateG.getAttribute('data-id'));
        if (!sObj) return;
        pushUndo(updateUndoRedoButtons);
        dragging = true; currentStateG = stateG;
        const p = getPoint(e);
        dragOffsetX = p.x - sObj.x; dragOffsetY = p.y - sObj.y;
        stateG.querySelector('circle').classList.add('state-selected');
    }

    function moveDrag(e) {
        if (!dragging) return;
        e.preventDefault();
        const sObj = MACHINE.states.find(x => x.id === currentStateG.getAttribute('data-id'));
        if (!sObj) return;
        const p = getPoint(e);
        sObj.x = p.x - dragOffsetX; sObj.y = p.y - dragOffsetY;
        renderAll();
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        if(currentStateG) {
            currentStateG.querySelector('circle').classList.remove('state-selected');
        }
        currentStateG = null;
    }

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', moveDrag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
    svg.addEventListener('touchstart', startDrag);
    svg.addEventListener('touchmove', moveDrag);
    svg.addEventListener('touchend', endDrag);
    svg.addEventListener('touchcancel', endDrag);

    renderAll();
    updateUndoRedoButtons();
}

function addState(x, y) {
    let maxId = -1;
    MACHINE.states.forEach(state => {
        if (state.id.startsWith('q')) {
            const num = parseInt(state.id.substring(1), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        }
    });
    const newId = 'q' + (maxId + 1);
    pushUndo(updateUndoRedoButtons);
    MACHINE.states.push({ id: newId, x, y, initial: MACHINE.states.length === 0, accepting: false });
    renderAll();
    const stateG = document.querySelector(`g[data-id="${newId}"] circle`);
    if (stateG) {
        stateG.classList.add('state-drawing');
        setTimeout(() => stateG.classList.remove('state-drawing'), 600);
    }
}

function deleteState(id) {
    pushUndo(updateUndoRedoButtons);
    setMachine({
        ...MACHINE,
        states: MACHINE.states.filter(s => s.id !== id),
        transitions: MACHINE.transitions.filter(t => t.from !== id && t.to !== id)
    });
    enforceInitialStateRule();
    renderAll();
}

function deleteTransition(from, to, symbol) {
    pushUndo(updateUndoRedoButtons);
    const symbolToMatch = symbol === 'ε' ? '' : symbol;
    const indexToDelete = MACHINE.transitions.findIndex(t => 
        t.from === from && 
        t.to === to && 
        (t.symbol || '') === symbolToMatch
    );
    if (indexToDelete > -1) {
        MACHINE.transitions.splice(indexToDelete, 1);
        renderAll();
    }
}

function renameState(oldId) {
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    input.value = oldId;
    modal.dataset.oldId = oldId;
    modal.style.display = 'flex';
    input.focus();
    input.select();
}

function openPropsModal(stateId) {
    const modal = document.getElementById('statePropsModal');
    modal.dataset.stateId = stateId;
    const st = MACHINE.states.find(s => s.id === stateId);
    if (!st) return;
    document.getElementById('propInitial').checked = st.initial;
    document.getElementById('propFinal').checked = st.accepting;
    modal.style.display = 'flex';
}

function showTransModal(from, to) {
    const modal = document.getElementById('transitionModal');
    document.getElementById('transFrom').value = from;
    document.getElementById('transTo').value = to;
    document.getElementById('transSymbol').value = '';
    modal.style.display = 'flex';
    document.getElementById('transSymbol').focus();
}

function hideTransModal() {
    document.getElementById('transitionModal').style.display = 'none';
}

function enforceInitialStateRule() {
    if (!MACHINE || !Array.isArray(MACHINE.states)) return;
    if (MACHINE.states.length > 0 && !MACHINE.states.some(s => s.initial)) {
        MACHINE.states[0].initial = true;
    }
}
