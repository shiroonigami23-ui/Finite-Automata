import { MACHINE, CURRENT_MODE, TRANS_FROM } from './state.js';
import { showTransModal, openPropsModal, deleteState, renameState } from './ui.js';
import { getModeLabel, updateUndoRedoButtons } from './utils.js';

const svg = document.getElementById('dfaSVG');
const statesGroup = document.getElementById('states');
const edgesGroup = document.getElementById('edges');

function getLoopPathAndLabel(cx, cy, r) {
    const loopRadius = 35;
    return {
        pathData: `M ${cx} ${cy - r} C ${cx - loopRadius} ${cy - r - loopRadius}, ${cx + loopRadius} ${cy - r - loopRadius}, ${cx} ${cy - r}`,
        labelX: cx,
        labelY: cy - r - (loopRadius / 2) - 10
    };
}

export function renderAll() {
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
