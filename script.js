      
document.addEventListener("DOMContentLoaded", () => {
    
      const svg = document.getElementById('dfaSVG');
      const statesGroup = document.getElementById('states');
      const edgesGroup = document.getElementById('edges');
      const testOutput = document.getElementById('testOutput');
      const testInput = document.getElementById('testInput');
      const practiceBox = document.getElementById('practiceBox');
      const genPracticeBtn = document.getElementById('genPracticeBtn');
      const showSolBtn = document.getElementById('showSolBtn');
      const resetPractice = document.getElementById('resetPractice');
      const checkAnswerBtn =
        document.getElementById('checkAnswerBtn');
      const runTestBtn = document.getElementById('runTestBtn');
      const validateBtn = document.getElementById('validateBtn');
      const exportBtn = document.getElementById('exportPngBtn');
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
      const loadFileInput = document.getElementById("loadFileInput");
      const validationLine = document.getElementById('validationLine');

      let MACHINE = {
        type: 'DFA',
        states: [],
        transitions: [],
        alphabet: []
      };
      let UNDO_STACK = [];
      let REDO_STACK = [];
      let CURRENT_MODE = 'addclick';
      let TRANS_FROM = null;
      let SELECTED_STATE = null;
      let CURRENT_PRACTICE = null;
      let simSteps = [], simIndex = 0, simTimer = null;


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

      function getLoopPathAndLabel(cx, cy, r) {
        const loopRadius = 35;
        return {
          pathData: `M ${cx} ${cy - r} C ${cx - loopRadius} ${cy - r - loopRadius}, ${cx + loopRadius} ${cy - r - loopRadius}, ${cx} ${cy - r}`,
          labelX: cx,
          labelY: cy - r - (loopRadius / 2) - 10
        };
      }

        function renderAll() {
    statesGroup.innerHTML = '';
    edgesGroup.innerHTML = '';
    document.getElementById('canvasHint').style.display = (!MACHINE.states || MACHINE.states.length === 0) ? 'block' : 'none';

    const processedArcs = new Set();
    (MACHINE.transitions || []).forEach(t => {
        const from = MACHINE.states.find(s => s.id === t.from);
        const to = MACHINE.states.find(s => s.id === t.to);
        if (!from || !to) return;

        const arcKey = `${t.from}->${t.to}`;
        if (processedArcs.has(arcKey)) return;
        processedArcs.add(arcKey);

        let pathD, labelX, labelY;
        if (t.from === t.to) {
            const loop = getLoopPathAndLabel(from.x, from.y, 30);
            pathD = loop.pathData;
            labelX = loop.labelX;
            labelY = loop.labelY;
        } else {
            const dx = to.x - from.x, dy = to.y - from.y;
            const angle = Math.atan2(dy, dx);
            const r = 30;
            const startX = from.x + r * Math.cos(angle), startY = from.y + r * Math.sin(angle);
            const endX = to.x - r * Math.cos(angle), endY = to.y - r * Math.sin(angle);

            const reverse = MACHINE.transitions.some(o => o.from === t.to && o.to === t.from);
            if (reverse) {
                const offset = 40, midX = (startX + endX) / 2, midY = (startY + endY) / 2;
                const normX = -dy / Math.hypot(dx, dy), normY = dx / Math.hypot(dx, dy);
                const cpx = midX + normX * offset, cpy = midY + normY * offset;
                pathD = `M ${startX} ${startY} Q ${cpx} ${cpy} ${endX} ${endY}`;
                labelX = cpx;
                labelY = cpy;
            } else {
                pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = (startY + endY) / 2;
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.classList.add('transition-path');
        path.setAttribute('data-from', t.from);
        path.setAttribute('data-to', t.to);
        edgesGroup.appendChild(path);

        const arcSymbols = MACHINE.transitions
            .filter(tt => tt.from === t.from && tt.to === t.to)
            .map(tt => (tt.symbol === '' || tt.symbol === undefined) ? 'ε' : tt.symbol);
        
        const labelText = [...new Set(arcSymbols)].join(', ');

        const textHalo = document.createElementNS(svg.namespaceURI, 'text');
        textHalo.setAttribute('class', 'transition-label');
        textHalo.setAttribute('x', labelX);
        textHalo.setAttribute('y', labelY);
        textHalo.style.stroke = 'white';
        textHalo.style.strokeWidth = '4px';
        textHalo.style.strokeLinejoin = 'round';
        textHalo.textContent = labelText;
        edgesGroup.appendChild(textHalo);

        const text = document.createElementNS(svg.namespaceURI, 'text');
        text.setAttribute('class', 'transition-label');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.textContent = labelText;
        edgesGroup.appendChild(text);
    });

    
    MACHINE.states.forEach(state => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-id', state.id);
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            if (CURRENT_MODE === 'transition') {
                const circle = g.querySelector('.state-circle');
                if (!TRANS_FROM) {
                    TRANS_FROM = state.id;
                    circle.classList.add('state-selected');
                } else {
                    showTransModal(TRANS_FROM, state.id);
                    document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
                    TRANS_FROM = null;
                }
            } else if (CURRENT_MODE === 'delete') {
                deleteState(state.id);
            } else if (CURRENT_MODE === 'rename') {
                renameState(state.id);
            } else if (CURRENT_MODE === 'stateprops') {
                openPropsModal(state.id);
            }
        });

        if (state.initial) {
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            arrow.setAttribute('x1', state.x - 60);
            arrow.setAttribute('y1', state.y);
            arrow.setAttribute('x2', state.x - 32);
            arrow.setAttribute('y2', state.y);
            arrow.classList.add('initial-arrow');
            g.appendChild(arrow);
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', state.x);
        circle.setAttribute('cy', state.y);
        circle.setAttribute('r', 30);
        circle.classList.add('state-circle');
        circle.setAttribute('data-id', state.id); 
        if (state.initial) circle.classList.add('initial-pulse');
        g.appendChild(circle);

        if (state.accepting) {
            const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            innerCircle.setAttribute('cx', state.x);
            innerCircle.setAttribute('cy', state.y);
            innerCircle.setAttribute('r', 24);
            innerCircle.classList.add('final-ring');
            g.appendChild(innerCircle);
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', state.x);
        text.setAttribute('y', state.y);
        text.classList.add('state-label');
        text.textContent = state.id;
        g.appendChild(text);

        statesGroup.appendChild(g);
    });

    document.getElementById('modeLabel').textContent = getModeLabel();
    updateUndoRedoButtons();
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
    
      function getModeLabel() {
        const val = modeSelect.value;
        const labels = {
          'DFA': 'DFA', 'NFA': 'NFA', 'ENFA': 'ε-NFA',
          'ENFA_TO_NFA': 'ε-NFA → NFA (Conversion)',
          'NFA_TO_DFA': 'NFA → DFA (Conversion)',
          'NFA_TO_MIN_DFA': 'NFA → Minimal DFA (Conversion)',
          'DFA_TO_MIN_DFA': 'DFA → Minimal DFA (Conversion)'
        };
        return labels[val] || val;
      }

      function layoutStatesLine(states) {
        if (!states || states.length === 0) return;
        const canvasWidth = 1400;
        const canvasHeight = 900;
        const marginX = 100; const marginY = 100;
        const spacingX = 160; const spacingY = 120;

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

      

      function addState(x, y) {
    
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

    
function renameState(oldId) {
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    input.value = oldId;


    modal.dataset.oldId = oldId;
    
    modal.style.display = 'flex';
    input.focus();
    input.select();
}


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
function deleteState(id) {
        pushUndo();
        MACHINE.states = MACHINE.states.filter(s => s.id !== id);
        MACHINE.transitions = MACHINE.transitions.filter(t => t.from !== id && t.to !== id);
        enforceInitialStateRule();
        renderAll();
}


function clearCanvas() {
    // Just confirmation modal
    document.getElementById('confirmClearModal').style.display = 'flex';
}

document.getElementById('confirmClearCancel').addEventListener('click', () => {
    document.getElementById('confirmClearModal').style.display = 'none';
});

document.getElementById('confirmClearConfirm').addEventListener('click', () => {
    pushUndo(); 
    MACHINE = {
        type: modeSelect.value, 
        states: [],
        transitions: [],
        alphabet: []
    };
    renderAll();
    document.getElementById('confirmClearModal').style.display = 'none';
});
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener('click', clearCanvas);
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
        document.getElementById('transSymbol').focus();
        modal.style.display = 'flex';
      }

      function hideTransModal() {
        document.getElementById('transitionModal').style.display = 'none';
      }

      function updateAlphabet() {
        const set = new Set();
        MACHINE.transitions.forEach(t => {
          if (t.symbol && t.symbol !== 'ε' && t.symbol !== '') set.add(t.symbol);
        });

        MACHINE.alphabet = Array.from(set).sort();
      }

      
      function pushUndo() {
        UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        REDO_STACK = [];

        updateUndoRedoButtons();
      }

      function doUndo() {
        if (UNDO_STACK.length === 0) return;
        REDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        MACHINE = UNDO_STACK.pop();

        renderAll();
      }

      function doRedo() {
        if (REDO_STACK.length === 0) return;
        UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
        MACHINE = REDO_STACK.pop();

        renderAll();
      }

      function updateUndoRedoButtons() {
        if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;

        if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
      }

      async function runSimulation(inputStr) {
    simSteps = [];
    simIndex = 0; 
    clearTimeout(simTimer);
    document.getElementById('stepLog').innerHTML = '';
    testOutput.textContent = 'Simulating...';
    
    const startStates = MACHINE.states.filter(s => s.initial).map(s => s.id);

    if (startStates.length === 0) {
        testOutput.textContent = 'Error: No initial state defined.';
        testOutput.style.color = '#e53e3e';
        return;
    }

    let currentStates = (MACHINE.type === 'ENFA') ? epsilonClosure(startStates) : [...startStates];
    
    if (MACHINE.type === 'DFA' && currentStates.length > 1) {
        currentStates = [currentStates[0]];
    }
    
    simSteps.push({ start: true, active: [...currentStates] });

    let halted = false;
    for (const symbol of inputStr) {
        if (halted) break;

        const frame = { before: [...currentStates], symbol: symbol, steps: [], after: [] };
        const nextStates = new Set();
        
        if (MACHINE.type === 'DFA') {
            if (currentStates.length > 0) {
                const transition = MACHINE.transitions.find(t => t.from === currentStates[0] && t.symbol === symbol);
                if (transition) {
                    frame.steps.push({ from: transition.from, to: transition.to, symbol: transition.symbol });
                    nextStates.add(transition.to);
                }
            }
        } 
        else { 
            for (const stateId of currentStates) {
                MACHINE.transitions
                    .filter(t => t.from === stateId && t.symbol === symbol)
                    .forEach(t => {
                        frame.steps.push({ from: t.from, to: t.to, symbol: t.symbol });
                        nextStates.add(t.to);
                    });
            }
        }

        const afterStates = (MACHINE.type === 'ENFA') ? epsilonClosure([...nextStates]) : [...nextStates];
        
        frame.after = afterStates;
        simSteps.push(frame);
        currentStates = afterStates;

        if (currentStates.length === 0) {
            halted = true;
        }
    }
    
    simSteps.push({ end: true, active: [...currentStates] });

    document.getElementById('manualButtons').style.display = 'none';
    playAuto();
      }

      function epsilonClosure(list) {
        const out = new Set(list);
        const stack = [...list];
        while (stack.length) {
          const q = stack.pop();

          MACHINE.transitions.filter(t => t.from === q && (t.symbol === '' || t.symbol === 'ε')).forEach(t => {
            if (!out.has(t.to)) { out.add(t.to); stack.push(t.to); }
          });
        }
        return [...out];
      }

      async function showStep(idx) {
    if (idx < 0 || idx >= simSteps.length) {
      simIndex = Math.max(0, Math.min(idx, simSteps.length - 1));
      return;
    }
    simIndex = idx;
    const step = simSteps[idx];
    const log = document.getElementById('stepLog');
    const speed = parseInt(document.getElementById('testSpeed').value || '500');

    document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));

    if (idx === 0) log.innerHTML = '';

    if (step.end) {
      const isAccepted = (step.active || []).some(sid => MACHINE.states.find(s => s.id === sid && s.accepting));
      testOutput.textContent = isAccepted ? 'Accepted' : 'Rejected';
      testOutput.style.color = isAccepted ? '#38a169' : '#e53e3e';
      
      step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
      
      const finalLog = `<div><strong>Final active states: {${(step.active || []).join(', ') || '∅'}}</strong></div>`;
      const resultLog = `<div><strong style="color:${isAccepted ? '#4ade80' : '#f87171'}">${isAccepted ? '✔ Accepted' : '✘ Rejected'}</strong></div>`;
      log.innerHTML = resultLog + finalLog + log.innerHTML;
      return;
    }

    if (step.start) {
      log.innerHTML = `<div><strong>Initial active states: {${(step.active || []).join(', ')}}</strong></div>` + log.innerHTML;
      step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
      return;
    }
    
    testOutput.textContent = `Processing '${step.symbol}'... Active: {${(step.after || []).join(', ') || '∅'}}`;

    step.before.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
    await sleep(speed / 2);

    if (step.steps.length > 0) {
        step.steps.forEach(s => {
            log.innerHTML = `<div>Read '<b>${s.symbol}</b>': δ(${s.from}, ${s.symbol}) → ${s.to}</div>` + log.innerHTML;
            document.querySelector(`.transition-path[data-from="${s.from}"][data-to="${s.to}"]`)?.classList.add('transition-animating');
        });
    } else {
        log.innerHTML = `<div>Read '<b>${step.symbol}</b>': No transitions from {${step.before.join(', ')}}. Halting.</div>` + log.innerHTML;
    }
    
    await sleep(speed / 2);

    document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));
    step.after.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
      }


      async function playAuto() {
    for (let i = 0; i < simSteps.length; i++) {
      await showStep(i);
      const speed = parseInt(document.getElementById('testSpeed').value || '800');
      if (i < simSteps.length - 1) {
          await sleep(speed);
      }
    }
      }


      

      function computeEpsilonClosure(states, transitions) {
    
    const stateSet = new Set(Array.isArray(states) ? states : [states]);
    const stack = Array.isArray(states) ? [...states] : [states];

    while (stack.length > 0) {
        const s = stack.pop();
        if (!s) continue; 

        for (const t of transitions) {
            if (t.from === s && (t.symbol === '' || t.symbol === 'ε')) {
                if (!stateSet.has(t.to)) {
                    stateSet.add(t.to);
                    stack.push(t.to);
                }
            }
        }
    }
    return Array.from(stateSet);
}


      function convertEnfaToNfa(machine) {
        const m = JSON.parse(JSON.stringify(machine));
        const newTrans = []; const seen = new Set();
        for (const st of m.states) {
          const closure = computeEpsilonClosure(st.id, m.transitions);

          for (const closureState of closure) {
            for (const t of m.transitions) {
              if (t.from === closureState && t.symbol !== '' && t.symbol !== 'ε') {
                const destClosure = computeEpsilonClosure(t.to, m.transitions);

                for (const dest of destClosure) {
                  const key = `${st.id}->${dest}:${t.symbol}`;

                  if (!seen.has(key)) {
                    newTrans.push({ from: st.id, to: dest, symbol: t.symbol });
                    seen.add(key);
                  }
                }
              }
            }
          }
          // Update accepting states based on closure
          for (const closureState of closure) {
            const sf = m.states.find(x => x.id === closureState);
            if (sf && sf.accepting) {
              const orig = m.states.find(x => x.id === st.id);
              if (orig) orig.accepting = true;
            }
          }
        }
        m.transitions = newTrans.filter(t => t.symbol !== '' && t.symbol !== 'ε');
        m.type = 'NFA'; return m;
      }

    
function convertNfaToDfa(nfa) {
    const nfaMachine = nfa.type === 'ENFA' ? convertEnfaToNfa(nfa) : nfa;
    const alphabet = Array.from(new Set(nfaMachine.transitions.map(t => t.symbol).filter(s => s && s !== 'ε')));

    const trapStateKey = '{}'; 

    const mapKey = (arr) => arr.sort().join(',') || trapStateKey;

    const initialNFAStates = nfaMachine.states.filter(s => s.initial).map(s => s.id);
    const initialDFAStateSet = computeEpsilonClosure(initialNFAStates, nfaMachine.transitions); 
    const initialKey = mapKey(initialDFAStateSet);

    const dfaStatesData = new Map();
    const queue = [initialDFAStateSet];

    dfaStatesData.set(initialKey, {
        id: initialKey,
        isAccepting: initialDFAStateSet.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting),
        transitions: new Map()
    });

    let needsTrapState = false;
    while (queue.length > 0) {
        const currentSet = queue.shift();
        const currentKey = mapKey(currentSet);
        const currentStateData = dfaStatesData.get(currentKey);

        for (const symbol of alphabet) {
            const nextNfaStates = new Set();
            for (const stateId of currentSet) {
                nfaMachine.transitions
                    .filter(t => t.from === stateId && t.symbol === symbol)
                    .forEach(t => nextNfaStates.add(t.to));
            }

            const nextSetClosure = computeEpsilonClosure(Array.from(nextNfaStates), nfaMachine.transitions);
            const nextKey = mapKey(nextSetClosure);
            currentStateData.transitions.set(symbol, nextKey);

            if (nextKey === trapStateKey) {
                needsTrapState = true;
            }

            if (!dfaStatesData.has(nextKey)) {
                dfaStatesData.set(nextKey, {
                    id: nextKey,
                    isAccepting: nextSetClosure.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting),
                    transitions: new Map()
                });
                queue.push(nextSetClosure);
            }
        }
    }
    
    const newMachine = {
        type: 'DFA',
        states: [],
        transitions: [],
        alphabet
    };

    if (needsTrapState && !dfaStatesData.has(trapStateKey)) {
        dfaStatesData.set(trapStateKey, {
            id: trapStateKey,
            isAccepting: false,
            transitions: new Map()
        });
    }

    let i = 0;
    for (const [key, data] of dfaStatesData.entries()) {
        newMachine.states.push({
            id: key,
            initial: key === initialKey,
            accepting: data.isAccepting,
            x: 200 + (i % 5) * 180,
            y: 150 + Math.floor(i / 5) * 150
        });
        i++;
    }

    for (const [key, data] of dfaStatesData.entries()) {
        for (const symbol of alphabet) {
            let toState = data.transitions.get(symbol);
            if (!toState) {
                toState = trapStateKey;
            }
            newMachine.transitions.push({
                from: key,
                to: toState,
                symbol: symbol
            });
        }
    }

    return newMachine;
}
    
    function removeUnreachableStates(dfa) {
    const reachable = new Set();
    const initialState = dfa.states.find(s => s.initial);
    if (!initialState) {
        return { ...dfa, states: [], transitions: [] };
    }

    const stack = [initialState.id];
    reachable.add(initialState.id);

    while (stack.length > 0) {
        const currentId = stack.pop();
        dfa.transitions
            .filter(t => t.from === currentId)
            .forEach(t => {
                if (!reachable.has(t.to)) {
                    reachable.add(t.to);
                    stack.push(t.to);
                }
            });
    }

    const reachableStates = dfa.states.filter(s => reachable.has(s.id));
    const reachableTransitions = dfa.transitions.filter(t => reachable.has(t.from));
    
    return { ...dfa, states: reachableStates, transitions: reachableTransitions };
    }
    function minimizeDfa(dfa) {
    const reachableDfa = removeUnreachableStates(dfa);
    
    if (reachableDfa.states.length === 0) {
        return reachableDfa;
    }

    const alph = reachableDfa.alphabet;
    let P = [
        reachableDfa.states.filter(s => s.accepting).map(s => s.id),
        reachableDfa.states.filter(s => !s.accepting).map(s => s.id)
    ].filter(g => g.length > 0);

    let changed = true;
    while (changed) {
        changed = false;
        for (const symbol of alph) {
            const newP = [];
            for (const group of P) {
                if (group.length <= 1) {
                    newP.push(group);
                    continue;
                }
                
                const subgroups = {};
                for (const state of group) {
                    const t = reachableDfa.transitions.find(tr => tr.from === state && tr.symbol === symbol);
                    const destGroupIdx = t ? P.findIndex(g => g.includes(t.to)) : -1;
                    
                    if (!subgroups[destGroupIdx]) {
                        subgroups[destGroupIdx] = [];
                    }
                    subgroups[destGroupIdx].push(state);
                }
                
                const splitGroups = Object.values(subgroups);
                if (splitGroups.length > 1) {
                    changed = true;
                }
                newP.push(...splitGroups);
            }
            P = newP;
            if (changed) break; 
        }
    }

    
    const repMap = {}; 
    P.forEach(group => {
        const rep = group.sort()[0]; 
        group.forEach(s => repMap[s] = rep);
    });
    
    const finalStates = P.map((group, i) => {
        const rep = group.sort()[0];
        const oldState = reachableDfa.states.find(s => s.id === rep);
        const isInitial = reachableDfa.states.some(s => s.initial && group.includes(s.id));
        
        return {
            id: rep,
            initial: isInitial,
            accepting: oldState.accepting,
            x: 200 + (i % 5) * 180,
            y: 150 + Math.floor(i / 5) * 150
        };
    });

    const finalTransitions = reachableDfa.transitions
        .map(t => ({
            from: repMap[t.from],
            to: repMap[t.to],
            symbol: t.symbol
        }))
        .filter((t, i, self) => i === self.findIndex(o => o.from === t.from && o.to === t.to && o.symbol === t.symbol));

    return {
        type: 'DFA',
        alphabet: alph,
        states: finalStates,
        transitions: finalTransitions
    };
    }
      
      // --- UTILITY & HELPER Functions

      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

     function validateAutomaton() {
    const mode = modeSelect.value;
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

    // Mode-specific validations
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
        
        // NEW CODE: Check for DFA completeness
        const alphabet = MACHINE.alphabet;
        for (const st of states) {
            const definedSymbols = new Set(transitions.filter(t => t.from === st.id).map(t => t.symbol));
            // Don't check for completeness if the alphabet isn't defined yet.
            if (alphabet && alphabet.length > 0) {
                 for (const symbol of alphabet) {
                    if (!definedSymbols.has(symbol)) {
                        // Use a warning for incompleteness, as it's not a fatal error for drawing.
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

      // ... (Event listeners and initialization continue in Chunk 4)
      // ... (Continued from Chunk 3)

      // --- EVENT LISTENERS ---

      // Toolbar
      document.querySelectorAll('.toolbar-icon[data-mode]').forEach(tool => {
        tool.addEventListener('click', () => {
          document.querySelectorAll('.toolbar-icon[data-mode]').forEach(t => t.classList.remove('active'));
          tool.classList.add('active');
          CURRENT_MODE = tool.dataset.mode;
          TRANS_FROM = null; SELECTED_STATE = null;
          document.querySelectorAll('.state-circle.state-selected').forEach(c => c.classList.remove('state-selected'));
        });
      });

      // Canvas Click
      svg.addEventListener('click', (e) => {
        if (CURRENT_MODE === 'addclick') {
          const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
          const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
          addState(svgP.x, svgP.y);
        }
      });

      // Modals
      document.getElementById('transCancel').addEventListener('click',
        hideTransModal);
      document.getElementById('transSave').addEventListener('click', () => {
    const from = document.getElementById('transFrom').value;
    const to = document.getElementById('transTo').value;
    let symbol = document.getElementById('transSymbol').value.trim();

    // NEW LOGIC: If user enters more than one character, silently take the first one.
    if (symbol.length > 1) {
        symbol = symbol.charAt(0);
    }

    if (symbol === '') {
        symbol = 'ε';
    }

    if (MACHINE.type === 'DFA' && symbol === 'ε') {
        validationLine.textContent = 'DFA rule: ε-transitions disallowed.';
        validationLine.classList.add('error', 'show');
        setTimeout(() => validationLine.classList.remove('show'), 4000);
        return;
    }

    const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === symbol);
    if (MACHINE.type === 'DFA' && conflict) {
        validationLine.textContent = `DFA rule: State ${from} is already deterministic on '${symbol}'.`;
        validationLine.classList.add('error', 'show');
        setTimeout(() => validationLine.classList.remove('show'), 4000);
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

      // Undo/Redo
      undoBtn.addEventListener('click', doUndo);
      redoBtn.addEventListener('click', doRedo);

      // Mode & Conversion
      modeSelect.addEventListener('change', () => {
        const newMode = modeSelect.value;
        let convertedMachine = null;
        let successMsg = '';

        try {
          // Check initial machine validation status before conversion
          if (!validateAutomaton().startsWith('Valid')) {
            validationLine.textContent = 'Warning: Cannot convert invalid automaton.';
            validationLine.classList.add('error', 'show');
            setTimeout(() => validationLine.classList.remove('show'), 4000);
          }

          if (newMode === 'ENFA_TO_NFA') {
            convertedMachine = convertEnfaToNfa(MACHINE);
            successMsg = 'Converted ε-NFA to NFA.';
          }
          else if (newMode === 'NFA_TO_DFA') {
            convertedMachine = convertNfaToDfa(MACHINE);
            successMsg = 'Converted NFA to DFA.';
          }
          else if (newMode === 'NFA_TO_MIN_DFA') {
            convertedMachine = minimizeDfa(convertNfaToDfa(MACHINE));
            successMsg = 'Converted NFA to Minimal DFA.';
          }
          else if (newMode === 'DFA_TO_MIN_DFA') {
            convertedMachine = minimizeDfa(MACHINE);
            successMsg = 'Minimized DFA.';
          }
        } catch (err) {
          validationLine.textContent = 'Conversion failed: ' + err.message;
          validationLine.classList.add('error', 'show');
          setTimeout(() => validationLine.classList.remove('show'), 4000);
          modeSelect.value = MACHINE.type; // Revert dropdown
          return;
        }
        if (convertedMachine) {
          pushUndo();
          MACHINE = convertedMachine;

          MACHINE.type = 'DFA'; // Most conversions result in DFA
          if (newMode === 'ENFA_TO_NFA') MACHINE.type = 'NFA';

          modeSelect.value = MACHINE.type;
          layoutStatesLine(MACHINE.states);
          validationLine.textContent = successMsg;
          validationLine.classList.add('success', 'show');
          setTimeout(() => validationLine.classList.remove('show'), 4000);
        } else {
          MACHINE.type = newMode;
          renderAll();
        }
      });

      // Smooth "Glider" Move Tool (JFLAP-style)
      (function setupSmoothMoveTool() {
    let dragging = false;
    let currentStateG = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function getPoint(evt) {
        const pt = svg.createSVGPoint();
        if (evt.touches && evt.touches[0]) {
            pt.x = evt.touches[0].clientX;
            pt.y = evt.touches[0].clientY;
        } else {
            pt.x = evt.clientX;
            pt.y = evt.clientY;
        }
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function startDrag(stateG, circle, evt) {
        if (CURRENT_MODE !== 'move' || dragging) return;
        
        const sid = stateG.getAttribute('data-id');
        const sObj = MACHINE.states.find(x => x.id === sid);
        if (!sObj) return;

        pushUndo();
        dragging = true;
        currentStateG = stateG;
        
        const p = getPoint(evt);
        // Calculate the offset from the state's center to the click point
        dragOffsetX = p.x - sObj.x;
        dragOffsetY = p.y - sObj.y;
        
        circle.classList.add('state-selected');
        evt.preventDefault();
        evt.stopPropagation();
    }

    function moveDrag(evt) {
        if (!dragging) return;
        
        const sid = currentStateG.getAttribute('data-id');
        const sObj = MACHINE.states.find(x => x.id === sid);
        if (!sObj) return;

        const p = getPoint(evt);
        
        // INSTANT UPDATE: Set state position directly to the mouse/finger position, accounting for the initial offset.
        const vb = svg.viewBox.baseVal;
        sObj.x = Math.max(vb.x + 40, Math.min(p.x - dragOffsetX, vb.x + vb.width - 40));
        sObj.y = Math.max(vb.y + 40, Math.min(p.y - dragOffsetY, vb.y + vb.height - 40));
        
        renderAll();
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        
        const circle = currentStateG.querySelector('circle.state-circle');
        if (circle) circle.classList.remove('state-selected');
        
        currentStateG = null;
    }

    statesGroup.addEventListener('pointerdown', function (e) {
        const stateG = e.target.closest('g[data-id]');
        if (!stateG) return;
        const circle = stateG.querySelector('circle.state-circle');
        if (!circle) return;
        startDrag(stateG, circle, e);
    });

    svg.addEventListener('pointermove', moveDrag);
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointerleave', endDrag); // Also end drag if mouse leaves canvas
    svg.addEventListener('pointercancel', endDrag);
})();

      // --- OTHER CONTROLS ---

      // Splash Screen
      const splashScreen = document.getElementById('splashScreen');
      const mainApp = document.getElementById('mainApp');

      const hideSplash = () => {
        // 1. Disable the button immediately to prevent double-click issues
        document.querySelectorAll('.splash-nav-btn[data-target="Automata"]').forEach(btn => btn.disabled = true);

        // 2. Start fade-out effect
        splashScreen.style.opacity = '0';

        // 3. Hide the splash screen and show the main app after the CSS transition
        setTimeout(() => {
          splashScreen.style.display = 'none';
          mainApp.style.display = 'block';
          // This function initializes all the lucide icons needed for the app
          lucide.createIcons();
        }, 800);
      };

      // ATTACH CLICK HANDLER
      document.querySelectorAll('.splash-nav-btn[data-target="Automata"]').forEach(btn => {
        // Only attach the handler to the "Finite Automata" button
        if (btn.getAttribute('data-target') === 'Automata') {
          btn.addEventListener('click', hideSplash);
        }
      });

      // REMOVED: No automatic timeout! The user must click the button.

      // Testing panel
      runTestBtn.addEventListener('click', () => runSimulation(testInput.value));
      genRandBtn.addEventListener('click', () => {
        updateAlphabet();
        const alphabet = MACHINE.alphabet.length ? MACHINE.alphabet : ['0', '1'];
        const len = Math.floor(Math.random() * 8) + 3;
        testInput.value = Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      });
      stepNextBtn.addEventListener('click', () => showStep(++simIndex));
      stepPrevBtn.addEventListener('click', () => showStep(--simIndex));
      stepResetBtn.addEventListener('click', () => { simIndex = 0; simSteps = []; clearTimeout(simTimer); document.getElementById('stepLog').innerHTML = ''; testOutput.textContent = 'Ready'; renderAll(); });

      // Practice
      // panel
      genPracticeBtn.addEventListener('click', () => {
        const mode = MACHINE.type; const level = document.getElementById('practiceMode').value;
        const bank = PRACTICE_BANK[mode]?.[level];

        if (!bank || bank.length === 0) { practiceBox.textContent = "No questions available for this mode/level."; return; }
        CURRENT_PRACTICE = bank[Math.floor(Math.random() * bank.length)];

        practiceBox.innerHTML = `<strong>${mode} | ${level}</strong><div style="margin-top:8px">${CURRENT_PRACTICE.q}</div>`;
      });
      // PRACTICE: Show Solution with Animated Step-by-Step Drawing and Log
      showSolBtn.addEventListener('click', async () => {
        if (!CURRENT_PRACTICE || !CURRENT_PRACTICE.machine) {
          validationLine.textContent = 'No practice generated or missing solution data.';
          validationLine.classList.add('error', 'show');
          setTimeout(() => validationLine.classList.remove('show'), 4000);
          return;
        }

        // Display the textual solution
        practiceBox.innerHTML = `<strong>Problem:</strong> ${CURRENT_PRACTICE.q}<br><strong>Solution:</strong><div style="white-space:pre-wrap;">${CURRENT_PRACTICE.sol}</div>`;

        pushUndo();

        const solutionMachine = CURRENT_PRACTICE.machine;
        const preservedType = (MACHINE && MACHINE.type) || (document.getElementById('modeSelect') && document.getElementById('modeSelect').value) || 'DFA';
        const tempMachine = { ...solutionMachine, states: [], transitions: [], type: preservedType }; // Start with empty canvas (preserve type)
        MACHINE = tempMachine;
        renderAll();
        document.getElementById('stepLog').innerHTML = `<div><i data-lucide="zap"></i> **Starting Solution Construction...**</div>`;
        lucide.createIcons(); // Re-render icons after changing log HTML

        // Helper to add log messages
        const addConstructionLog = (message) => {
          const log = document.getElementById('stepLog');
          log.innerHTML = `<div class="new-log"><i data-lucide="edit"></i> ${message}</div>` + log.innerHTML;
          lucide.createIcons();
        };

        // Animate Drawing - States
        for (const state of solutionMachine.states) {
          MACHINE.states.push(state);
          renderAll();

          let message = `**Added state ${state.id}**`;
          if (state.initial) message += " (Set as **Initial**)";
          if (state.accepting) message += " (Set as **Final**)";

          addConstructionLog(message); // LOG MESSAGE APPEARS HERE

          // Animate the newly drawn state
          const stateG = document.querySelector(`[data-id="${state.id}"]`);
          if (stateG) stateG.querySelector('circle')?.classList.add('state-drawing');
          await sleep(2000);
          stateG.querySelector('circle')?.classList.remove('state-drawing');
        }

        // Animate Drawing - Transitions
        let renderedTransitions = new Set();
        for (const transition of solutionMachine.transitions) {
          const arcKey = `${transition.from}->${transition.to}`;

          if (renderedTransitions.has(arcKey)) {
            // If arc is already drawn, just log the additional symbol on it
            addConstructionLog(`Added symbol '${transition.symbol}' to arc ${transition.from} → ${transition.to}`);
            continue;
          }

          MACHINE.transitions.push(transition);
          updateAlphabet();
          renderAll();

          addConstructionLog(`**Drawing transition** from ${transition.from} to ${transition.to} on symbol '${transition.symbol}'`); // LOG MESSAGE APPEARS HERE

          // Animate the newly drawn path
          const pathEl = document.querySelector(`.transition-path[data-from="${transition.from}"][data-to="${transition.to}"]`);
          if (pathEl) {
            pathEl.classList.add('transition-drawing');
          }
          renderedTransitions.add(arcKey);
          await sleep(2000);
        }

        // Final clean-up and update global machine state
        MACHINE = JSON.parse(JSON.stringify(solutionMachine));
        MACHINE.type = (typeof preservedType !== 'undefined') ? preservedType : (MACHINE.type || 'DFA');
        // Ensure exactly one initial state after loading a practice solution
        if (typeof ensureSingleInitial === 'function') { ensureSingleInitial(); }
        addConstructionLog(`**Construction Complete!** Final machine loaded.`);
        renderAll();
      });
      resetPractice.addEventListener('click', () => { CURRENT_PRACTICE = null; practiceBox.textContent = 'No practice generated yet.'; });
      checkAnswerBtn.addEventListener('click', () => {
        if (!CURRENT_PRACTICE) { validationLine.textContent = 'No practice generated yet.'; validationLine.classList.add('error', 'show'); return; }
        const result = validateAutomaton();
        if (result.startsWith('Valid')) {
          validationLine.textContent = `You did it! ${result}`;
          validationLine.classList.add('success', 'show');
        } else {
          validationLine.textContent = `Not fully valid. ${result}`;
          validationLine.classList.add('error', 'show');
        }
        setTimeout(() => validationLine.classList.remove('show'), 6000);
      });

      validateBtn.addEventListener('click', () => {
        const result = validateAutomaton();
        const line = document.getElementById('validationLine');
        line.textContent = result;
        line.classList.remove('success', 'error', 'show');
        line.classList.add(result.startsWith('Valid') ?
          'success' : 'error');
        line.classList.add('show');
        setTimeout(() => line.classList.remove('show'), 6000);
      });

      // File I/O & Export
      saveMachineBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(MACHINE, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "machine.json"; a.click(); URL.revokeObjectURL(a.href);
      });
      loadMachineBtn.addEventListener('click', () => loadFileInput.click());
      loadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.states && data.transitions) {
              pushUndo(); MACHINE =
                data; if (!MACHINE.type) MACHINE.type = 'DFA'; renderAll();
            } else {
              validationLine.textContent = "Invalid machine file format.";
              validationLine.classList.add('error', 'show');
            }
          } catch (err) {
            validationLine.textContent = "Invalid JSON file: " + err.message;
            validationLine.classList.add('error', 'show');
          }
        };
        reader.readAsText(file);
      });

      // PNG Export:
exportBtn.addEventListener('click', () => {
    const svgEl = document.getElementById("dfaSVG");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // --- NEW: Logic to embed all CSS styles ---
    const cssStyles = `
        .state-circle { fill: #fff; stroke: #667eea; stroke-width: 3; }
        .state-label { font-weight: 700; fill: #0b1220; text-anchor: middle; dominant-baseline: central; font-size: 14px; }
        .transition-path { fill: none; stroke: #667eea; stroke-width: 2; marker-end: url(#arrowhead-export); }
        .transition-label { font-weight: 700; fill: #0b1220; text-anchor: middle; font-size: 13px; }
        .initial-arrow { stroke: black !important; stroke-width: 3 !important; marker-end: url(#arrowhead-export); }
        .final-ring { fill: none; stroke: #ff9800; stroke-width: 4; }
    `;

    // Create a clone of the SVG to avoid modifying the live one
    const svgClone = svgEl.cloneNode(true);
    
    // Create a style element and add the CSS rules to it
    const styleEl = document.createElement('style');
    styleEl.textContent = cssStyles;
    
    // Add the style element to the SVG's definitions
    svgClone.querySelector('defs').appendChild(styleEl);

    svgClone.querySelector('#arrowhead').setAttribute('fill', '#667eea');
    svgClone.querySelector('#arrowhead-export').setAttribute('fill', '#667eea');


    const svgData = new XMLSerializer().serializeToString(svgClone); // Serialize the MODIFIED clone
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        canvas.width = svgEl.viewBox.baseVal.width;
        canvas.height = svgEl.viewBox.baseVal.height;

        ctx.fillStyle = 'white'; // Set a white background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const a = document.createElement("a");
        a.download = "automaton.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.onerror = () => {
        console.error("Image loading failed. The SVG might be tainted.");
        URL.revokeObjectURL(url);
    };

    img.src = url;
});

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

      // --- INITIALIZATION ---
      document.querySelector('[data-mode="addclick"]').classList.add('active');
      renderAll();
      updateUndoRedoButtons();
      setZoom(100);
    });
  


(function(){
  // Ensure lucide icons render
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

  // Helper: select elements
  const genPracticeBtn = document.getElementById('genPracticeBtn');
  const showSolBtn = document.getElementById('showSolBtn');
  const practiceBox = document.getElementById('practiceBox');
  const modeSelect = document.getElementById('modeSelect');
  const manualButtons = document.getElementById('manualButtons');
  const runTestBtn = document.getElementById('runTestBtn');
  const testInput = document.getElementById('testInput');
  const testOutput = document.getElementById('testOutput');
  const exportBtn = document.getElementById('exportPngBtn');

  // Hide manual controls (user requested no manual control buttons).
  if (manualButtons) manualButtons.style.display = 'none';

  // --- PRACTICE: robust generator and show-solution behavior ---
  // Keep CURRENT_PRACTICE in closure
  let CURRENT_PRACTICE_LOCAL = null;

  function showPractice(item){
    if(!item){
      practiceBox.innerHTML = '<em>No practice available.</em>';
      return;
    }
    CURRENT_PRACTICE_LOCAL = item;
    // show question only
    practiceBox.innerHTML = '<div style="font-weight:700;margin-bottom:8px">Task:</div>' +
      '<div style="white-space:pre-wrap;">' + item.q + '</div>' +
      '<div style="margin-top:10px;color:#475569;font-size:0.95rem">Tip: click "Show Solution" to reveal the model.</div>';
  }

  genPracticeBtn.addEventListener('click', () => {
    try {
      const category = 'DFA';
      const chosenMode = document.getElementById('practiceMode')?.value || 'basic';
      const bank = window.PRACTICE_BANK && window.PRACTICE_BANK[category] && window.PRACTICE_BANK[category][chosenMode];
      if(!bank || !bank.length){
        practiceBox.innerHTML = '<em>No practice questions in this category/mode.</em>';
        CURRENT_PRACTICE_LOCAL = null;
        return;
      }
      const item = bank[Math.floor(Math.random()*bank.length)];
      showPractice(item);
    } catch(e){
      console.error('Practice generation error', e);
      practiceBox.innerHTML = '<em>Error generating practice.</em>';
      CURRENT_PRACTICE_LOCAL = null;
    }
  });

  showSolBtn.addEventListener('click', () => {
    if(!CURRENT_PRACTICE_LOCAL){
      practiceBox.innerHTML = '<em>No practice selected. Click Generate first.</em>';
      return;
    }
    // show solution text and, if available, render machine preview inline JSON for clarity
    const sol = CURRENT_PRACTICE_LOCAL.sol || 'No textual solution provided.';
    const machine = CURRENT_PRACTICE_LOCAL.machine ? ('<pre style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #eef2ff;overflow:auto;font-size:0.85rem;">' + JSON.stringify(CURRENT_PRACTICE_LOCAL.machine, null, 2) + '</pre>') : '';
    practiceBox.innerHTML = '<div style="font-weight:700;margin-bottom:8px">Solution:</div>' +
      '<div style="white-space:pre-wrap;">' + sol + '</div>' + machine +
      '<div style="margin-top:8px;color:#374151;font-size:0.9rem;">You can generate another practice anytime using Generate.</div>';
  });

  // --- Simulation: fixed step delay 2.5s (2500ms) default ---
  const STEP_DELAY_MS = 2500;
  // If there's already a simple simulation function on the page, try to hook or wrap it.
  // We'll provide a fallback simple simulator that just steps through characters and prints step info.
  function simpleSimulateAndAnimate(inputStr){
    if(!inputStr || inputStr.length === 0){
      testOutput.textContent = 'Result: (empty string)';
      return;
    }
    testOutput.textContent = 'Running simulation...';
    // Clear any previously running timers
    if(window._simTimers && window._simTimers.length){
      window._simTimers.forEach(t => clearTimeout(t));
    }
    window._simTimers = [];
    for(let i=0;i<=inputStr.length;i++){
      const idx = i;
      const t = setTimeout(()=> {
        testOutput.textContent = `Step ${idx}/${inputStr.length}: processed ${inputStr.slice(0, idx)}`;
        // At final step show accept/reject placeholder
        if(idx === inputStr.length){
          // placeholder: check if any accepting state exists in MACHINE
          try {
            const M = window.MACHINE || {states:[]};
            const hasAccept = (M.states || []).some(s => s.accepting);
            testOutput.textContent = `Simulation complete. Acceptance possible?: ${hasAccept ? 'Yes (accepting states exist)' : 'Unknown (no machine or no accepting states)'}`;
          } catch(e){
            testOutput.textContent = 'Simulation complete.';
          }
        }
      }, STEP_DELAY_MS * idx);
      window._simTimers.push(t);
    }
  }

  runTestBtn.addEventListener('click', () => {
    const s = testInput.value || '';
    simpleSimulateAndAnimate(s);
  });

  // --- Autosave and Load from localStorage for the canvas/machine ---
  const STORAGE_KEY = 'automata_canvas_autosave_v1';

  function saveMachineToLocal(mach){
    try {
      const toSave = mach || window.MACHINE || null;
      if(!toSave) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      // small visual log
      const stepLog = document.getElementById('stepLog');
      if(stepLog){
        const d = document.createElement('div');
        d.className = 'new-log';
        d.textContent = 'Autosaved at ' + new Date().toLocaleTimeString();
        stepLog.insertBefore(d, stepLog.firstChild);
      }
    } catch(e){
      console.warn('Autosave failed', e);
    }
  }

  function loadMachineFromLocal(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      // Basic validation
      if(parsed && parsed.states){
        window.MACHINE = parsed;
        // try to render states if drawState exists
        if(typeof window.clearCanvas === 'function') window.clearCanvas();
        if(typeof window.drawAll === 'function') window.drawAll();
        else {
          // naive rendering: clear states group and draw simple circles
          const statesGroup = document.getElementById('states');
          if(statesGroup){
            while(statesGroup.firstChild) statesGroup.removeChild(statesGroup.firstChild);
            (window.MACHINE.states || []).forEach(s => {
              const g = document.createElementNS("http://www.w3.org/2000/svg","g");
              const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
              c.setAttribute('class','state-circle');
              c.setAttribute('cx', s.x || 120);
              c.setAttribute('cy', s.y || 120);
              c.setAttribute('r', 36);
              g.appendChild(c);
              const t = document.createElementNS("http://www.w3.org/2000/svg","text");
              t.setAttribute('class','state-label');
              t.setAttribute('x', s.x || 120);
              t.setAttribute('y', s.y || 120);
              t.textContent = s.id || 'q';
              statesGroup.appendChild(g);
            });
          }
        }
        const stepLog = document.getElementById('stepLog');
        if(stepLog){
          const d = document.createElement('div');
          d.className = 'new-log';
          d.textContent = 'Loaded autosave from localStorage (' + (window.MACHINE.states||[]).length + ' states)';
          stepLog.insertBefore(d, stepLog.firstChild);
        }
        return parsed;
      }
    } catch(e){
      console.warn('Load autosave failed', e);
    }
    return null;
  }

  // Hook: whenever MACHINE is mutated by known UI actions, call saveMachineToLocal(MACHINE).
  // We cannot detect all mutations automatically without proxies, but we'll provide a public helper.
  window.saveMachineToLocal = saveMachineToLocal;
  window.loadMachineFromLocal = loadMachineFromLocal;

  // Try loading immediately
  //setTimeout(()=> {
   // try { loadMachineFromLocal(); } catch(e) { /*ignore*/ }
 // }, 300);

  // If there is a save button and it calls download, keep it; but autosave will still run.
  // Expose a small helper used by other UI to call autosave after modifications
  window._autosaveAfterChange = function(){
    if(window.MACHINE) saveMachineToLocal(window.MACHINE);
  };


  function exportSvgAsPng(svgEl, filename='automaton.png') {
    try {
      const serializer = new XMLSerializer();
      const clone = svgEl.cloneNode(true);
      let styleText = '';
      const docStyles = document.querySelectorAll('head style, head link[rel="stylesheet"]');
      docStyles.forEach(node => {
        if(node.tagName.toLowerCase() === 'style') styleText += node.innerHTML + '\n';
      });
      if(styleText.trim()){
        const styleElem = document.createElementNS("http://www.w3.org/2000/svg",'style');
        styleElem.textContent = styleText;
        clone.insertBefore(styleElem, clone.firstChild);
      }
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      const bbox = svgEl.getBoundingClientRect();
      clone.setAttribute('width', Math.ceil(bbox.width));
      clone.setAttribute('height', Math.ceil(bbox.height));
      const svgStr = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = function(){
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(bbox.width);
          canvas.height = Math.ceil(bbox.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch(e){
          console.error('Export failed (canvas draw)', e);
          URL.revokeObjectURL(url);
          alert('Export failed: ' + e.message);
        }
      };
      img.onerror = function(ev){
        URL.revokeObjectURL(url);
        console.error('Image load error', ev);
        alert('Failed to convert SVG to PNG.');
      };
      img.src = url;
    } catch(e){
      console.error('exportSvgAsPng error', e);
      alert('Export failed: ' + e.message);
    }
  }

  if(exportBtn){
    exportBtn.addEventListener('click', ()=> {
      const svg = document.getElementById('dfaSVG');
      if(!svg){ alert('SVG canvas not found'); return; }
      exportSvgAsPng(svg, 'automaton.png');
    });
  }

  const svgWrapper = document.getElementById('svgWrapper');
  if(svgWrapper){
    svgWrapper.addEventListener('click', function(e){
      // Heuristic: call autosave shortly after click in case it caused a change.
      setTimeout(()=> { if(window._autosaveAfterChange) window._autosaveAfterChange(); }, 400);
    });
  }

  // Also hook global MACHINE mutations via simple interval diff (best-effort).
  (function watchMachine(){
    let last = null;
    setInterval(()=>{
      try {
        const cur = JSON.stringify(window.MACHINE || {});
        if(last === null) last = cur;
        else if(cur !== last){
          last = cur;
          saveMachineToLocal(window.MACHINE);
        }
      } catch(e){}
    }, 1500);
  })();

})();


function ensureSingleInitial() {
    try {
        if (!window.MACHINE || !Array.isArray(window.MACHINE.states)) return;

        const states = window.MACHINE.states;
        const initialIdxs = states.map((s, i) => s.initial ? i : -1).filter(i => i >= 0);

        if (initialIdxs.length === 0) {
            // If none marked initial, make the first state initial (if any states exist)
            if (states.length > 0) {
                states[0].initial = true;
                markStateInitialInDOM(states[0].id);
                showValidationMessage('No initial state found - auto-setting first state as initial.', 'success');
            }
        } else if (initialIdxs.length > 1) {
            const keepIdx = initialIdxs[0];
            states.forEach((s, idx) => {
                s.initial = (idx === keepIdx);
            });
            // Update DOM
            states.forEach(s => markStateInitialInDOM(s.id));
            showValidationMessage('Multiple initial states found - reduced to a single initial state.', 'error');
        } else {
            // Exactly one - ensure DOM is consistent
            states.forEach(s => markStateInitialInDOM(s.id));
        }
    } catch (e) {
        console.error('ensureSingleInitial failed:', e);
    }
}

function markStateInitialInDOM(stateId) {
  try {
    // remove existing initial arrows/markers
    const svg = document.getElementById('dfaSVG');
    if (!svg) return;
    // For this app the initial arrow might be represented as a path with id 'initial-<stateId>' or class 'initial-arrow'
    // We'll remove any duplicates and then re-add for the single initial state.
    // Remove all existing initial-arrow markers in edges group
    const edgesGroup = document.getElementById('edges');
    if (edgesGroup) {
      const existing = edgesGroup.querySelectorAll('.initial-arrow-marker');
      existing.forEach(el => el.remove());
    }
    // Remove 'data-initial' attribute/class from state circles
    const stateEls = svg.querySelectorAll('[data-state-id]');
    stateEls.forEach(el => {
      el.removeAttribute('data-initial');
      el.classList.remove('state-initial');
    });
    // Find the element for stateId and mark it
    const target = svg.querySelector(`[data-state-id="${stateId}"]`);
    if (target) {
      target.setAttribute('data-initial', 'true');
      target.classList.add('state-initial');
      // Add a simple arrow marker visually near the state (non-invasive)
      const bbox = target.getBBox ? target.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arrow.setAttribute('d', `M ${bbox.x-30} ${bbox.y + bbox.height/2} L ${bbox.x-6} ${bbox.y + bbox.height/2}`);
      arrow.setAttribute('stroke', 'black');
      arrow.setAttribute('stroke-width', '3');
      arrow.setAttribute('marker-end', 'url(#arrowhead)');
      arrow.setAttribute('class', 'initial-arrow-marker');
      if (edgesGroup) edgesGroup.appendChild(arrow);
    }
  } catch (e) {
    // best-effort only
    console.warn("markStateInitialInDOM warning:", e);
  }
}

// Helper to show message in validationLine if present
function showValidationMessage(text, type) {
  try {
    const validationLine = document.getElementById('validationLine');
    if (!validationLine) return;
    validationLine.textContent = text;
    validationLine.className = 'validation-box show ' + (type === 'success' ? 'success' : 'error');
    setTimeout(()=> { validationLine.className = 'validation-box'; }, 3500);
  } catch (e) {}
}

// Hook onto events where machine may change: mode change, load, and propSave click.
// modeSelect change
try {
  const modeSel = document.getElementById('modeSelect');
  if (modeSel) {
    modeSel.addEventListener('change', () => { setTimeout(ensureSingleInitial, 50); });
  }
} catch(e){}

// propSave click - wait for element and attach
function attachPropSaveHook() {
  const propSave = document.getElementById('propSave');
  if (propSave) {
    propSave.addEventListener('click', () => {
      // small delay to allow existing handlers to update MACHINE
      setTimeout(ensureSingleInitial, 50);
    });
    return true;
  }
  return false;
}
if (!attachPropSaveHook()) {
  // try again after DOM ready
  document.addEventListener('DOMContentLoaded', () => { attachPropSaveHook(); setTimeout(ensureSingleInitial, 100); });
}

// loadMachineBtn handler - try to hook to existing load logic by listening to file input changes
try {
  const loadFileInput = document.getElementById('loadFileInput');
  if (loadFileInput) {
    loadFileInput.addEventListener('change', () => { setTimeout(ensureSingleInitial, 150); });
  }
} catch(e){}

// Expose for manual invocation/debugging
window.ensureSingleInitial = ensureSingleInitial;
window.enforceInitialsForExternalUse = ensureSingleInitial;

/* --- END: Enforce exactly ONE initial state across all modes --- */



// ADDITIONAL ENHANCEMENTS FOR INITIAL STATE VALIDATION

// Enhanced state property save handler with strict initial state enforcement
function setupStatePropertyHandlers() {
    const propSave = document.getElementById('propSave');
    if (propSave && !propSave.hasAttribute('data-enhanced')) {
        propSave.setAttribute('data-enhanced', 'true');

        const originalHandler = propSave.onclick;
        propSave.onclick = function(e) {
            const modal = document.getElementById('statePropsModal');
            const stateId = modal.dataset.stateId;
            const s = MACHINE.states.find(st => st.id === stateId);

            if (s) {
                pushUndo();

                const isInitial = document.getElementById('propInitial').checked;

                if (isInitial) {
                    // FIXED: For all automaton types, ensure only this state is initial
                    MACHINE.states.forEach(x => x.initial = false);
                }

                s.initial = isInitial;
                s.accepting = document.getElementById('propFinal').checked;

                // FIXED: Always enforce the single initial state rule
                enforceInitialStateRule();
                renderAll();

                // Validate after changes
                const validation = validateAutomaton();
                showValidationMessage(validation, validation.startsWith('Valid') ? 'success' : 'error');
            }

            modal.style.display = 'none';
        };
    }
}

// Enhanced add state function with proper initial state logic
function enhanceAddState() {
    // Store reference to original addState if it exists
    if (typeof window.originalAddState === 'undefined' && typeof addState === 'function') {
        window.originalAddState = addState;

        // Override addState
        window.addState = function(x, y) {
            pushUndo();
            const newId = `q${MACHINE.states.length}`;

            // FIXED: If this is the first state, make it initial. Otherwise, don't.
            const isFirstState = MACHINE.states.length === 0;

            MACHINE.states.push({
                id: newId,
                x: x,
                y: y,
                initial: isFirstState,
                accepting: false
            });

            // Always enforce single initial state rule after adding
            enforceInitialStateRule();
            renderAll();

            // Validate after adding state
            const validation = validateAutomaton();
            if (!validation.startsWith('Valid')) {
                showValidationMessage(validation, 'error');
            }
        };
    }
}

// Enhanced delete state function with proper initial state handling
function enhanceDeleteState() {
    if (typeof window.originalDeleteState === 'undefined' && typeof deleteState === 'function') {
        window.originalDeleteState = deleteState;

        window.deleteState = function(stateId) {
            pushUndo();

            const stateToDelete = MACHINE.states.find(s => s.id === stateId);
            const wasInitial = stateToDelete && stateToDelete.initial;

            // Remove the state
            MACHINE.states = MACHINE.states.filter(s => s.id !== stateId);

            // Remove all transitions involving this state
            MACHINE.transitions = MACHINE.transitions.filter(t => t.from !== stateId && t.to !== stateId);

            // FIXED: If we deleted the initial state and there are still states, make the first one initial
            if (wasInitial && MACHINE.states.length > 0) {
                MACHINE.states[0].initial = true;
            }

            // Always enforce the rule
            enforceInitialStateRule();
            renderAll();

            // Validate after deletion
            const validation = validateAutomaton();
            if (!validation.startsWith('Valid')) {
                showValidationMessage(validation, 'error');
            }
        };
    }
}

// Comprehensive validation hook that runs after any machine modification
function validateAndFixMachine() {
    try {
        // Step 1: Enforce exactly 1 initial state
        enforceInitialStateRule();

        // Step 2: Validate the current machine
        const validation = validateAutomaton();

        // Step 3: Update UI validation indicator if it exists
        const validationLine = document.getElementById('validationLine') || 
                              document.querySelector('.validation-box');
        if (validationLine) {
            validationLine.textContent = validation;
            validationLine.className = 'validation-box show ' + (validation.startsWith('Valid') ? 'success' : 'error');

            // Auto-hide after a few seconds
            setTimeout(() => {
                validationLine.classList.remove('show');
            }, 4000);
        }

        return validation.startsWith('Valid');
    } catch (e) {
        console.error('Machine validation failed:', e);
        return false;
    }
}

// Enhanced mode switching with proper validation
function enhanceModeSwitch() {
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect && !modeSelect.hasAttribute('data-enhanced')) {
        modeSelect.setAttribute('data-enhanced', 'true');

        modeSelect.addEventListener('change', function() {
            const newMode = this.value;
            if (MACHINE) {
                MACHINE.type = newMode;

                // Enforce initial state rules for the new mode
                enforceInitialStateRule();

                // Validate the machine in the new mode
                const validationResult = validateAutomaton();

                if (!validationResult.startsWith('Valid')) {
                    showValidationMessage(`Mode switched to ${newMode}. ${validationResult}`, 'error');
                } else {
                    showValidationMessage(`Successfully switched to ${newMode} mode.`, 'success');
                }

                renderAll();
            }
        });
    }
}

// Initialize all enhancements when DOM is ready
function initializeEnhancements() {
    try {
        setupStatePropertyHandlers();
        enhanceAddState();
        enhanceDeleteState();
        enhanceModeSwitch();

        // Run initial validation
        if (MACHINE && MACHINE.states) {
            setTimeout(() => {
                enforceInitialStateRule();
                validateAndFixMachine();
            }, 100);
        }

        console.log('✓ Initial state validation enhancements initialized');
    } catch (e) {
        console.error('Failed to initialize enhancements:', e);
    }
}

// Auto-initialize when DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    // DOM already loaded
    setTimeout(initializeEnhancements, 100);
}

// ================================
// COMPREHENSIVE ENHANCEMENTS
// ================================

// === Global configuration ===
const DEF_STEP_DELAY_MS = 2000; // Default 2-second delay for animations

// === Five-tuple logging utilities ===
function _ftAlphabet() {
    const set = new Set();
    (window.MACHINE?.transitions || []).forEach(t => {
        const sym = t.symbol;
        if (sym && sym !== 'ε' && sym !== 'EPSILON') set.add(sym);
    });
    return Array.from(set).sort();
}

function _ftInitial() {
    return (window.MACHINE?.states || []).find(s => s.initial)?.id || null;
}

function _ftFinals() {
    return (window.MACHINE?.states || []).filter(s => s.accepting).map(s => s.id);
}

function _ftStates() {
    return (window.MACHINE?.states || []).map(s => s.id);
}

function _ftGroupedDelta() {
    const groups = {};
    (window.MACHINE?.transitions || []).forEach(t => {
        const key = `${t.from} --${t.symbol ?? 'ε'}--> ${t.to}`;
        groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([k, count]) => ({ k, count }));
}

function _formatFiveTupleBlock() {
    const Q = _ftStates();
    const Sigma = _ftAlphabet();
    const q0 = _ftInitial();
    const F = _ftFinals();
    const deltaSize = (window.MACHINE?.transitions || []).length;
    return {
        head: `⟨Q, Σ, δ, q0, F⟩`,
        lines: [
            `Type: ${window.MACHINE?.type || 'DFA'}`,
            `|Q|=${Q.length} ; Q={ ${Q.join(', ')} }`,
            `|Σ|=${Sigma.length} ; Σ={ ${Sigma.join(', ')} }`,
            `q0=${q0 ?? 'none'}`,
            `|F|=${F.length} ; F={ ${F.join(', ')} }`,
            `|δ|=${deltaSize}`
        ],
        delta: _ftGroupedDelta()
    };
}

let lastFiveTupleSnapshot = '';
function autoLogFiveTupleToStepLog() {
    const log = document.getElementById('stepLog');
    if (!log) return;

    const blk = _formatFiveTupleBlock();
    const snapshot = JSON.stringify(blk);

    // Avoid duplicate logs
    if (snapshot === lastFiveTupleSnapshot) return;
    lastFiveTupleSnapshot = snapshot;

    const el = document.createElement('div');
    el.className = 'new-log';
    el.innerHTML = `
        <i data-lucide="clipboard-list"></i>
        <div style="display:flex;flex-direction:column;gap:6px">
            <div><strong>${blk.head}</strong></div>
            <pre style="margin:0;white-space:pre-wrap;font-size:0.85em">${blk.lines.join('\n')}</pre>
            <div><strong>δ (grouped)</strong></div>
            <pre style="margin:0;white-space:pre-wrap;font-size:0.85em">${
                blk.delta.length
                    ? blk.delta.map(r => `${r.k}${r.count>1?`  ×${r.count}`:''}`).join('\n')
                    : '(no transitions)'
            }</pre>
        </div>
    `;


    log.insertBefore(el, log.firstChild);
    if (window.lucide?.createIcons) window.lucide.createIcons({ nodes: [el] });
}

// === Enhanced mode management ===
function setAppMode(newMode) {
    // Update dropdown
    const sel = document.getElementById('modeSelect');
    if (sel && sel.value !== newMode) sel.value = newMode;

    // Update MACHINE.type only for base modes
    if (window.MACHINE) {
        if (newMode === 'DFA' || newMode === 'NFA' || newMode === 'ENFA') {
            window.MACHINE.type = newMode;
        }
    }

    // UI label
    const label = document.getElementById('modeLabel');
    if (label) label.textContent = getModeLabel();

    // Reset transient selections
    window.TRANSFROM = null;
    window.SELECTEDSTATE = null;

    // Toolbar icon highlight
    document.querySelectorAll('.toolbar-icon[data-mode]').forEach(t => t.classList.remove('active'));

    // Auto-validate and refresh
    setTimeout(() => {
        validateMachineWithoutAlert();
        renderAll();
        updateUndoRedoButtons();
    }, 10);
}

// === Enhanced validation without alerts ===
function validateMachineWithoutAlert() {
    const validationLine = document.getElementById('validationLine');
    if (!validationLine) return true;

    if (!window.MACHINE || !Array.isArray(window.MACHINE.states)) {
        setValidationMessage('No machine defined', 'error');
        return false;
    }

    const states = window.MACHINE.states;
    const transitions = window.MACHINE.transitions || [];
    const type = window.MACHINE.type || 'DFA';

    // Check for states
    if (states.length === 0) {
        setValidationMessage('Machine needs at least one state', 'error');
        return false;
    }

    // Check for initial state
    const initialStates = states.filter(s => s.initial);
    if (initialStates.length === 0) {
        setValidationMessage('Machine needs exactly one initial state', 'error');
        return false;
    }
    if (initialStates.length > 1 && type === 'DFA') {
        setValidationMessage('DFA can have only one initial state', 'error');
        return false;
    }

    // Check for final states
    const finalStates = states.filter(s => s.accepting);
    if (finalStates.length === 0) {
        setValidationMessage('Machine should have at least one accepting state', 'warning');
    }

    // Get alphabet
    const alphabet = new Set();
    transitions.forEach(t => {
        if (t.symbol && t.symbol !== 'ε' && t.symbol !== 'EPSILON') {
            alphabet.add(t.symbol);
        }
    });

    // Mode-specific validation
    if (type === 'DFA') {
        // DFA: each state must have exactly one outgoing transition per symbol
        const stateSymbolMap = new Map();

        for (const state of states) {
            stateSymbolMap.set(state.id, new Set());
        }

        for (const t of transitions) {
            if (t.symbol && t.symbol !== 'ε' && t.symbol !== 'EPSILON') {
                const stateSymbols = stateSymbolMap.get(t.from) || new Set();
                if (stateSymbols.has(t.symbol)) {
                    setValidationMessage(`DFA: State ${t.from} has multiple transitions for symbol '${t.symbol}'`, 'error');
                    return false;
                }
                stateSymbols.add(t.symbol);
                stateSymbolMap.set(t.from, stateSymbols);
            }
        }

        // Check completeness (optional - warn if incomplete)
        for (const state of states) {
            const stateSymbols = stateSymbolMap.get(state.id) || new Set();
            const missing = Array.from(alphabet).filter(sym => !stateSymbols.has(sym));
            if (missing.length > 0) {
                setValidationMessage(`DFA incomplete: State ${state.id} missing transitions for: ${missing.join(', ')}`, 'warning');
                break;
            }
        }
    }

    // Success
    setValidationMessage(`Valid ${type} with ${states.length} states, ${transitions.length} transitions`, 'success');
    return true;
}

function setValidationMessage(message, type = 'info') {
    const validationLine = document.getElementById('validationLine');
    if (!validationLine) return;

    validationLine.textContent = message;
    validationLine.className = `validation-box show ${type}`;

    setTimeout(() => {
        validationLine.classList.remove('show');
    }, type === 'error' ? 5000 : 3000);
}

// === Quick evaluation for bulk testing and practice validation ===
function quickEvaluate(inputString, machine = null) {
    const m = machine || window.MACHINE;
    if (!m || !Array.isArray(m.states) || m.states.length === 0) return false;

    // Epsilon closure for NFA/ε-NFA
    const epsilonClosure = (stateSet) => {
        const closure = new Set(stateSet);
        const stack = [...stateSet];

        while (stack.length > 0) {
            const state = stack.pop();
            const epsilonTransitions = (m.transitions || []).filter(t => 
                t.from === state && (!t.symbol || t.symbol === 'ε' || t.symbol === 'EPSILON')
            );

            for (const t of epsilonTransitions) {
                if (!closure.has(t.to)) {
                    closure.add(t.to);
                    stack.push(t.to);
                }
            }
        }

        return Array.from(closure);
    };

    // Get initial states
    let currentStates = m.states.filter(s => s.initial).map(s => s.id);
    if (currentStates.length === 0) return false;

    // Apply epsilon closure for ε-NFA
    if (m.type === 'ENFA') {
        currentStates = epsilonClosure(currentStates);
    }

    // Process each symbol
    for (const symbol of inputString) {
        const nextStates = new Set();

        for (const state of currentStates) {
            const transitions = (m.transitions || []).filter(t => 
                t.from === state && t.symbol === symbol
            );

            for (const t of transitions) {
                nextStates.add(t.to);
            }
        }

        currentStates = Array.from(nextStates);

        // Apply epsilon closure for ε-NFA
        if (m.type === 'ENFA' && currentStates.length > 0) {
            currentStates = epsilonClosure(currentStates);
        }

        // If no states reachable, reject
        if (currentStates.length === 0) {
            return false;
        }
    }

    // Check if any current state is accepting
    return currentStates.some(stateId => 
        m.states.find(s => s.id === stateId && s.accepting)
    );
}

// === Enhanced practice validation ===
function validatePracticeAnswer() {
    if (!window.PRACTICE_SOLUTION || !window.MACHINE) {
        setValidationMessage('No practice problem or solution available', 'error');
        return;
    }

    const userMachine = window.MACHINE;
    const correctMachine = window.PRACTICE_SOLUTION;

    // Generate test strings to compare machines
    const testStrings = generateTestStrings();
    let correct = true;
    let differences = [];

    for (const testStr of testStrings) {
        const userResult = quickEvaluate(testStr, userMachine);
        const correctResult = quickEvaluate(testStr, correctMachine);

        if (userResult !== correctResult) {
            correct = false;
            differences.push(`"${testStr}": your machine ${userResult ? 'accepts' : 'rejects'}, correct machine ${correctResult ? 'accepts' : 'rejects'}`);
            if (differences.length >= 3) break; // Limit examples
        }
    }

    if (correct) {
        setValidationMessage('Correct! Your solution matches the expected behavior.', 'success');
        logToStepLog('✓ Practice solution validated successfully', 'success');
    } else {
        setValidationMessage(`Incorrect solution. Differences found: ${differences[0]}`, 'error');
        logToStepLog(`✗ Practice solution incorrect. Examples: ${differences.slice(0,2).join('; ')}`, 'error');
    }
}

function generateTestStrings() {
    // Generate a variety of test strings
    const strings = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aaa', 'aab', 'aba', 'abb', 'baa', 'bab', 'bba', 'bbb'];

    // Add some longer strings
    for (let i = 0; i < 5; i++) {
        let str = '';
        for (let j = 0; j < 4 + Math.floor(Math.random() * 4); j++) {
            str += Math.random() < 0.5 ? 'a' : 'b';
        }
        strings.push(str);
    }

    return strings;
}

function logToStepLog(message, type = 'info') {
    const log = document.getElementById('stepLog');
    if (!log) return;

    const el = document.createElement('div');
    el.className = 'new-log';
    el.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
        <div>${message}</div>
    `;

    log.insertBefore(el, log.firstChild);
    if (window.lucide?.createIcons) window.lucide.createIcons();
}

// === Override alert function ===
window.alert = function(message) {
    setValidationMessage(message, 'info');
};

// === Initialize bulk testing ===
function initializeBulkTesting() {
    const bulkBtn = document.getElementById('bulkRunBtn');
    const bulkInput = document.getElementById('bulkTestInput');
    const bulkOutput = document.getElementById('bulkTestOutput');

    if (!bulkBtn || !bulkInput || !bulkOutput) return;

    bulkBtn.addEventListener('click', () => {
        if (!window.MACHINE || !Array.isArray(window.MACHINE.states)) {
            bulkOutput.textContent = 'Error: No valid machine defined';
            return;
        }

        const lines = bulkInput.value
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (lines.length === 0) {
            bulkOutput.textContent = 'No test strings provided';
            return;
        }

        const results = lines.map(testString => {
            try {
                const accepted = quickEvaluate(testString);
                return `${testString.padEnd(15)} → ${accepted ? 'ACCEPT' : 'REJECT'}`;
            } catch (error) {
                return `${testString.padEnd(15)} → ERROR`;
            }
        });

        bulkOutput.textContent = `Results (${lines.length} strings):\n` + 
            '═'.repeat(30) + '\n' +
            results.join('\n');

        // Log to step log
        logToStepLog(`Bulk test completed: ${lines.length} strings tested`, 'info');
    });
}

// === Enhanced renderAll with auto-logging ===
const originalRenderAll = window.renderAll;
window.renderAll = function() {
    if (originalRenderAll) {
        originalRenderAll.apply(this, arguments);
    }

    // Auto-log five-tuple after each render
    try {
        autoLogFiveTupleToStepLog();
    } catch (e) {
        console.warn('Error auto-logging five-tuple:', e);
    }

    // Auto-validate
    try {
        validateMachineWithoutAlert();
    } catch (e) {
        console.warn('Error in auto-validation:', e);
    }
};

// === Initialize enhancements ===
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the original script to initialize
    setTimeout(() => {
        initializeBulkTesting();

        const checkAnswerBtn = document.getElementById('checkAnswerBtn');
        if (checkAnswerBtn) {
            // Remove existing listeners and add new one
            checkAnswerBtn.replaceWith(checkAnswerBtn.cloneNode(true));
            const newCheckAnswerBtn = document.getElementById('checkAnswerBtn');
            if (newCheckAnswerBtn) {
                newCheckAnswerBtn.addEventListener('click', validatePracticeAnswer);
            }
        }

        // Enhanced mode switching
        const modeSelect = document.getElementById('modeSelect');
        if (modeSelect) {
            modeSelect.addEventListener('change', function() {
                setAppMode(this.value);
            });
        }

        console.log('Enhanced FA Studio initialized');
    }, 100);
});
