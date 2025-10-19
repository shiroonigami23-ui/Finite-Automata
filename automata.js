// automata.js
import { MACHINE } from './state.js';

/**
 * Validates the current automaton against the rules of its type (DFA, NFA, etc.).
 * @returns {{message: string, type: 'success'|'error'|'warning'}} Validation result.
 */
export function validateAutomaton() {
    const { states, transitions, type, alphabet } = MACHINE;
    if (!states || states.length === 0) {
        return { message: 'Automaton is empty.', type: 'warning' };
    }

    const initialStates = states.filter(s => s.initial);
    if (initialStates.length === 0) {
        return { message: 'Error: No initial state defined.', type: 'error' };
    }

    if (type === 'DFA') {
        if (initialStates.length > 1) {
            return { message: 'DFA Error: Multiple initial states found.', type: 'error' };
        }
        for (const state of states) {
            const symbols = new Set();
            for (const t of transitions.filter(tr => tr.from === state.id)) {
                if (t.symbol === '' || t.symbol === 'ε') {
                    return { message: `DFA Error: State ${state.id} has an ε-transition.`, type: 'error' };
                }
                if (symbols.has(t.symbol)) {
                    return { message: `DFA Error: State ${state.id} is not deterministic for symbol '${t.symbol}'.`, type: 'error' };
                }
                symbols.add(t.symbol);
            }
        }
    }
    
    // Check if all transition symbols are in the alphabet if alphabet is defined
    if (alphabet && alphabet.length > 0) {
        for (const t of transitions) {
            if (t.symbol && t.symbol !== 'ε' && !alphabet.includes(t.symbol)) {
                return { message: `Warning: Transition symbol '${t.symbol}' not in alphabet {${alphabet.join(', ')}}.`, type: 'warning' };
            }
        }
    }


    return { message: 'Automaton is valid.', type: 'success' };
}


export function convertEnfaToNfa(machine) {
    const m = JSON.parse(JSON.stringify(machine));
    const newTrans = [];
    const seen = new Set();
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
        for (const closureState of closure) {
            const sf = m.states.find(x => x.id === closureState);
            if (sf && sf.accepting) {
                const orig = m.states.find(x => x.id === st.id);
                if (orig) orig.accepting = true;
            }
        }
    }
    m.transitions = newTrans.filter(t => t.symbol !== '' && t.symbol !== 'ε');
    m.type = 'NFA';
    return m;
}

export function convertNfaToDfa(nfa) {
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
    const keyToNewId = new Map();
    Array.from(dfaStatesData.keys()).forEach((key, index) => {
        keyToNewId.set(key, `q${index}`);
    });


    for (const [key, data] of dfaStatesData.entries()) {
        const newId = keyToNewId.get(key);
        newMachine.states.push({
            id: newId,
            initial: key === initialKey,
            accepting: data.isAccepting,
            x: 200 + (i % 5) * 180,
            y: 150 + Math.floor(i / 5) * 150
        });
        i++;
    }

    for (const [key, data] of dfaStatesData.entries()) {
        const fromId = keyToNewId.get(key);
        for (const symbol of alphabet) {
            let toStateKey = data.transitions.get(symbol) || trapStateKey;
            const toId = keyToNewId.get(toStateKey);
            
            if(toId) {
                newMachine.transitions.push({
                    from: fromId,
                    to: toId,
                    symbol: symbol
                });
            }
        }
    }

    return newMachine;
}

export function minimizeDfa(dfa) {
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

export function computeEpsilonClosure(states, transitions) {
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
