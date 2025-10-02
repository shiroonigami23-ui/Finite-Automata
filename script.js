document.addEventListener("DOMContentLoaded", () => {
// MAIN APPLICATION SCRIPT
const svg = document.getElementById('dfaSVG');
const statesGroup = document.getElementById('states');
const edgesGroup = document.getElementById('edges');
const testOutput = document.getElementById('testOutput');
const testInput = document.getElementById('testInput');
const practiceBox = document.getElementById('practiceBox');
const genPracticeBtn = document.getElementById('genPracticeBtn');
const showSolBtn = document.getElementById('showSolBtn');
const resetPractice = document.getElementById('resetPractice');
const checkAnswerBtn = document.getElementById('checkAnswerBtn');
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

// JFLAP-style stacked labels (newest on top) - prevents label merging
function addTransitionLabel(edgesParent, labelX, labelY, symbol, fromId, toId) {
  const svgNS = "http://www.w3.org/2000/svg";
  const spacing = 14;
  const selector = 'text.transition-label[data-from="' + fromId + '"][data-to="' + toId + '"]';
  const existing = edgesParent.querySelectorAll(selector);

  // Prevent duplicate symbols on the same edge
  for (let lbl of existing) {
    if (lbl.textContent === symbol || (lbl.textContent === 'ε' && (symbol === '' || symbol === undefined))) {
      return;
    }
  }

  // Shift old labels down
  existing.forEach(lbl => {
    const y = parseFloat(lbl.getAttribute('y')) || labelY;
    lbl.setAttribute('y', (y + spacing).toString());
  });

  // Add new label on top
  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('class', 'transition-label');
  text.setAttribute('x', labelX);
  text.setAttribute('y', labelY);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('data-from', fromId);
  text.setAttribute('data-to', toId);
  text.textContent = (symbol === '' || symbol === undefined) ? 'ε' : symbol;
  edgesParent.appendChild(text);
}

const PRACTICE_BANK = {
  DFA: {
    basic: [
      { q: 'Build a DFA that accepts strings ending with "01"', sol: 'States: q0 (start), q1 (ends with 0), q2 (accepting, ends with 01)\nTransitions: q0 --0--> q1, q0 --1--> q0, q1 --0--> q1, q1 --1--> q2, q2 --0--> q1, q2 --1--> q0', machine: {states:[{id:'q0',x:300,y:300,initial:true,accepting:false},{id:'q1',x:500,y:300,initial:false,accepting:false},{id:'q2',x:700,y:300,initial:false,accepting:true}],transitions:[{from:'q0',to:'q1',symbol:'0'},{from:'q0',to:'q0',symbol:'1'},{from:'q1',to:'q1',symbol:'0'},{from:'q1',to:'q2',symbol:'1'},{from:'q2',to:'q1',symbol:'0'},{from:'q2',to:'q0',symbol:'1'}],alphabet:['0','1']} },
      { q: 'Build a DFA that accepts strings with even number of 1s', sol: 'States: q0 (start, accepting), q1 (odd 1s)\nTransitions: q0 --0--> q0, q0 --1--> q1, q1 --0--> q1, q1 --1--> q0', machine: {states:[{id:'q0',x:400,y:300,initial:true,accepting:true},{id:'q1',x:600,y:300,initial:false,accepting:false}],transitions:[{from:'q0',to:'q0',symbol:'0'},{from:'q0',to:'q1',symbol:'1'},{from:'q1',to:'q1',symbol:'0'},{from:'q1',to:'q0',symbol:'1'}],alphabet:['0','1']} }
    ],
    medium: [
      { q: 'Build a DFA that accepts strings where the number of 0s is divisible by 3', sol: 'Three states representing mod 3 counts', machine: {states:[{id:'q0',x:300,y:300,initial:true,accepting:true},{id:'q1',x:500,y:300,initial:false,accepting:false},{id:'q2',x:700,y:300,initial:false,accepting:false}],transitions:[{from:'q0',to:'q1',symbol:'0'},{from:'q0',to:'q0',symbol:'1'},{from:'q1',to:'q2',symbol:'0'},{from:'q1',to:'q1',symbol:'1'},{from:'q2',to:'q0',symbol:'0'},{from:'q2',to:'q2',symbol:'1'}],alphabet:['0','1']} }
    ],
    easy: [
      { q: 'Build a DFA that accepts all strings starting with 1', sol: 'States: q0 (start), q1 (accepting), q2 (reject)\nq0 --1--> q1, q0 --0--> q2, q1 --0,1--> q1, q2 --0,1--> q2', machine: {states:[{id:'q0',x:300,y:300,initial:true,accepting:false},{id:'q1',x:500,y:300,initial:false,accepting:true},{id:'q2',x:700,y:300,initial:false,accepting:false}],transitions:[{from:'q0',to:'q1',symbol:'1'},{from:'q0',to:'q2',symbol:'0'},{from:'q1',to:'q1',symbol:'0'},{from:'q1',to:'q1',symbol:'1'},{from:'q2',to:'q2',symbol:'0'},{from:'q2',to:'q2',symbol:'1'}],alphabet:['0','1']} }
    ]
  },
  NFA: {
    basic: [{ q: 'Build an NFA that accepts strings containing "ab"', sol: 'Use nondeterminism to guess where "ab" starts', machine: {states:[{id:'q0',x:300,y:300,initial:true,accepting:false},{id:'q1',x:500,y:300,initial:false,accepting:false},{id:'q2',x:700,y:300,initial:false,accepting:true}],transitions:[{from:'q0',to:'q0',symbol:'a'},{from:'q0',to:'q0',symbol:'b'},{from:'q0',to:'q1',symbol:'a'},{from:'q1',to:'q2',symbol:'b'},{from:'q2',to:'q2',symbol:'a'},{from:'q2',to:'q2',symbol:'b'}],alphabet:['a','b']} }],
    medium: [],
    easy: []
  },
  ENFA: {
    basic: [{ q: 'Build an ε-NFA with epsilon transitions', sol: 'Use ε to connect multiple paths', machine: {states:[{id:'q0',x:300,y:300,initial:true,accepting:false},{id:'q1',x:500,y:300,initial:false,accepting:true}],transitions:[{from:'q0',to:'q1',symbol:'ε'}],alphabet:[]} }],
    medium: [],
    easy: []
  }

// --- generate 120 conversion practice questions (30 per conversion mode) ---
function generateConversionQuestions(){
  let idCounter = 0;
  function simpleMachine(numStates, alphabet, edgesSpec, startIndex=0, acceptingIndices=[]){
    const states = [];
    for(let i=0;i<numStates;i++){
      states.push({ id: 'q' + (idCounter++) , x: 200 + i*120, y: 250 + (i%2)*40, initial: i===startIndex, accepting: acceptingIndices.includes(i) });
    }
    const transitions = [];
    edgesSpec.forEach(es=> {
      transitions.push({ from: states[es[0]].id, to: states[es[1]].id, symbol: es[2] });
    });
    return { states, transitions, alphabet };
  }
  function addToBank(key, qObj){
    if(!PRACTICE_BANK[key]) PRACTICE_BANK[key] = { basic: [], medium: [], easy: [] };
    PRACTICE_BANK[key].basic.push(qObj);
  }
  for(let i=0;i<30;i++){
    const enfa = simpleMachine(3 + (i%3), ['a','b'], [[0,1,'ε'],[0,2,'a'],[1,2,'b']], 0, [2]);
    addToBank('ENFA_TO_NFA', { q: 'Convert the ε-NFA to an equivalent NFA (question '+(i+1)+')', sol: 'Converted NFA', machine: enfa, conversionType: 'ENFA_TO_NFA' });
    const nfa = simpleMachine(3 + ((i+1)%4), ['0','1'], [[0,1,'0'],[0,2,'1'],[1,2,'0'],[2,0,'1']], 0, [2]);
    addToBank('NFA_TO_DFA', { q: 'Determinize this NFA using subset construction (question '+(i+1)+')', sol: 'DFA via subset construction', machine: nfa, conversionType: 'NFA_TO_DFA' });
    const nfa2 = simpleMachine(4 + (i%3), ['a','b'], [[0,1,'a'],[1,2,'b'],[2,3,'a'],[3,0,'b']], 0, [3]);
    addToBank('NFA_TO_MIN_DFA', { q: 'Convert NFA to minimal DFA (question '+(i+1)+')', sol: 'DFA minimized', machine: nfa2, conversionType: 'NFA_TO_MIN_DFA' });
    const dfa = simpleMachine(4 + ((i+2)%3), ['0','1'], [[0,1,'0'],[0,2,'1'],[1,1,'0'],[1,3,'1'],[2,2,'0'],[2,3,'1']], 0, [3]);
    addToBank('DFA_TO_MIN_DFA', { q: 'Minimize this DFA (question '+(i+1)+')', sol: 'Minimized DFA', machine: dfa, conversionType: 'DFA_TO_MIN_DFA' });
  }
}
// generate at load
generateConversionQuestions();
// --- end generated questions ---


function enforceInitialStateRule() {
  if (MACHINE.type === 'DFA') {
    const initialStates = MACHINE.states.filter(s => s.initial);
    if (initialStates.length > 1) {
      initialStates.slice(1).forEach(s => s.initial = false);
    }
  }
  if (MACHINE.states.length > 0 && !MACHINE.states.some(s => s.initial)) {
    MACHINE.states[0].initial = true;
  }
}

function getLoopPathAndLabel(cx, cy, r, states, id, symbol) {
  const loopRadius = 40;
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
  ];
  
  for (let d of dirs) {
    const checkX = cx + d.dx * (r + loopRadius);
    const checkY = cy + d.dy * (r + loopRadius);
    
    let safe = true;
    for (let s of states) {
      if (s.id === id) continue;
      if (Math.hypot(s.x - checkX, s.y - checkY) < r * 2) {
        safe = false;
        break;
      }
    }
    
    if (safe) {
      const offX = d.dx * loopRadius;
      const offY = d.dy * loopRadius;
      
      const pathData = `M ${cx} ${cy - r}
                        C ${cx - offX} ${cy + offY},
                          ${cx + offX} ${cy + offY},
                          ${cx} ${cy - r}`;
      
      const labelX = cx + d.dx * (r + loopRadius + 10);
      const labelY = cy + d.dy * (r + loopRadius + 10);
      
      return { pathData, labelX, labelY };
    }
  }
  
  return {
    pathData: `M ${cx} ${cy - r}
               C ${cx - 40} ${cy - r - 40},
                 ${cx + 40} ${cy - r - 40},
                 ${cx} ${cy - r}`,
    labelX: cx,
    labelY: cy - r - 50
  };
}

function renderAll() {
  statesGroup.innerHTML = '';
  edgesGroup.innerHTML = '';
  
  if (!MACHINE.states || MACHINE.states.length === 0) {
    document.getElementById('canvasHint').style.display = 'block';
    return;
  }
  
  document.getElementById('canvasHint').style.display = 'none';
  
  // Render transitions with JFLAP-style stacked labels
  MACHINE.transitions.forEach((t, i) => {
    const from = MACHINE.states.find(s => s.id === t.from);
    const to = MACHINE.states.find(s => s.id === t.to);
    if (!from || !to) return;
    
    let pathD, labelX, labelY;
    
    if (t.from === t.to) {
      const loop = getLoopPathAndLabel(from.x, from.y, 30, MACHINE.states, t.from, t.symbol);
      pathD = loop.pathData;
      labelX = loop.labelX;
      labelY = loop.labelY;
    } else {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const r = 30;
      const startX = from.x + r * Math.cos(angle);
      const startY = from.y + r * Math.sin(angle);
      const endX = to.x - r * Math.cos(angle);
      const endY = to.y - r * Math.sin(angle);
      
      pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
      labelX = (startX + endX) / 2;
      labelY = (startY + endY) / 2 - 8;
    }
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.classList.add('transition-path');
    path.setAttribute('data-from', t.from);
    path.setAttribute('data-to', t.to);
    path.setAttribute('data-idx', i);
    edgesGroup.appendChild(path);
    
    // Use JFLAP-style stacked label function
    const symLabel = (t.symbol === '' || t.symbol === undefined) ? 'ε' : t.symbol;
    addTransitionLabel(edgesGroup, labelX, labelY, symLabel, t.from, t.to);
    
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (CURRENT_MODE === 'delete') {
        const idx = parseInt(path.getAttribute('data-idx'));
        if (!isNaN(idx)) deleteTransition(idx);
      }
    });
  });
  
  // Render states
  MACHINE.states.forEach(state => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-id', state.id);
    
    if (state.initial) {
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      arrow.setAttribute('x1', state.x - 60);
      arrow.setAttribute('y1', state.y);
      arrow.setAttribute('x2', state.x - 32);
      arrow.setAttribute('y2', state.y);
      arrow.classList.add('initial-arrow', 'anim-initial-arrow');
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
      innerCircle.classList.add('final-ring', 'anim-final-ring');
      g.appendChild(innerCircle);
    }
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', state.x);
    text.setAttribute('y', state.y);
    text.classList.add('state-label');
    text.textContent = state.id;
    g.appendChild(text);
    
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (CURRENT_MODE === 'transition') {
        if (!TRANS_FROM) {
          TRANS_FROM = state.id;
          SELECTED_STATE = state.id;
          circle.classList.add('state-selected');
        } else {
          showTransModal(TRANS_FROM, state.id);
          document.querySelectorAll('.state-circle').forEach(c => c.classList.remove('state-selected'));
          TRANS_FROM = null;
          SELECTED_STATE = null;
        }
      } else if (CURRENT_MODE === 'delete') {
        deleteState(state.id);
      } else if (CURRENT_MODE === 'rename') {
        renameState(state.id);
      } else if (CURRENT_MODE === 'stateprops') {
        openPropsModal(state.id);
      }
    });
    
    statesGroup.appendChild(g);
  });
  
  document.getElementById('modeLabel').textContent = getModeLabel();
  updateUndoRedoButtons();
}

function getModeLabel() {
  const val = modeSelect.value;
  const labels = {
    'DFA': 'DFA',
    'NFA': 'NFA',
    'ENFA': 'ε-NFA',
    'ENFA_TO_NFA': 'ε-NFA → NFA (Conversion)',
    'NFA_TO_DFA': 'NFA → DFA (Conversion)',
    'NFA_TO_MIN_DFA': 'NFA → Minimal DFA (Conversion)',
    'DFA_TO_MIN_DFA': 'DFA → Minimal DFA (Conversion)'
  };
  return labels[val] || val;
}

function layoutStatesLine(states) {
  if (!states || states.length === 0) return;
  const startX = 200;
  const spacing = 150;
  const baseY = 300;
  states.forEach((s, i) => {
    s.x = startX + i * spacing;
    s.y = baseY + (i % 2 === 0 ? 0 : 50);
  });
  renderAll();
}

const tools = document.querySelectorAll('.toolbar-icon[data-mode]');
tools.forEach(tool => {
  tool.addEventListener('click', () => {
    tools.forEach(t => t.classList.remove('active'));
    tool.classList.add('active');
    CURRENT_MODE = tool.dataset.mode;
    TRANS_FROM = null;
    SELECTED_STATE = null;
    document.querySelectorAll('.state-circle').forEach(c => c.classList.remove('state-selected'));
  });
});

document.querySelector('[data-mode="addclick"]').classList.add('active');

svg.addEventListener('click', (e) => {
  if (CURRENT_MODE === 'addclick') {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    addState(svgP.x, svgP.y);
  }
});

function addState(x, y) {
  const id = 'q' + MACHINE.states.length;
  const isFirst = MACHINE.states.length === 0;
  pushUndo();
  MACHINE.states.push({
    id: id,
    x: x,
    y: y,
    initial: isFirst,
    accepting: false
  });
  renderAll();
  
  const stateG = document.querySelector(`[data-id="${id}"]`);
  if (stateG) {
    const circle = stateG.querySelector('circle');
    if (circle) {
      circle.classList.add('state-drawing');
      setTimeout(() => circle.classList.remove('state-drawing'), 600);
    }
  }
}

function renameState(oldId) {
  const newId = prompt('Enter new state name:', oldId);
  if (!newId || newId === oldId) return;
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
}

function hideTransModal() {
  document.getElementById('transitionModal').style.display = 'none';
}

document.getElementById('transCancel').addEventListener('click', hideTransModal);

document.getElementById('transSave').addEventListener('click', () => {
  const from = document.getElementById('transFrom').value.trim();
  const to = document.getElementById('transTo').value.trim();
  const symRaw = document.getElementById('transSymbol').value.trim();
  let sym = symRaw;
  
  if (symRaw === '') {
    if (MACHINE.type === 'DFA') {
      hideTransModal();
      return;
    } else {
      sym = 'ε';
    }
  }
  
  if (!from || !to) {
    alert('Fill both from and to states');
    return;
  }
  
  if (MACHINE.type === 'DFA') {
    const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === sym && t.to !== to);
    if (conflict) {
      alert('DFA: transition for this symbol from state already exists');
      return;
    }
  }
  
  pushUndo();
  MACHINE.transitions.push({ from, to, symbol: sym });
  updateAlphabet();
  renderAll();
  layoutStatesLine(MACHINE.states);
  hideTransModal();
  
  setTimeout(() => {
    const pathEl = document.querySelector(`.transition-path[data-from="${from}"][data-to="${to}"]`);
    if (pathEl) {
      pathEl.classList.add('transition-drawing');
      setTimeout(() => pathEl.classList.remove('transition-drawing'), 800);
    }
  }, 50);
});

function deleteTransition(i) {
  pushUndo();
  MACHINE.transitions.splice(i, 1);
  renderAll();
  layoutStatesLine(MACHINE.states);
}

function deleteState(id) {
  pushUndo();
  MACHINE.states = MACHINE.states.filter(s => s.id !== id);
  MACHINE.transitions = MACHINE.transitions.filter(t => t.from !== id && t.to !== id);
  enforceInitialStateRule();
  renderAll();
  layoutStatesLine(MACHINE.states);
}

function updateAlphabet() {
  const set = new Set();
  MACHINE.transitions.forEach(t => {
    if (t.symbol && t.symbol !== 'ε') set.add(t.symbol);
  });
  MACHINE.alphabet = Array.from(set);
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
  layoutStatesLine(MACHINE.states);
  updateUndoRedoButtons();
}

function doRedo() {
  if (REDO_STACK.length === 0) return;
  UNDO_STACK.push(JSON.parse(JSON.stringify(MACHINE)));
  MACHINE = REDO_STACK.pop();
  renderAll();
  layoutStatesLine(MACHINE.states);
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (undoBtn) undoBtn.disabled = UNDO_STACK.length === 0;
  if (redoBtn) redoBtn.disabled = REDO_STACK.length === 0;
}

undoBtn.addEventListener('click', doUndo);
redoBtn.addEventListener('click', doRedo);

let CURRENT_PRACTICE = null;


genPracticeBtn.addEventListener('click', () => {
  const mode = (document.getElementById('modeSelect') && document.getElementById('modeSelect').value) ? document.getElementById('modeSelect').value : MACHINE.type;
  const level = document.getElementById('practiceMode').value;
  const bank = (PRACTICE_BANK[mode] && PRACTICE_BANK[mode][level]) ? PRACTICE_BANK[mode][level] : (PRACTICE_BANK[mode] ? (PRACTICE_BANK[mode].basic||[]) : null) || (PRACTICE_BANK[MACHINE.type] && PRACTICE_BANK[MACHINE.type][level]);
  if (!bank || bank.length === 0) {
    practiceBox.textContent = "No questions available.";
    return;
  }
  CURRENT_PRACTICE = bank[Math.floor(Math.random() * bank.length)];
  practiceBox.innerHTML = `<strong>${mode} | ${level}</strong>
    <div style="margin-top:8px">${CURRENT_PRACTICE.q}</div>
    <div style="margin-top:8px;color:var(--muted)">Click "Show Solution" to see the answer, or "Check Answer" to validate your design.</div>`;
});



showSolBtn.addEventListener('click', async () => {
  if (!CURRENT_PRACTICE) {
    alert('No practice generated yet.');
    return;
  }

  practiceBox.innerHTML = `<strong>Problem</strong>
    <div style="margin-top:8px">${CURRENT_PRACTICE.q}</div>
    <strong style="margin-top:8px;display:block">Solution</strong>
    <div style="margin-top:8px;white-space:pre-line">${CURRENT_PRACTICE.sol}</div>`;

  if (CURRENT_PRACTICE.conversionType) {
    await animateConstruction(CURRENT_PRACTICE.machine);
    await sleep(600);
    try {
      let converted = null;
      if (CURRENT_PRACTICE.conversionType === 'ENFA_TO_NFA') converted = (typeof convertEnfaToNfa === 'function') ? convertEnfaToNfa(CURRENT_PRACTICE.machine) : (typeof convertEpsilonNFAtoNFA === 'function' ? convertEpsilonNFAtoNFA(CURRENT_PRACTICE.machine) : null);
      else if (CURRENT_PRACTICE.conversionType === 'NFA_TO_DFA') converted = (typeof convertNfaToDfa === 'function') ? convertNfaToDfa(CURRENT_PRACTICE.machine) : (typeof convertNFAtoDFA === 'function' ? convertNFAtoDFA(CURRENT_PRACTICE.machine) : null);
      else if (CURRENT_PRACTICE.conversionType === 'NFA_TO_MIN_DFA') {
        const dfa = (typeof convertNfaToDfa === 'function') ? convertNfaToDfa(CURRENT_PRACTICE.machine) : (typeof convertNFAtoDFA === 'function' ? convertNFAtoDFA(CURRENT_PRACTICE.machine) : null);
        converted = (typeof minimizeDfa === 'function') ? minimizeDfa(dfa) : (typeof minimizeDFA === 'function' ? minimizeDFA(dfa) : dfa);
      }
      else if (CURRENT_PRACTICE.conversionType === 'DFA_TO_MIN_DFA') converted = (typeof minimizeDfa === 'function') ? minimizeDfa(CURRENT_PRACTICE.machine) : (typeof minimizeDFA === 'function' ? minimizeDFA(CURRENT_PRACTICE.machine) : null);

      if (converted) {
        addConstructionLog('🔁 Conversion applied: ' + CURRENT_PRACTICE.conversionType);
        await sleep(800);
        await animateConstruction(converted);
      } else {
        addConstructionLog('⚠ Conversion function not found.');
      }
    } catch (e) {
      console.error('Conversion/animation error', e);
      addConstructionLog('⚠ Conversion failed: ' + e.message);
    }
  } else {
    if (CURRENT_PRACTICE.machine) await animateConstruction(CURRENT_PRACTICE.machine);
  }
});

    
    renderAll();
    
    const pathEl = document.querySelector(`.transition-path[data-from="${t.from}"][data-to="${t.to}"]`);
    if (pathEl) {
      pathEl.classList.add('transition-drawing');
      setTimeout(() => pathEl.classList.remove('transition-drawing'), 800);
    }
    
    const stepMsg = `Step ${states.length + i + 1}: Drew transition from ${t.from} to ${t.to} on symbol '${symbol}'`;
    addConstructionLog(stepMsg);
    
    await sleep(speed);
  }
  
  MACHINE.alphabet = machineData.alphabet || [];
  
  addConstructionLog('✅ Construction complete!');
}

function addConstructionLog(message) {
  const log = document.getElementById('stepLog');
  const div = document.createElement('div');
  div.className = 'new-log';
  div.innerHTML = `<i>▶</i> ${message}`;
  log.innerHTML = div.outerHTML + log.innerHTML;
  log.scrollTop = 0;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

resetPractice.addEventListener('click', () => {
  CURRENT_PRACTICE = null;
  practiceBox.textContent = 'No practice generated yet.';
});

checkAnswerBtn.addEventListener('click', () => {
  if (!CURRENT_PRACTICE) {
    alert('No practice generated yet.');
    return;
  }
  
  const validation = validateAutomaton();
  
  if (validation.includes('invalid')) {
    practiceBox.innerHTML = `<div style="color:red;font-weight:bold">❌ Your automaton is invalid!</div>
      <div style="margin-top:8px">${validation}</div>
      <div style="margin-top:8px;color:var(--muted)">Fix the errors and try again.</div>`;
    return;
  }
  
  practiceBox.innerHTML = `<div style="color:green;font-weight:bold">✓ Your automaton is valid!</div>
    <div style="margin-top:8px">Compare your solution with the expected one using "Show Solution".</div>`;
});

let simSteps = [], simIndex = 0, simTimer = null;

async function runSimulation(inputStr) {
  if (typeof inputStr !== 'string') inputStr = '' + (inputStr || '');
  simSteps = [];
  simIndex = 0;
  clearTimeout(simTimer);
  document.getElementById('stepLog').innerHTML = '';
  testOutput.textContent = '';

  const startStates = MACHINE.states.filter(s => s.initial).map(s => s.id);
  if (startStates.length === 0) {
    alert('No initial state set.');
    return;
  }
  if (MACHINE.type === 'DFA' && startStates.length > 1) {
    console.warn('Multiple initial states found in DFA mode — using the first one.');
  }

  let currentSet = (MACHINE.type === 'ENFA') ? epsilonClosure(startStates) : [...startStates];
  if (MACHINE.type === 'DFA' && currentSet.length > 1) currentSet = [currentSet[0]];

  const symbols = inputStr.split('').filter(ch => ch !== '');

  for (const sym of symbols) {
    const frame = { before: [...currentSet], symbol: sym, steps: [], after: [] };
    const next = new Set();

    if (MACHINE.type === 'DFA') {
      if (currentSet.length > 0) {
        const q = currentSet[0];
        const t = MACHINE.transitions.find(tt => tt.from === q && tt.symbol === sym);
        if (t) {
          frame.steps.push({ from: q, to: t.to, symbol: t.symbol });
          next.add(t.to);
        }
      }
    } else {
      for (const q of currentSet) {
        MACHINE.transitions.filter(t => t.from === q && t.symbol === sym).forEach(t => {
          frame.steps.push({ from: q, to: t.to, symbol: t.symbol });
          next.add(t.to);
        });
      }
    }

    const after = (MACHINE.type === 'ENFA') ? epsilonClosure([...next]) : [...next];
    frame.after = after;
    simSteps.push(frame);
    currentSet = after;
    if (currentSet.length === 0) break;
  }

  simSteps.push({ end: true, active: [...currentSet] });

  const mode = document.querySelector('input[name="simMode"]:checked')?.value || 'auto';
  if (mode === 'manual') {
    document.getElementById('manualButtons').style.display = 'flex';
    simIndex = 0;
    await showStep(0);
    simIndex = 1;
  } else {
    document.getElementById('manualButtons').style.display = 'none';
    playAuto();
  }
}

function epsilonClosure(list) {
  const out = new Set(list);
  const stack = [...list];
  while (stack.length) {
    const q = stack.pop();
    MACHINE.transitions.filter(t => t.from === q && (t.symbol === '' || t.symbol === 'ε')).forEach(t => {
      if (!out.has(t.to)) {
        out.add(t.to);
        stack.push(t.to);
      }
    });
  }
  return [...out];
}

function animateElement(el, cls, duration) {
  return new Promise(resolve => {
    if (!el) {
      resolve();
      return;
    }
    el.classList.add(cls);
    el.style.animationDuration = duration + 'ms';
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      try {
        el.classList.remove(cls);
      } catch (e) {}
      el.removeEventListener('animationend', done);
      resolve();
    };
    el.addEventListener('animationend', done);
    setTimeout(() => { done(); }, duration + 120);
  });
}

async function showStep(idx) {
  if (idx < 0 || idx >= simSteps.length) return;
  simIndex = idx;
  const step = simSteps[idx];

  document.querySelectorAll('.state-circle').forEach(c => {
    c.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--accent1'));
    c.setAttribute('stroke-width', '3');
  });
  document.querySelectorAll('.transition-path').forEach(p => {
    p.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--accent1'));
    p.setAttribute('stroke-width', '2');
  });

  const log = document.getElementById('stepLog');
  if (log && idx === 0) log.innerHTML = '';

  const speed = parseInt(document.getElementById('testSpeed').value || '500');
  const animMs = Math.max(120, Math.round(speed * 0.6));

  if (step.end) {
    for (const sid of (step.active || [])) {
      const g = document.querySelector(`[data-id="${sid}"]`);
      if (g) {
        const circ = g.querySelector('circle');
        await animateElement(circ, 'state-animating', animMs);
      }
    }
    const accept = (step.active || []).some(sid => MACHINE.states.find(s => s.id === sid && s.accepting));
    testOutput.textContent = accept ? 'Accepted' : 'Rejected';
    testOutput.style.color = accept ? 'green' : 'red';
    if (log) log.innerHTML = `<div><strong style="color:${accept ? 'green' : 'red'}">${accept ? '✔ Accepted' : '✘ Rejected'}</strong></div>` + log.innerHTML;
    if (log) log.innerHTML = `<div><strong>Final active: {${(step.active || []).join(', ')}}</strong></div>` + log.innerHTML;
    return;
  }

  await Promise.all((step.before || []).map(async sid => {
    const g = document.querySelector(`[data-id="${sid}"]`);
    if (g) {
      const circ = g.querySelector('circle');
      await animateElement(circ, 'state-animating', animMs);
    }
  }));

  if (step.steps && step.steps.length) {
    for (const s of step.steps) {
      if (log) {
        log.innerHTML = `<div>In {${s.from}} on '${s.symbol}' → {${s.to}}</div>` + log.innerHTML;
        log.scrollTop = 0;
      }
      const fromG = document.querySelector(`[data-id="${s.from}"]`);
      if (fromG) {
        const circ = fromG.querySelector('circle');
        await animateElement(circ, 'state-animating', Math.max(80, Math.round(animMs * 0.5)));
      }
      const pathEl = document.querySelector(`.transition-path[data-from="${s.from}"][data-to="${s.to}"]`);
      if (pathEl) {
        await animateElement(pathEl, 'transition-animating', animMs);
      }
    }
  } else {
    if (log) log.innerHTML = `<div>No outgoing transitions from {${(step.before || []).join(', ')}} on '${step.symbol}' → ∅</div>` + log.innerHTML;
    await new Promise(r => setTimeout(r, animMs));
  }

  await Promise.all((step.after || []).map(async sid => {
    const g = document.querySelector(`[data-id="${sid}"]`);
    if (g) {
      const circ = g.querySelector('circle');
      await animateElement(circ, 'state-animating', animMs);
    }
  }));

  testOutput.textContent = `After '${step.symbol}' active: {${(step.after || []).join(', ')}}`;
}

async function playAuto() {
  const speed = parseInt(document.getElementById('testSpeed').value || '500');
  const total = simSteps.length;
  for (let i = 0; i < total; i++) {
    await showStep(i);
  }
}

document.getElementById('stepNext').addEventListener('click', async () => {
  if (simIndex < simSteps.length) {
    await showStep(simIndex);
    simIndex++;
  }
});

document.getElementById('stepPrev').addEventListener('click', async () => {
  if (simIndex > 0) {
    simIndex = Math.max(0, simIndex - 1);
    await showStep(simIndex);
  }
});

document.getElementById('stepReset').addEventListener('click', () => {
  simIndex = 0;
  simSteps = [];
  clearTimeout(simTimer);
  document.getElementById('stepLog').innerHTML = '';
  document.getElementById('testOutput').textContent = '';
  document.querySelectorAll('.state-circle').forEach(c => c.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--accent1')));
  document.querySelectorAll('.transition-path').forEach(p => p.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--accent1')));
});

runTestBtn.addEventListener('click', async () => {
  const str = testInput.value.trim();
  await runSimulation(str);
});

document.getElementById("genRandBtn").addEventListener("click", async () => {
  const alphabet = MACHINE.alphabet.length ? MACHINE.alphabet : ["a", "b"];
  const numStates = MACHINE.states.length || 1;
  const numTrans = MACHINE.transitions.length || 1;

  let length;
  if (numStates <= 2 || numTrans <= 2) {
    length = Math.floor(Math.random() * 3) + 1;
  } else {
    const bias = Math.random();
    if (bias < 0.6) {
      length = Math.floor(Math.random() * 4) + 4;
    } else {
      length = Math.floor(Math.random() * 12) + 4;
    }
  }

  let str = "";
  for (let i = 0; i < length; i++) {
    str += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  const inputEl = document.getElementById("testInput");
  inputEl.value = str;
  await runSimulation(str);
});

function setZoom(pct) {
  svg.style.transform = `scale(${pct / 100})`;
  svg.style.transformOrigin = '0 0';
  zoomSlider.value = pct;
}

zoomSlider.addEventListener('input', e => setZoom(e.target.value));
zoomInBtn.addEventListener('click', () => setZoom(Math.min(200, Number(zoomSlider.value) + 10)));
zoomOutBtn.addEventListener('click', () => setZoom(Math.max(50, Number(zoomSlider.value) - 10)));
zoomResetBtn.addEventListener('click', () => setZoom(100));

const propSave = document.getElementById('propSave');
const propCancel = document.getElementById('propCancel');

propSave.addEventListener('click', () => {
  const modal = document.getElementById('statePropsModal');
  const stateId = modal.dataset.stateId;
  const s = MACHINE.states.find(st => st.id === stateId);

  if (s) {
    pushUndo();
    if (document.getElementById('propInitial').checked) {
      if (MACHINE.type === 'DFA') {
        MACHINE.states.forEach(x => x.initial = false);
        s.initial = true;
      } else {
        s.initial = true;
      }
    } else {
      s.initial = false;
    }
    s.accepting = !!document.getElementById('propFinal').checked;
    renderAll();
    layoutStatesLine(MACHINE.states);
  }

  modal.style.display = 'none';
});

propCancel.addEventListener('click', () => {
  document.getElementById('statePropsModal').style.display = 'none';
});

document.getElementById("saveMachineBtn").addEventListener("click", () => {
  const data = JSON.stringify({ states: MACHINE.states, transitions: MACHINE.transitions }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "machine.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("loadMachineBtn").addEventListener("click", () => {
  document.getElementById("loadFileInput").click();
});

document.getElementById("loadFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const obj = JSON.parse(ev.target.result);
      if (obj.states && obj.transitions) {
        pushUndo();
        MACHINE.states = obj.states;
        MACHINE.transitions = obj.transitions;
        renderAll();
        layoutStatesLine(MACHINE.states);
      } else {
        alert("Invalid machine file");
      }
    } catch (err) {
      alert("Error loading file: " + err.message);
    }
  };
  reader.readAsText(file);
});

function validateAutomaton() {
  const modeRaw = document.getElementById('modeSelect').value || '';
  const mode = ('' + modeRaw).toUpperCase();
  const states = MACHINE.states || [];
  const transitions = MACHINE.transitions || [];
  let valid = true;
  const initialCount = states.filter(s => s.initial).length;

  if (mode === 'DFA' || mode === 'DFA_TO_MIN_DFA') {
    if (initialCount !== 1) valid = false;
    if (transitions.some(tr => (tr.symbol === 'ε' || tr.symbol === '' || tr.symbol === undefined))) valid = false;
    for (const st of states) {
      const seen = {};
      for (const t of transitions.filter(tt => tt.from === st.id)) {
        const sym = (t.symbol === undefined || t.symbol === '') ? 'ε' : t.symbol;
        if (sym === 'ε') {
          valid = false;
          break;
        }
        if (seen[sym]) {
          valid = false;
          break;
        }
        seen[sym] = true;
      }
      if (!valid) break;
    }
    return valid ? 'Valid DFA (exactly one initial state, no ε, deterministic δ)' : 'Invalid DFA';
  } else if (mode === 'NFA' || mode === 'NFA_TO_DFA' || mode === 'NFA_TO_MIN_DFA') {
    if (initialCount < 1) valid = false;
    if (transitions.some(tr => (tr.symbol === 'ε' || tr.symbol === '' || tr.symbol === undefined))) valid = false;
    return valid ? 'Valid NFA (≥1 initial, no ε, nondeterministic allowed)' : 'Invalid NFA (needs at least one initial state, no ε)';
  } else {
    if (initialCount < 1) valid = false;
    return valid ? 'Valid ε-NFA (≥1 initial, ε allowed)' : 'Invalid ε-NFA (needs at least one initial state)';
  }
}

validateBtn.addEventListener('click', () => {
  const result = validateAutomaton();
  alert(result);
});

// ===== CONVERSION ALGORITHMS =====

// Epsilon-closure computation
function computeEpsilonClosure(stateId, transitions) {
  const stack = [stateId];
  const closure = new Set([stateId]);
  while (stack.length) {
    const s = stack.pop();
    for (const t of transitions) {
      if (t.from === s && (t.symbol === '' || t.symbol === 'ε')) {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }
  }
  return Array.from(closure);
}

// ε-NFA → NFA conversion
function convertEnfaToNfa(machine) {
  const m = JSON.parse(JSON.stringify(machine));
  const newTrans = [];
  const seen = new Set();
  
  // For each state, compute its ε-closure
  for (const st of m.states) {
    const closure = computeEpsilonClosure(st.id, m.transitions);
    
    // For each state in closure, get all non-ε transitions
    for (const closureState of closure) {
      for (const t of m.transitions) {
        if (t.from === closureState && t.symbol !== '' && t.symbol !== 'ε') {
          // Follow this transition and compute ε-closure of destination
          const destClosure = computeEpsilonClosure(t.to, m.transitions);
          
          // Add transitions from st.id to all states in destClosure
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
    
    // Check if any state in ε-closure is accepting
    for (const closureState of closure) {
      const sf = m.states.find(x => x.id === closureState);
      if (sf && sf.accepting) {
        const orig = m.states.find(x => x.id === st.id);
        if (orig) orig.accepting = true;
      }
    }
  }
  
  m.transitions = newTrans;
  m.type = 'NFA';
  return m;
}

// NFA → DFA conversion (Subset construction)
function convertNfaToDfa(nfa) {
  const alphabet = Array.from(new Set((nfa.transitions || []).map(t => t.symbol).filter(s => s && s !== '' && s !== 'ε')));
  
  // Compute ε-closure of a set of states
  function fullClosure(setArr) {
    const s = new Set(setArr);
    const stack = [...setArr];
    while (stack.length) {
      const cur = stack.pop();
      for (const t of (nfa.transitions || [])) {
        if (t.from === cur && (t.symbol === '' || t.symbol === 'ε')) {
          if (!s.has(t.to)) {
            s.add(t.to);
            stack.push(t.to);
          }
        }
      }
    }
    return Array.from(s).sort();
  }
  
  // Get initial states
  const initialStates = (nfa.states || []).filter(s => s.initial).map(s => s.id);
  if (initialStates.length === 0) {
    return { type: 'DFA', states: [], transitions: [], alphabet: alphabet };
  }
  
  const startSet = fullClosure(initialStates);
  const dstates = [startSet];
  const dtrans = [];
  const mapId = arr => arr.sort().join(',');
  const queue = [startSet];
  
  while (queue.length) {
    const S = queue.shift();
    const sid = mapId(S);
    
    for (const a of alphabet) {
      const dest = new Set();
      for (const s of S) {
        for (const t of (nfa.transitions || [])) {
          if (t.from === s && t.symbol === a) {
            dest.add(t.to);
          }
        }
      }
      
      if (dest.size === 0) continue;
      
      const destFull = fullClosure(Array.from(dest));
      const did = mapId(destFull);
      
      if (!dstates.find(x => mapId(x) === did)) {
        dstates.push(destFull);
        queue.push(destFull);
      }
      
      dtrans.push({ from: sid, to: did, symbol: a });
    }
  }
  
  // Create DFA states
  const dstateObjs = dstates.map((s, i) => {
    const isAccepting = s.some(id => {
      const nfaState = (nfa.states || []).find(x => x.id === id);
      return nfaState && nfaState.accepting;
    });
    
    return {
      id: mapId(s) || ('S' + i),
      x: 200 + (i % 6) * 180,
      y: 200 + Math.floor(i / 6) * 150,
      accepting: isAccepting,
      initial: i === 0
    };
  });
  
  return {
    type: 'DFA',
    states: dstateObjs,
    transitions: dtrans,
    alphabet: alphabet
  };
}

// DFA Minimization (Hopcroft's algorithm / partition refinement)
function minimizeDfa(dfa) {
  const states = (dfa.states || []).map(s => s.id);
  const alph = dfa.alphabet || Array.from(new Set((dfa.transitions || []).map(t => t.symbol)));
  const isAcc = id => !!((dfa.states || []).find(s => s.id === id && s.accepting));
  
  // Initial partition: accepting vs non-accepting
  let P = [
    states.filter(isAcc),
    states.filter(s => !isAcc(s))
  ].filter(x => x.length > 0);
  
  let changed = true;
  while (changed) {
    changed = false;
    const newP = [];
    
    for (const block of P) {
      const groups = {};
      
      for (const s of block) {
        // Compute signature based on which partition each symbol transitions to
        const sig = alph.map(a => {
          const t = (dfa.transitions || []).find(tr => tr.from === s && tr.symbol === a);
          const to = t ? t.to : '__NONE__';
          const idx = P.findIndex(b => b.includes(to));
          return idx;
        }).join('|');
        
        groups[sig] = groups[sig] || [];
        groups[sig].push(s);
      }
      
      const vals = Object.values(groups);
      if (vals.length > 1) changed = true;
      newP.push(...vals);
    }
    
    P = newP;
  }
  
  // Create representative mapping
  const rep = {};
  P.forEach((block, i) => {
    const id = 'S' + i;
    block.forEach(s => rep[s] = id);
  });
  
  // Create minimized states
  const newStates = P.map((block, i) => ({
    id: 'S' + i,
    initial: block.some(b => (dfa.states || []).find(s => s.id === b && s.initial)),
    accepting: block.some(b => (dfa.states || []).find(s => s.id === b && s.accepting)),
    x: 200 + (i % 5) * 180,
    y: 200 + Math.floor(i / 5) * 150
  }));
  
  // Create minimized transitions (one per block per symbol)
  const newTrans = [];
  const seenTrans = new Set();
  
  for (const block of P) {
    const src = rep[block[0]];
    for (const a of alph) {
      const t = (dfa.transitions || []).find(tr => tr.from === block[0] && tr.symbol === a);
      if (t) {
        const to = rep[t.to];
        const key = `${src}-${to}-${a}`;
        if (to && !seenTrans.has(key)) {
          newTrans.push({ from: src, to: to, symbol: a });
          seenTrans.add(key);
        }
      }
    }
  }
  
  return {
    type: 'DFA',
    states: newStates,
    transitions: newTrans,
    alphabet: alph
  };
}

// MODE CHANGE HANDLER WITH CONVERSIONS
let lastModeValue = modeSelect ? modeSelect.value : 'DFA';

if (modeSelect) {
  modeSelect.addEventListener('change', function(e) {
    const newMode = modeSelect.value;
    
    // Handle conversion modes
    if (newMode === 'ENFA_TO_NFA') {
      pushUndo();
      MACHINE = convertEnfaToNfa(MACHINE);
      MACHINE.type = 'NFA';
      renderAll();
      layoutStatesLine(MACHINE.states);
      alert('Converted ε-NFA → NFA successfully!');
    } else if (newMode === 'NFA_TO_DFA') {
      pushUndo();
      if (MACHINE.type === 'ENFA') {
        MACHINE = convertEnfaToNfa(MACHINE);
      }
      MACHINE = convertNfaToDfa(MACHINE);
      MACHINE.type = 'DFA';
      renderAll();
      layoutStatesLine(MACHINE.states);
      alert('Converted NFA → DFA successfully!');
    } else if (newMode === 'NFA_TO_MIN_DFA') {
      pushUndo();
      if (MACHINE.type === 'ENFA') {
        MACHINE = convertEnfaToNfa(MACHINE);
      }
      MACHINE = convertNfaToDfa(MACHINE);
      MACHINE = minimizeDfa(MACHINE);
      MACHINE.type = 'DFA';
      renderAll();
      layoutStatesLine(MACHINE.states);
      alert('Converted NFA → Minimal DFA successfully!');
    } else if (newMode === 'DFA_TO_MIN_DFA') {
      pushUndo();
      MACHINE = minimizeDfa(MACHINE);
      MACHINE.type = 'DFA';
      renderAll();
      layoutStatesLine(MACHINE.states);
      alert('Minimized DFA successfully!');
    } else {
      // Regular mode change
      MACHINE.type = newMode;
      renderAll();
    }
    
    lastModeValue = newMode;
  });
}

// ===== JFLAP-STYLE MOVE TOOL WITH GLIDER DRAG =====

(function setupSmoothMoveTool() {
  if (!svg || !statesGroup) return;
  
  let dragging = false;
  let currentCircle = null;
  let currentStateG = null;
  let lastPos = { x: 0, y: 0 };
  let raf = null;
  
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
  
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  function animate() {
    if (!dragging || !currentStateG) return;
    raf = requestAnimationFrame(animate);
    
    const sid = currentStateG.getAttribute('data-id');
    const sObj = MACHINE.states.find(x => x.id === sid);
    if (!sObj) return;
    
    const nx = lerp(sObj.x, lastPos.x, 0.22);
    const ny = lerp(sObj.y, lastPos.y, 0.22);
    
    sObj.x = nx;
    sObj.y = ny;
    
    // Update all visual elements for this state
    currentCircle.setAttribute('cx', nx);
    currentCircle.setAttribute('cy', ny);
    
    const label = currentStateG.querySelector('text');
    if (label) {
      label.setAttribute('x', nx);
      label.setAttribute('y', ny);
    }
    
    const innerCircle = currentStateG.querySelector('.final-ring');
    if (innerCircle) {
      innerCircle.setAttribute('cx', nx);
      innerCircle.setAttribute('cy', ny);
    }
    
    const initialArrow = currentStateG.querySelector('.initial-arrow');
    if (initialArrow) {
      initialArrow.setAttribute('x1', nx - 60);
      initialArrow.setAttribute('y1', ny);
      initialArrow.setAttribute('x2', nx - 32);
      initialArrow.setAttribute('y2', ny);
    }
    
    // Update all connected transitions
    updateTransitionsForState(sid, nx, ny);
  }
  
  function updateTransitionsForState(stateId, nx, ny) {
    // Clear and re-render all transitions that involve this state
    edgesGroup.innerHTML = '';
    MACHINE.transitions.forEach((t, i) => {
      const from = MACHINE.states.find(s => s.id === t.from);
      const to = MACHINE.states.find(s => s.id === t.to);
      if (!from || !to) return;
      
      let pathD, labelX, labelY;
      
      if (t.from === t.to) {
        const loop = getLoopPathAndLabel(from.x, from.y, 30, MACHINE.states, t.from, t.symbol);
        pathD = loop.pathData;
        labelX = loop.labelX;
        labelY = loop.labelY;
      } else {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        const r = 30;
        const startX = from.x + r * Math.cos(angle);
        const startY = from.y + r * Math.sin(angle);
        const endX = to.x - r * Math.cos(angle);
        const endY = to.y - r * Math.sin(angle);
        
        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        labelX = (startX + endX) / 2;
        labelY = (startY + endY) / 2 - 8;
      }
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      path.classList.add('transition-path');
      path.setAttribute('data-from', t.from);
      path.setAttribute('data-to', t.to);
      path.setAttribute('data-idx', i);
      edgesGroup.appendChild(path);
      
      const symLabel = (t.symbol === '' || t.symbol === undefined) ? 'ε' : t.symbol;
      addTransitionLabel(edgesGroup, labelX, labelY, symLabel, t.from, t.to);
    });
  }
  
  function startDrag(stateG, circle, evt) {
    // Only when move tool is active
    const moveActive = document.getElementById('tool-move') && document.getElementById('tool-move').classList.contains('active');
    if (!moveActive) return;
    
    pushUndo();
    dragging = true;
    currentCircle = circle;
    currentStateG = stateG;
    circle.classList.add('state-selected');
    
    const p = getPoint(evt);
    lastPos.x = p.x;
    lastPos.y = p.y;
    
    animate();
    evt.preventDefault();
    evt.stopPropagation();
  }
  
  function moveDrag(evt) {
    if (!dragging) return;
    const p = getPoint(evt);
    lastPos.x = p.x;
    lastPos.y = p.y;
    
    // Clamp to viewBox
    const vb = svg.viewBox.baseVal || { x: 0, y: 0, width: 1400, height: 900 };
    lastPos.x = Math.min(Math.max(lastPos.x, vb.x + 40), vb.x + vb.width - 40);
    lastPos.y = Math.min(Math.max(lastPos.y, vb.y + 40), vb.y + vb.height - 40);
  }
  
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    if (currentCircle) currentCircle.classList.remove('state-selected');
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    currentCircle = null;
    currentStateG = null;
    renderAll(); // Final render to ensure clean state
  }
  
  // Attach listeners to states group (event delegation)
  statesGroup.addEventListener('pointerdown', function(e) {
    const stateG = e.target.closest('g[data-id]');
    if (!stateG) return;
    
    const circle = stateG.querySelector('circle.state-circle');
    if (!circle) return;
    
    startDrag(stateG, circle, e);
    if (stateG.setPointerCapture) {
      try {
        stateG.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  });
  
  svg.addEventListener('pointermove', moveDrag);
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('touchmove', function(e) {
    if (dragging) {
      moveDrag(e);
      e.preventDefault();
    }
  }, { passive: false });
  svg.addEventListener('touchend', endDrag, { passive: false });
})();

// ===== EXPORT TO PNG =====
exportBtn.addEventListener('click', function() {
  const serializer = new XMLSerializer();
  const clone = svg.cloneNode(true);
  
  function inline(el) {
    const cs = window.getComputedStyle(el);
    let s = '';
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      try {
        const val = cs.getPropertyValue(prop);
        if (val) s += prop + ':' + val + ';';
      } catch (e) {}
    }
    el.setAttribute('style', s);
    for (let ch of Array.from(el.children)) inline(ch);
  }
  
  inline(clone);
  const vb = svg.viewBox.baseVal;
  clone.setAttribute('width', vb.width);
  clone.setAttribute('height', vb.height);
  
  const xml = serializer.serializeToString(clone);
  const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  
  img.onload = function() {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'automaton-canvas.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  
  img.onerror = function(e) {
    console.error('Export error', e);
    alert('Export failed');
  };
  
  img.src = svg64;
});

// ===== INITIALIZATION =====
renderAll();
layoutStatesLine(MACHINE.states);
setZoom(100);

// Splash screen
const splashScreen = document.getElementById('splashScreen');
const mainApp = document.getElementById('mainApp');
const splashTitle = document.getElementById('splashTitle');

splashTitle.addEventListener('click', () => {
  splashScreen.style.opacity = '0';
  splashScreen.style.transition = 'opacity 0.8s ease';
  setTimeout(() => {
    splashScreen.style.display = 'none';
    mainApp.style.display = 'block';
    if (window.lucide) {
      lucide.createIcons();
    }
  }, 800);
});

window.addEventListener('load', () => {
  setTimeout(() => {
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.8s ease';
    setTimeout(() => {
      splashScreen.style.display = 'none';
      mainApp.style.display = 'block';
      if (window.lucide) {
        lucide.createIcons();
      }
    }, 800);
  }, 1500);
});



(function(){
  const svg = document.getElementById('dfaSVG');
  const edgesGroup = document.getElementById('edges');
  if(!svg || !edgesGroup) return;
  let dragging = null;
  let pointerId = null;
  let target = {x:0,y:0};
  let raf = null;

  function svgPoint(evt){
    const pt = svg.createSVGPoint();
    if(evt.touches && evt.touches[0]){ pt.x = evt.touches[0].clientX; pt.y = evt.touches[0].clientY;}
    else { pt.x = evt.clientX; pt.y = evt.clientY; }
    try { return pt.matrixTransform(svg.getScreenCTM().inverse()); }
    catch(e){ return {x: pt.x, y: pt.y}; }
  }

  function startDrag(circle, evt){
    // only when move tool active
    const tool = document.getElementById('tool-move');
    const moveActive = tool ? tool.classList.contains('active') || window.CURRENT_MODE==='move' : (window.CURRENT_MODE==='move');
    if(!moveActive) return;
    if(typeof pushUndo === 'function') try{ pushUndo(); }catch(e){}
    dragging = {
      circle: circle,
      g: circle.closest('g[data-id]') || circle.parentNode,
      id: circle.getAttribute('data-id') || (circle.closest('g') && circle.closest('g').getAttribute('data-id')),
      offsetX:0, offsetY:0,
      curX:0, curY:0
    };
    const p = svgPoint(evt);
    // detect if circle uses cx/cy or g transform
    if(circle.hasAttribute('cx')){
      const cx = parseFloat(circle.getAttribute('cx')||0);
      const cy = parseFloat(circle.getAttribute('cy')||0);
      dragging.offsetX = p.x - cx;
      dragging.offsetY = p.y - cy;
      dragging.curX = cx; dragging.curY = cy;
    } else {
      // g transform translate(x,y)
      const tr = dragging.g.getAttribute('transform') || '';
      const m = tr.match(/translate\(([-\d\.]+)\s*,?\s*([-\d\.]+)\)/);
      const gx = m?parseFloat(m[1]):(dragging.g.__lastX||0);
      const gy = m?parseFloat(m[2]):(dragging.g.__lastY||0);
      dragging.offsetX = p.x - gx;
      dragging.offsetY = p.y - gy;
      dragging.curX = gx; dragging.curY = gy;
    }
    target.x = dragging.curX; target.y = dragging.curY;
    if(evt.pointerId && dragging.circle.setPointerCapture) {
      pointerId = evt.pointerId;
      try{ dragging.circle.setPointerCapture(pointerId);}catch(e){}
    }
    if(dragging.circle.classList) dragging.circle.classList.add('state-selected');
    raf = requestAnimationFrame(tick);
    try{ evt.preventDefault(); evt.stopPropagation(); }catch(e){}
  }

  function tick(){
    if(!dragging){ raf=null; return; }
    raf = requestAnimationFrame(tick);
    // lerp current toward target
    const curx = dragging.curX;
    const cury = dragging.curY;
    const nx = curx + (target.x - curx) * 0.22;
    const ny = cury + (target.y - cury) * 0.22;
    dragging.curX = nx; dragging.curY = ny;
    // set element
    const c = dragging.circle;
    const g = dragging.g;
    if(c.hasAttribute('cx')){
      c.setAttribute('cx', nx);
      c.setAttribute('cy', ny);
      c.setAttribute('data-x', nx);
      c.setAttribute('data-y', ny);
      const label = g.querySelector('text.state-label, text');
      if(label){ label.setAttribute('x', nx); label.setAttribute('y', ny); }
    } else {
      g.setAttribute('transform', 'translate(' + nx + ',' + ny + ')');
      g.__lastX = nx; g.__lastY = ny;
    }
    // update MACHINE
    if(window.MACHINE){
      const s = window.MACHINE.states.find(s=>s.id===dragging.id);
      if(s){ s.x = nx; s.y = ny; }
    }
    // update connected transitions using existing helper if possible
    if(typeof updateConnectedTransitions === 'function'){
      try{ updateConnectedTransitions(dragging.id, dragging.curX, dragging.curY); }catch(e){}
    } else {
      // fallback: update path positions naively
      const transitions = window.MACHINE && window.MACHINE.transitions ? window.MACHINE.transitions.filter(t=>t.from===dragging.id||t.to===dragging.id) : [];
      transitions.forEach((t)=>{
        const from = window.MACHINE.states.find(s=>s.id===t.from);
        const to = window.MACHINE.states.find(s=>s.id===t.to);
        const path = edgesGroup.querySelector('path[data-from=\"'+t.from+'\"][data-to=\"'+t.to+'\"]');
        if(path && from && to){
          if(t.from===t.to){
            const out = (typeof getLoopPathAndLabel==='function')? getLoopPathAndLabel(from.x, from.y, 36, window.MACHINE.states||[], from.id, t.symbol) : {pathData:'M '+from.x+' '+(from.y-36)+' L '+(from.x+1)+' '+(from.y-36), labelX:from.x, labelY:from.y-60};
            try{ path.setAttribute('d', out.pathData || out); }catch(e){}
            const lbls = edgesGroup.querySelectorAll('text.transition-label[data-from=\"'+t.from+'\"][data-to=\"'+t.to+'\"]');
            lbls.forEach((lbl,i)=>{ lbl.setAttribute('x', out.labelX); lbl.setAttribute('y', out.labelY + i*12); });
          } else {
            try{ path.setAttribute('d','M '+from.x+' '+from.y+' L '+to.x+' '+to.y); }catch(e){}
            const lbls = edgesGroup.querySelectorAll('text.transition-label[data-from=\"'+t.from+'\"][data-to=\"'+t.to+'\"]');
            lbls.forEach((lbl,i)=>{
              const lx = (from.x+to.x)/2;
              const ly = (from.y+to.y)/2;
              try{ lbl.setAttribute('x', lx); lbl.setAttribute('y', ly + i*12); }catch(e){}
            });
          }
        }
      });
    }
  }

  function moveHandler(evt){
    if(!dragging) return;
    const p = svgPoint(evt);
    target.x = p.x - dragging.offsetX;
    target.y = p.y - dragging.offsetY;
    // clamp to viewBox
    try {
      const vb = svg.viewBox.baseVal || {x:0,y:0,width:1400,height:900};
      target.x = Math.min(Math.max(target.x, vb.x+36), vb.x+vb.width-36);
      target.y = Math.min(Math.max(target.y, vb.y+36), vb.y+vb.height-36);
    } catch(e){}
    try{ evt.preventDefault(); evt.stopPropagation(); }catch(e){}
  }

  function endDrag(evt){
    if(!dragging) return;
    if(pointerId && dragging.circle.releasePointerCapture) {
      try{ dragging.circle.releasePointerCapture(pointerId);}catch(e){}
      pointerId = null;
    }
    if(dragging.circle.classList) dragging.circle.classList.remove('state-selected');
    // finalize
    if(raf) cancelAnimationFrame(raf);
    raf = null;
    // snap to target
    if(typeof dragging !== 'object'){ dragging = null; return; }
    const finalX = target.x;
    const finalY = target.y;
    if(dragging.circle.hasAttribute('cx')){
      dragging.circle.setAttribute('cx', finalX);
      dragging.circle.setAttribute('cy', finalY);
      const label = dragging.g.querySelector('text.state-label, text');
      if(label){ label.setAttribute('x', finalX); label.setAttribute('y', finalY); }
    } else {
      dragging.g.setAttribute('transform','translate('+finalX+','+finalY+')');
      dragging.g.__lastX = finalX; dragging.g.__lastY = finalY;
    }
    if(window.MACHINE){
      const s = window.MACHINE.states.find(s=>s.id===dragging.id);
      if(s){ s.x = finalX; s.y = finalY; }
    }
    // ensure transitions final positions
    if(typeof updateConnectedTransitions === 'function') {
      try{ updateConnectedTransitions(dragging.id, finalX, finalY); }catch(e){}
    } else {
      try{ renderAll(); }catch(e){}
    }
    dragging = null;
    try{ evt.preventDefault(); evt.stopPropagation(); }catch(e){}
  }

  // capture pointerdown on circles (use capture so we get it early)
  svg.addEventListener('pointerdown', function(e){
    const circle = e.target.closest('circle[data-id]');
    if(!circle) return;
    startDrag(circle, e);
  }, {capture:true});

  window.addEventListener('pointermove', moveHandler, {passive:false});
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
})();
});