import { MACHINE, CURRENT_MODE, TRANS_FROM, UNDO_STACK, REDO_STACK, pushUndo, doUndo, doRedo, initializeState, setCurrentMode, setTransFrom, setMachine, simState } from './state.js';
import { renderAll } from './renderer.js';
import { runSimulation, showStep } from './simulation.js';
import { convertEnfaToNfa, convertNfaToDfa, minimizeDfa, validateAutomaton } from './automata.js';
import { saveMachine, loadMachine, exportPng } from './file.js';
import { generatePractice, showSolution, resetPractice, checkAnswer } from './practice.js';
import { setValidationMessage } from './utils.js';

/**
 * Displays a custom modal alert.
 * @param {string} title - The title of the alert.
 * @param {string} message - The message content of the alert.
 */
function customAlert(title, message) {
    document.getElementById('alertModalTitle').textContent = title;
    document.getElementById('alertModalMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';
}

/**
 * Updates the disabled state of the Undo and Redo buttons.
 */
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
    if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}

/**
 * Arranges states in a circular layout. Used after conversions.
 * @param {Array} states - The array of state objects to lay out.
 */
function layoutStatesCircular(states) {
    if (!states || states.length === 0) return;
    const svg = document.getElementById('dfaSVG');
    const bbox = svg.viewBox.baseVal;
    const centerX = bbox.width / 2;
    const centerY = bbox.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.7;
    const radius = Math.max(150, Math.min(baseRadius, states.length * 40));
    const angleStep = (2 * Math.PI) / states.length;
    states.forEach((s, i) => {
        const angle = i * angleStep - (Math.PI / 2);
        s.x = centerX + radius * Math.cos(angle);
        s.y = centerY + radius * Math.sin(angle);
    });
}

/**
 * Initializes all user interface elements and event listeners.
 */
export function initializeUI() {
    const svg = document.getElementById('dfaSVG');
    const modeSelect = document.getElementById('modeSelect');

    // FIX: Changed 'alertOk' to 'alertModalClose' to match the ID in index.html.
    document.getElementById('alertModalClose').addEventListener('click', () => {
        document.getElementById('alertModal').style.display = 'none';
    });
    
    // Toggle for the control panel on mobile
    document.getElementById('panelToggleBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('controlPanel').classList.toggle('open');
    });

    document.getElementById('visualization-panel').addEventListener('click', () => {
        document.getElementById('controlPanel').classList.remove('open');
    });

    // Toolbar mode switching
    document.querySelectorAll('.toolbar-icon[data-mode]').forEach(tool => {
        tool.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-icon[data-mode]').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            setCurrentMode(tool.dataset.mode);
            setTransFrom(null); // Reset transition start state
            document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
            if (svg) svg.className.baseVal = `mode-${tool.dataset.mode}`;
            renderAll();
        });
    });

    // Canvas click handlers
    svg.addEventListener('click', (e) => {
        // Ignore clicks on states or transitions
        if (e.target.closest('g[data-id]') || e.target.closest('.transition-label-text')) return;
        
        if (CURRENT_MODE === 'addclick') {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            addState(svgP.x, svgP.y);
        }
    });

    // State click handler (delegated to SVG)
    svg.addEventListener('click', (e) => {
        const stateGroup = e.target.closest('g[data-id]');
        if (!stateGroup) return;
        const stateId = stateGroup.dataset.id;
        
        e.stopPropagation(); // Prevent canvas click from firing
        switch (CURRENT_MODE) {
            case 'transition':
                {
                    const circle = stateGroup.querySelector('.state-circle');
                    if (!TRANS_FROM) {
                        setTransFrom(stateId);
                        if(circle) circle.classList.add('state-selected');
                    } else if (TRANS_FROM !== stateId) {
                        showTransModal(TRANS_FROM, stateId);
                        document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
                        setTransFrom(null);
                    } else { // Clicked the same state twice
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

    // Transition label click handler for deletion
    svg.addEventListener('click', (e) => {
        const label = e.target.closest('.transition-label-text');
        if (!label || CURRENT_MODE !== 'delete') return;

        e.stopPropagation(); 
        const { from, to, symbol } = label.dataset;
        if (symbol !== undefined) {
            deleteTransition(from, to, symbol);
        }
    });
    
    // Modal confirmation/cancellation listeners
    document.getElementById('transCancel').addEventListener('click', hideTransModal);
    document.getElementById('transSave').addEventListener('click', () => {
        const from = document.getElementById('transFrom').value;
        const to = document.getElementById('transTo').value;
        // FIX: Standardize epsilon to an empty string on save. The renderer will display it as 'ε'.
        const symbol = document.getElementById('transSymbol').value.trim(); 
        
        if (MACHINE.type === 'DFA' && symbol === '') {
            customAlert('Invalid Transition', 'DFA rule: ε-transitions are not allowed.');
            return;
        }
        
        const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === symbol);
        if (MACHINE.type === 'DFA' && conflict) {
            customAlert('Invalid Transition', `DFA rule: State ${from} is already deterministic on '${symbol}'.`);
            return;
        }
        pushUndo(updateUndoRedoButtons);
        MACHINE.transitions.push({ from, to, symbol: symbol.charAt(0) });
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
            if (MACHINE.states.find(s => s.id === newId)) {
                customAlert('Rename Failed', 'A state with that name already exists.');
            }
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
        initializeState(updateUndoRedoButtons); // Re-initialize state
        renderAll();
        document.getElementById('confirmClearModal').style.display = 'none';
    });
    
    // File, Undo/Redo, and Canvas Control Buttons
    document.getElementById('undoBtn').addEventListener('click', () => doUndo(updateUndoRedoButtons));
    document.getElementById('redoBtn').addEventListener('click', () => doRedo(updateUndoRedoButtons));
    document.getElementById('saveMachineBtn').addEventListener('click', saveMachine);
    document.getElementById('loadMachineBtn').addEventListener('click', () => document.getElementById('loadFileInput').click());
    document.getElementById('loadFileInput').addEventListener('change', (e) => loadMachine(e, updateUndoRedoButtons));
    document.getElementById('exportPngBtn').addEventListener('click', exportPng);
    document.getElementById('clearCanvasBtn').addEventListener('click', () => document.getElementById('confirmClearModal').style.display = 'flex');
    document.getElementById('validateBtn').addEventListener('click', () => {
        const result = validateAutomaton();
        setValidationMessage(result.message, result.type);
    });

    // Mode Conversion Logic
    modeSelect.addEventListener('change', () => {
        const newMode = modeSelect.value;
        let convertedMachine = null;
        let successMsg = '';
        let targetType = 'DFA';
        try {
            if (newMode.includes('_TO_') && validateAutomaton().type === 'error') {
                 setValidationMessage('Cannot convert: current automaton is invalid.', 'error');
                 modeSelect.value = MACHINE.type;
                 return;
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
            customAlert('Conversion Failed', err.message);
            modeSelect.value = MACHINE.type;
            return;
        }
        
        pushUndo(updateUndoRedoButtons);
        if (convertedMachine) {
            convertedMachine.type = targetType;
            setMachine(convertedMachine);
            modeSelect.value = targetType;
            layoutStatesCircular(MACHINE.states); // Re-layout the new states
            setValidationMessage(successMsg, 'success');
        } else {
            MACHINE.type = newMode;
        }
        renderAll();
    });

    // Test Panel Buttons
    const testInput = document.getElementById('testInput');
    document.getElementById('runTestBtn').addEventListener('click', () => runSimulation(testInput.value));
    document.getElementById('genRandBtn').addEventListener('click', () => {
        const alphabet = (MACHINE.alphabet && MACHINE.alphabet.length) ? MACHINE.alphabet : ['0', '1'];
        const len = Math.floor(Math.random() * 8) + 3;
        testInput.value = Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    });
    document.getElementById('stepNext').addEventListener('click', () => showStep(++simState.index));
    document.getElementById('stepPrev').addEventListener('click', () => showStep(--simState.index));
    document.getElementById('stepReset').addEventListener('click', () => {
        simState.index = 0;
        simState.steps.length = 0;
        if(simState.timer) clearTimeout(simState.timer);
        document.getElementById('stepLog').innerHTML = '';
        document.getElementById('testOutput').textContent = 'Ready';
        renderAll(); // Clear highlights
    });

    // Practice Panel Buttons
    document.getElementById('genPracticeBtn').addEventListener('click', generatePractice);
    document.getElementById('showSolBtn').addEventListener('click', () => showSolution(updateUndoRedoButtons));
    document.getElementById('resetPractice').addEventListener('click', resetPractice);
    document.getElementById('checkAnswerBtn').addEventListener('click', checkAnswer);

    // Zoom Controls
    const zoomSlider = document.getElementById('zoomSlider');
    const setZoom = (pct) => {
        document.getElementById('svgWrapper').style.transform = `scale(${pct / 100})`;
        if(zoomSlider) zoomSlider.value = pct;
    };
    if(zoomSlider) zoomSlider.addEventListener('input', e => setZoom(e.target.value));
    document.getElementById('zoomInBtn').addEventListener('click', () => setZoom(Math.min(200, Number(zoomSlider.value) + 10)));
    document.getElementById('zoomOutBtn').addEventListener('click', () => setZoom(Math.max(50, Number(zoomSlider.value) - 10)));
    document.getElementById('zoomResetBtn').addEventListener('click', () => setZoom(100));
    setZoom(100);

    // Drag and Drop Logic for States
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
    
    // Initial render and UI update
    renderAll();
    updateUndoRedoButtons();
}

// --- Helper Functions for UI Actions ---

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
    // The renderer always displays empty string as ε, so we match against that
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
    // If there are states but no initial state, make the first one initial.
    if (MACHINE.states.length > 0 && !MACHINE.states.some(s => s.initial)) {
        MACHINE.states[0].initial = true;
    }
}
