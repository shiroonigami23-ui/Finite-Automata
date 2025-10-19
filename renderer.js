// renderer.js
import { MACHINE } from './state.js';
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
    if (!statesGroup || !edgesGroup) return;
    statesGroup.innerHTML = '';
    edgesGroup.innerHTML = '';
    document.getElementById('canvasHint').style.display = (!MACHINE.states || MACHINE.states.length === 0) ? 'block' : 'none';

    const processedArcs = new Map();
    (MACHINE.transitions || []).forEach(t => {
        const arcKey = `${t.from}->${t.to}`;
        if (!processedArcs.has(arcKey)) {
            processedArcs.set(arcKey, []);
        }
        processedArcs.get(arcKey).push(t.symbol);
    });

    processedArcs.forEach((symbols, arcKey) => {
        const [fromId, toId] = arcKey.split('->');
        const from = MACHINE.states.find(s => s.id === fromId);
        const to = MACHINE.states.find(s => s.id === toId);
        if (!from || !to) return;

        let pathD, labelX, labelY;
        if (fromId === toId) {
            const loop = getLoopPathAndLabel(from.x, from.y, 30);
            pathD = loop.pathData;
            labelX = loop.labelX;
            labelY = loop.labelY;
        } else {
            const dx = to.x - from.x,
                dy = to.y - from.y;
            const angle = Math.atan2(dy, dx);
            const r = 30;
            const startX = from.x + r * Math.cos(angle),
                startY = from.y + r * Math.sin(angle);
            const endX = to.x - r * Math.cos(angle),
                endY = to.y - r * Math.sin(angle);

            const reverseKey = `${toId}->${fromId}`;
            const reverse = processedArcs.has(reverseKey) && processedArcs.get(reverseKey).length > 0;
            
            if (reverse) {
                const offset = 40,
                    midX = (startX + endX) / 2,
                    midY = (startY + endY) / 2;
                const normX = -dy / Math.hypot(dx, dy),
                    normY = dx / Math.hypot(dx, dy);
                const cpx = midX + normX * offset,
                    cpy = midY + normY * offset;
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
        path.setAttribute('data-from', fromId);
        path.setAttribute('data-to', toId);
        edgesGroup.appendChild(path);

        const labelText = [...new Set(symbols.map(s => s || 'ε'))].join(', ');

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
