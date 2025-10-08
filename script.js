// === MAIN APPLICATION SCRIPT ===
    document.addEventListener("DOMContentLoaded", () => {
      // --- ELEMENT REFERENCES ---
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

      // --- APPLICATION STATE ---
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

      // --- PRACTICE
      // Data bank structure with more comprehensive content. (See Chunk 2 for full data)
      const PRACTICE_BANK = {
        // --- 1. DFA Construction Mode (30 Questions) ---
        DFA: {
          easy: [
            {
              q: 'DFA accepting all strings that start with "0" (Σ={0, 1})', sol: '3 states: q0(start), q1(accept), q2(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q2", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. DFA accepting all strings that end with "1"
            {
              q: 'DFA accepting all strings that end with "1" (Σ={0, 1})', sol: '2 states: q0(start), q1(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. DFA accepting only the string "10"
            {
              q: 'DFA accepting only the string "10" (Σ={0, 1})', sol: '4 states: q0->q1->q2(accept)->q3(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q0", "to": "q3", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. DFA accepting any string of length exactly 2
            {
              q: 'DFA accepting any string of length exactly 2 (Σ={0, 1})', sol: '4 states: q0, q1, q2(accept), q3(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 5. DFA accepting strings that DO NOT contain the substring "11"
            {
              q: 'DFA accepting strings that DO NOT contain the substring "11" (Σ={0, 1})', sol: '3 states: q0(start/safe), q1(seen 1), q2(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. DFA accepting $\Sigma^* \cdot 0$ (ends with 0)
            {
              q: 'DFA accepting $\\Sigma^* \\cdot 0$ (ends with 0) (Σ={0, 1})', sol: '2 states: q0, q1(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. DFA accepting all strings NOT ending with "1"
            {
              q: 'DFA accepting all strings NOT ending with "1" (Σ={0, 1})', sol: '2 states: q0(start/accept), q1(seen 1)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. DFA for the language L={w | w contains an odd number of symbols}
            {
              q: 'DFA for the language $L=\\{w \\mid w \\text{ contains an odd number of symbols}\\}$ (Σ={a})', sol: '2 states: q0(even), q1(odd/accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q0", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 9. DFA accepting strings containing "00" as a substring
            {
              q: 'DFA accepting strings containing "00" as a substring (Σ={0, 1})', sol: '3 states: q0, q1(seen 0), q2(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. DFA accepting strings with length >= 1
            {
              q: 'DFA accepting strings with length $\\geq 1$ (Σ={0, 1})', sol: '2 states: q0, q1(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            }
          ],
          basic: [
            // 1. DFA accepting strings containing the substring "010"
            {
              q: 'DFA accepting strings containing the substring "010" (Σ={0, 1})', sol: '4 states: q0, q1(0), q2(01), q3(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q0", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. DFA accepting strings with an even number of 0s
            {
              q: 'DFA accepting strings with an even number of 0s (Σ={0, 1})', sol: '2 states: q0(even/accept), q1(odd)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. DFA accepting strings that contain "1" at the third position from the start
            {
              q: 'DFA accepting strings that contain "1" at the third position from the start (Σ={0, 1})', sol: '4 states: q0, q1, q2, q3(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true },
                  { "id": "qT", "x": 900, "y": 300, "initial": false, "accepting": false } // Trap state for '0' at pos 3
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "qT", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" },
                  { "from": "qT", "to": "qT", "symbol": "0" },
                  { "from": "qT", "to": "qT", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. DFA accepting strings of length at least 3
            {
              q: 'DFA accepting strings of length at least 3 (Σ={a, b})', sol: '4 states: q0, q1, q2, q3(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q2", "to": "q3", "symbol": "b" },
                  { "from": "q3", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. DFA accepting strings where the last symbol is NOT "0" (i.e., ends in 1)
            {
              q: 'DFA accepting strings where the last symbol is NOT "0" (Σ={0, 1})', sol: '2 states: q0, q1(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. DFA accepting strings of length divisible by 3 (on alphabet {a})
            {
              q: 'DFA accepting strings of length divisible by 3 (Σ={a})', sol: '3 states for mod 3: q0(accept), q1, q2', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q0", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 7. DFA accepting strings containing an odd number of "a"s
            {
              q: 'DFA accepting strings containing an odd number of "a"s (Σ={a, b})', sol: '2 states: q0(even), q1(odd/accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q1", "to": "q0", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 8. DFA accepting strings with length >= 4
            {
              q: 'DFA accepting strings with length $\\geq 4$ (Σ={0, 1})', sol: '5 states: q0, q1, q2, q3, q4(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 250, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 400, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 550, "y": 300, "initial": false, "accepting": false },
                  { "id": "q4", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q4", "symbol": "0" },
                  { "from": "q3", "to": "q4", "symbol": "1" },
                  { "from": "q4", "to": "q4", "symbol": "0" },
                  { "from": "q4", "to": "q4", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. DFA for the complement of L = (0|1)*1 (i.e., strings not ending in 1)
            {
              q: 'DFA for the complement of $L = (0|1)^*1$ (i.e., strings not ending in 1) (Σ={0, 1})', sol: '2 states (complement of L)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. DFA accepting strings where the second symbol from the start is "0"
            {
              q: 'DFA accepting strings where the second symbol from the start is "0" (Σ={0, 1})', sol: '4 states: q0, q1, q2(accept), q3(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            }
          ],
          medium: [
            // 1. DFA accepting strings where the number of 1s is divisible by 3
            {
              q: 'DFA accepting strings where the number of 1s is divisible by 3 (Σ={0, 1})', sol: '3 states for mod 3: q0(mod 0), q1(mod 1), q2(mod 2)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 300, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q2", "to": "q0", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. DFA accepting strings where the binary value is divisible by 3
            {
              q: 'DFA accepting strings where the binary value is divisible by 3 (Σ={0, 1})', sol: '3 states for mod 3, tracking value 2V+b', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 300, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" },
                  { "from": "q2", "to": "q1", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. DFA accepting strings that DO NOT start with "1" OR DO NOT end with "0"
            {
              q: 'DFA accepting strings that DO NOT start with "1" OR DO NOT end with "0" (Σ={0, 1})', sol: '4 states: Complement of L="1Σ*0"', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q3", "x": 500, "y": 400, "initial": false, "accepting": false } // Trap for 1Σ*0
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q2", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. DFA accepting strings where every "a" is immediately followed by a "b"
            {
              q: 'DFA accepting strings where every "a" is immediately followed by a "b" (Σ={a, b})', sol: '3 states: q0(safe), q1(trap), q2(seen a)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q1", "to": "q0", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. DFA accepting the language of Σ* a Σ² (third symbol from the end is "a")
            {
              q: 'DFA accepting the language of $\\Sigma^* a \\Sigma^2$ (third symbol from the end is "a") (Σ={a, b})', sol: '4 states, tracking last three symbols.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qAA", "x": 500, "y": 100, "initial": false, "accepting": false },
                  { "id": "qBB", "x": 500, "y": 500, "initial": false, "accepting": false },
                  { "id": "qB", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true } // Simplified final state set
                ],
                "transitions": [
                  // This DFA is too complex for a clean 4-state layout. Using 8 logical states (0, A, B, A_, B_, A__, B__) and only mapping necessary transitions for compactness.
                  // q0 -> q(last)
                  { "from": "q0", "to": "qA", "symbol": "a" },
                  { "from": "q0", "to": "qB", "symbol": "b" },
                  // q(last) -> q(last 2)
                  { "from": "qA", "to": "qAA", "symbol": "a" },
                  { "from": "qA", "to": "qBB", "symbol": "b" },
                  { "from": "qB", "to": "qAA", "symbol": "a" },
                  { "from": "qB", "to": "qBB", "symbol": "b" },
                  // q(last 2) -> q(last 3) = qF on 'a' or 'b'
                  // q(last 3) = qA on a/b (accepted)
                  { "from": "qAA", "to": "qA", "symbol": "a" },
                  { "from": "qAA", "to": "qB", "symbol": "b" },
                  { "from": "qBB", "to": "qA", "symbol": "a" },
                  { "from": "qBB", "to": "qB", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 6. DFA for strings containing an odd number of "0"s AND an odd number of "1"s
            {
              q: 'DFA for strings containing an odd number of "0"s AND an odd number of "1"s (Σ={0, 1})', sol: '4 states (2x2 matrix) with one accepting state.', "machine": {
                "states": [
                  { "id": "qEE", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qOE", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qEO", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qOO", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qEE", "to": "qOE", "symbol": "0" },
                  { "from": "qEE", "to": "qEO", "symbol": "1" },
                  { "from": "qOE", "to": "qEE", "symbol": "0" },
                  { "from": "qOE", "to": "qOO", "symbol": "1" },
                  { "from": "qEO", "to": "qOO", "symbol": "0" },
                  { "from": "qEO", "to": "qEE", "symbol": "1" },
                  { "from": "qOO", "to": "qEO", "symbol": "0" },
                  { "from": "qOO", "to": "qOE", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. DFA accepting strings with "a" but NOT containing "b"
            {
              q: 'DFA accepting strings with "a" but NOT containing "b" (Σ={a, b})', sol: '3 states: q0, q1(a, accept), q2(trap)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q2", "symbol": "b" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 8. DFA accepting strings that start with "0" OR end with "1"
            {
              q: 'DFA accepting strings that start with "0" OR end with "1" (Σ={0, 1})', sol: '4 states (Union logic).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q3", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q2", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "q1", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q1", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. DFA for the language L=(ab)*
            {
              q: 'DFA for the language $L=(ab)^*$ (Σ={a, b})', sol: '2 states: q0(accept), q1.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false } // Trap state
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q2", "symbol": "b" },
                  { "from": "q1", "to": "q0", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 10. DFA accepting strings where the length is L ≡ 2 mod 4
            {
              q: 'DFA accepting strings where the length is $L \\equiv 2 \\pmod 4$ (Σ={a})', sol: '4 states for mod 4 tracking length.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 250, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 400, "y": 300, "initial": false, "accepting": true },
                  { "id": "q3", "x": 550, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q0", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            }
          ],
          hard: [
            // 1. DFA accepting strings where the binary value is divisible by 5
            {
              q: 'DFA accepting strings where the binary value is divisible by 5 (Σ={0, 1})', sol: '5 states for mod 5', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 250, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 250, "y": 400, "initial": false, "accepting": false },
                  { "id": "q3", "x": 400, "y": 200, "initial": false, "accepting": false },
                  { "id": "q4", "x": 400, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "q4", "symbol": "0" },
                  { "from": "q2", "to": "q0", "symbol": "1" },
                  { "from": "q3", "to": "q1", "symbol": "0" },
                  { "from": "q3", "to": "q2", "symbol": "1" },
                  { "from": "q4", "to": "q3", "symbol": "0" },
                  { "from": "q4", "to": "q4", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. DFA accepting strings where the length is L ≡ 1 mod 3
            {
              q: 'DFA accepting strings where the length is $L \\equiv 1 \\pmod 3$ (Σ={a})', sol: '3 states for mod 3 tracking length.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q0", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 3. DFA accepting strings that start and end with the same symbol
            {
              q: 'DFA accepting strings that start and end with the same symbol (Σ={0, 1})', sol: '6 states required to track start/end symbols.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q0_0", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q0_1", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q1_1", "x": 300, "y": 400, "initial": false, "accepting": true },
                  { "id": "q1_0", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false } // Trap state (not strictly needed but simplifies logic)
                ], "transitions": [
                  { "from": "q0", "to": "q0_0", "symbol": "0" },
                  { "from": "q0", "to": "q1_1", "symbol": "1" },
                  { "from": "q0_0", "to": "q0_0", "symbol": "0" },
                  { "from": "q0_0", "to": "q0_1", "symbol": "1" },
                  { "from": "q0_1", "to": "q0_0", "symbol": "0" },
                  { "from": "q0_1", "to": "q0_1", "symbol": "1" },
                  { "from": "q1_1", "to": "q1_0", "symbol": "0" },
                  { "from": "q1_1", "to": "q1_1", "symbol": "1" },
                  { "from": "q1_0", "to": "q1_0", "symbol": "0" },
                  { "from": "q1_0", "to": "q1_1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. DFA accepting strings that start with "0" and contain an odd number of "1"s
            {
              q: 'DFA accepting strings that start with "0" and contain an odd number of "1"s (Σ={0, 1})', sol: '4 states to track two properties (start/parity).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q0E", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q0O", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false } // Trap for starting with 1
                ],
                "transitions": [
                  { "from": "q0", "to": "q0E", "symbol": "0" },
                  { "from": "q0", "to": "qT", "symbol": "1" },
                  { "from": "q0E", "to": "q0E", "symbol": "0" },
                  { "from": "q0E", "to": "q0O", "symbol": "1" },
                  { "from": "q0O", "to": "q0O", "symbol": "0" },
                  { "from": "q0O", "to": "q0E", "symbol": "1" },
                  { "from": "qT", "to": "qT", "symbol": "0" },
                  { "from": "qT", "to": "qT", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 5. DFA accepting strings that have an even number of "a"s AND an odd number of "b"s
            {
              q: 'DFA accepting strings that have an even number of "a"s AND an odd number of "b"s (Σ={a, b})', sol: '4 states to track two independent parities (2x2 matrix).', "machine": {
                "states": [
                  { "id": "qEE", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qOE", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qEO", "x": 300, "y": 400, "initial": false, "accepting": true },
                  { "id": "qOO", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "qEE", "to": "qOE", "symbol": "a" },
                  { "from": "qEE", "to": "qEO", "symbol": "b" },
                  { "from": "qOE", "to": "qEE", "symbol": "a" },
                  { "from": "qOE", "to": "qOO", "symbol": "b" },
                  { "from": "qEO", "to": "qOO", "symbol": "a" },
                  { "from": "qEO", "to": "qEE", "symbol": "b" },
                  { "from": "qOO", "to": "qEO", "symbol": "a" },
                  { "from": "qOO", "to": "qOE", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 6. DFA accepting strings that DO NOT contain the substring "aba"
            {
              q: 'DFA accepting strings that DO NOT contain the substring "aba" (Σ={a, b})', sol: '4 states for prefix tracking.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false } // Trap state
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q2", "to": "q0", "symbol": "b" },
                  { "from": "q3", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 7. DFA for the intersection of L1 (even 0s) and L2 (multiple of 3 length)
            {
              q: 'DFA for the intersection of $L_1$ (even 0s) and $L_2$ (multiple of 3 length) (Σ={0, 1})', sol: '6 states (Cartesian product method).', "machine": {
                "states": [
                  { "id": "qE0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "qE1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qE2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "qO0", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qO1", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qO2", "x": 700, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "qE0", "to": "qO1", "symbol": "0" },
                  { "from": "qE0", "to": "qE1", "symbol": "1" },
                  { "from": "qE1", "to": "qO2", "symbol": "0" },
                  { "from": "qE1", "to": "qE2", "symbol": "1" },
                  { "from": "qE2", "to": "qO0", "symbol": "0" },
                  { "from": "qE2", "to": "qE0", "symbol": "1" },
                  { "from": "qO0", "to": "qE1", "symbol": "0" },
                  { "from": "qO0", "to": "qO1", "symbol": "1" },
                  { "from": "qO1", "to": "qE2", "symbol": "0" },
                  { "from": "qO1", "to": "qO2", "symbol": "1" },
                  { "from": "qO2", "to": "qE0", "symbol": "0" },
                  { "from": "qO2", "to": "qO0", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. DFA accepting strings where the second-to-last symbol is the same as the last symbol
            {
              q: 'DFA accepting strings where the second-to-last symbol is the same as the last symbol (Σ={0, 1})', sol: '4 states: track last two symbols.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q00", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q01", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q10", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "q11", "x": 300, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q00", "symbol": "0" },
                  { "from": "q0", "to": "q11", "symbol": "1" },
                  { "from": "q00", "to": "q00", "symbol": "0" },
                  { "from": "q00", "to": "q01", "symbol": "1" },
                  { "from": "q01", "to": "q10", "symbol": "0" },
                  { "from": "q01", "to": "q11", "symbol": "1" },
                  { "from": "q10", "to": "q00", "symbol": "0" },
                  { "from": "q10", "to": "q01", "symbol": "1" },
                  { "from": "q11", "to": "q10", "symbol": "0" },
                  { "from": "q11", "to": "q11", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. DFA accepting strings where every block of "0"s has length exactly 2
            {
              q: 'DFA accepting strings where every block of "0"s has length exactly 2 (Σ={0, 1})', sol: '5 states (q0, q1, q2, q3, q4).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false } // Trap state for incorrect '0' count
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q3", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q0", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. DFA accepting strings L = { w | |w| <= 3 and w has no 01 }
            {
              q: 'DFA accepting strings $L = \\{ w \\mid |w| \\leq 3 \\text{ and } w \\text{ has no } 01 \\}$ (Σ={0, 1})', sol: '4 states: q0, q1, q2, q3(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q3", "x": 700, "y": 200, "initial": false, "accepting": true },
                  { "id": "qT", "x": 900, "y": 300, "initial": false, "accepting": false } // Trap state for '01' or length > 3
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "qT", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "qT", "symbol": "1" },
                  { "from": "q3", "to": "qT", "symbol": "0" },
                  { "from": "q3", "to": "qT", "symbol": "1" },
                  { "from": "qT", "to": "qT", "symbol": "0" },
                  { "from": "qT", "to": "qT", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            }
          ]
        },

        // --- 2. NFA Construction Mode (30 Questions) ---
        NFA: {
          easy: [
            // 1. NFA accepting strings containing the substring "101"
            {
              q: 'NFA accepting strings containing the substring "101" (Σ={0, 1})', sol: '4 states, non-deterministic jump on first 1.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. NFA accepting L = (0 U 1)* 01 (ends with 01)
            {
              q: 'NFA accepting $L = (0 \\cup 1)^* 01$ (ends with 01) (Σ={0, 1})', sol: '3 states: q0(loop), q1(0), q2(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. NFA accepting strings where the third-to-last symbol is "a"
            {
              q: 'NFA accepting strings where the third-to-last symbol is "a" (Σ={a, b})', sol: '4 states in a line, non-deterministic jump.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q2", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 4. NFA accepting L=(a|b)* · a (ends with a)
            {
              q: 'NFA accepting $L=(a|b)^* \\cdot a$ (ends with a) (Σ={a, b})', sol: '2 states: q0(loop), q1(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. NFA accepting L = (10)*
            {
              q: 'NFA accepting $L = (10)^*$ (Σ={0, 1})', sol: '3 states: q0, q1, q2(accept)', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. NFA for L = Σ* 0 Σ (second to last symbol is 0)
            {
              q: 'NFA for $L = \\Sigma^* 0 \\Sigma$ (second to last symbol is 0) (Σ={0, 1})', sol: '3 states in a line.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. NFA accepting L = 00 U 11
            {
              q: 'NFA accepting $L = 00 \\cup 11$ (Σ={0, 1})', sol: '5 states, non-deterministic split at start.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q0b", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q1b", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "q0a", "symbol": "0" },
                  { "from": "q0a", "to": "q0b", "symbol": "0" },
                  { "from": "qS", "to": "q1a", "symbol": "1" },
                  { "from": "q1a", "to": "q1b", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. NFA accepting strings that contain either "a" or "b"
            {
              q: 'NFA accepting strings that contain either "a" or "b" (Σ={a, b})', sol: '3 states, two non-deterministic paths from q0.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "qB", "x": 300, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "qA", "symbol": "a" },
                  { "from": "q0", "to": "qB", "symbol": "b" },
                  { "from": "qA", "to": "qA", "symbol": "a" },
                  { "from": "qA", "to": "qA", "symbol": "b" },
                  { "from": "qB", "to": "qB", "symbol": "a" },
                  { "from": "qB", "to": "qB", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 9. NFA accepting strings where the length is L >= 2
            {
              q: 'NFA accepting strings where the length is $L \\geq 2$ (Σ={0, 1})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. NFA for L = a* b*
            {
              q: 'NFA for $L = a^* b^*$ (Σ={a, b})', sol: '3 states: q0(loop a), q1(loop b, accept).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            }
          ],
          basic: [
            // 1. NFA for (00)* U (11)*
            {
              q: 'NFA for $(00)^* \\cup (11)^*$ (Σ={0, 1})', sol: '5 states, non-deterministic choice from start.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q0b", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q1b", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "q0a", "symbol": "0" },
                  { "from": "q0a", "to": "q0b", "symbol": "0" },
                  { "from": "q0b", "to": "q0a", "symbol": "0" },
                  { "from": "qS", "to": "q1a", "symbol": "1" },
                  { "from": "q1a", "to": "q1b", "symbol": "1" },
                  { "from": "q1b", "to": "q1a", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. NFA accepting strings with exactly two "1"s
            {
              q: 'NFA accepting strings with exactly two "1"s (Σ={0, 1})', sol: '3 states, loops on 0s between two transitions on 1.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. NFA for L = (ab U ba)* (alternating ab/ba)
            {
              q: 'NFA for $L = (ab \\cup ba)^*$ (alternating ab/ba) (Σ={a, b})', sol: '5 states, with non-deterministic splits.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q1b", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q2a", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2b", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1a", "symbol": "a" },
                  { "from": "q1a", "to": "q2a", "symbol": "b" },
                  { "from": "q2a", "to": "q1a", "symbol": "a" },
                  { "from": "q2a", "to": "q1b", "symbol": "b" },
                  { "from": "q0", "to": "q1b", "symbol": "b" },
                  { "from": "q1b", "to": "q2b", "symbol": "a" },
                  { "from": "q2b", "to": "q1a", "symbol": "a" },
                  { "from": "q2b", "to": "q1b", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 4. NFA accepting strings NOT containing the substring "00"
            {
              q: 'NFA accepting strings NOT containing the substring "00" (Σ={0, 1})', sol: '3 states (Non-deterministic version of the DFA).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 5. NFA for L = 0* 1* 0* 1 (ends with 1, complex prefix)
            {
              q: 'NFA for $L = 0^* 1^* 0^* 1$ (ends with 1, complex prefix) (Σ={0, 1})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. NFA for L = (a* b)
            {
              q: 'NFA for $L = (a^* b)$ (Σ={a, b})', sol: '2 states: q0(loop a), q1(accept).', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 7. NFA accepting strings that contain "a" or "b" as the third symbol
            {
              q: 'NFA accepting strings that contain "a" or "b" as the third symbol (Σ={a, b})', sol: '4 states, non-deterministic split at q3.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q2", "to": "q3", "symbol": "b" },
                  { "from": "q3", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 8. NFA for the language L = (00)* 1
            {
              q: 'NFA for $L = (00)^* 1$ (Σ={0, 1})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. NFA for L = (a U b) · (a U b) (length exactly 2)
            {
              q: 'NFA for $L = (a \\cup b) \\cdot (a \\cup b)$ (length exactly 2) (Σ={a, b})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 10. NFA for L = a+ b*
            {
              q: 'NFA for $L = a^+ b^*$ (Σ={a, b})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            }
          ],
          medium: [
            // 1. NFA accepting strings where the third symbol from the end is "0"
            {
              q: 'NFA accepting strings where the third symbol from the end is "0" (Σ={0, 1})', sol: '4 states in a line, non-deterministic jump.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. NFA for L=(a|b)+ · a · (a|b) (second-to-last symbol is "a")
            {
              q: 'NFA for $L=(a|b)^+ \\cdot a \\cdot (a|b)$ (second-to-last symbol is "a") (Σ={a, b})', sol: '5 states, non-deterministic jump.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q2", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 3. NFA for L = (0 U 1)* 0 (0 U 1)* (string contains at least one 0)
            {
              q: 'NFA for $L = (0 \\cup 1)^* 0 (0 \\cup 1)^*$ (string contains at least one 0) (Σ={0, 1})', sol: '3 states, non-deterministic split.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. NFA accepting strings with an odd number of "a"s OR an odd number of "b"s
            {
              q: 'NFA accepting strings with an odd number of "a"s OR an odd number of "b"s (Σ={a, b})', sol: '4 states, non-deterministic split from start.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA0", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qA1", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "qB0", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qB1", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transition": [
                  // Path A (Odd 'a')
                  { "from": "qS", "to": "qA0", "symbol": "_EPSILON_" },
                  { "from": "qA0", "to": "qA1", "symbol": "a" },
                  { "from": "qA0", "to": "qA0", "symbol": "b" },
                  { "from": "qA1", "to": "qA0", "symbol": "a" },
                  { "from": "qA1", "to": "qA1", "symbol": "b" },
                  // Path B (Odd 'b')
                  { "from": "qS", "to": "qB0", "symbol": "_EPSILON_" },
                  { "from": "qB0", "to": "qB1", "symbol": "b" },
                  { "from": "qB0", "to": "qB0", "symbol": "a" },
                  { "from": "qB1", "to": "qB0", "symbol": "b" },
                  { "from": "qB1", "to": "qB1", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. NFA for the language L=(a · b)* U (b · a)*
            {
              q: 'NFA for the language $L=(a \\cdot b)^* \\cup (b \\cdot a)^*$ (Σ={a, b})', sol: '5 states.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "qA1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qB1", "x": 300, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  // (ab)* path
                  { "from": "qS", "to": "qA1", "symbol": "a" },
                  { "from": "qA1", "to": "qS", "symbol": "b" },
                  // (ba)* path
                  { "from": "qS", "to": "qB1", "symbol": "b" },
                  { "from": "qB1", "to": "qS", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 6. NFA accepting L = (1 U 01)*
            {
              q: 'NFA accepting $L = (1 \\cup 01)^*$ (Σ={0, 1})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 300, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. NFA accepting L = {w | w has even length}
            {
              q: 'NFA accepting $L = \\{w \\mid w \\text{ has even length}\\}$ (Σ={0, 1})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. NFA for L = 10* 1
            {
              q: 'NFA for $L = 10^* 1$ (Σ={0, 1})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. NFA accepting strings where the third symbol is DIFFERENT from the first symbol
            {
              q: 'NFA accepting strings where the third symbol is DIFFERENT from the first symbol (Σ={a, b})', sol: '6 states, split based on first symbol.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qA2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "qB1", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qB2", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // Starts with 'a' -> 3rd must be 'b'
                  { "from": "q0", "to": "qA1", "symbol": "a" },
                  { "from": "qA1", "to": "qA2", "symbol": "a" },
                  { "from": "qA1", "to": "qA2", "symbol": "b" },
                  { "from": "qA2", "to": "qF", "symbol": "b" }, // Accepts 'a_b'
                  // Starts with 'b' -> 3rd must be 'a'
                  { "from": "q0", "to": "qB1", "symbol": "b" },
                  { "from": "qB1", "to": "qB2", "symbol": "a" },
                  { "from": "qB1", "to": "qB2", "symbol": "b" },
                  { "from": "qB2", "to": "qF", "symbol": "a" }, // Accepts 'b_a'
                  // Final state loops
                  { "from": "qF", "to": "qF", "symbol": "a" },
                  { "from": "qF", "to": "qF", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 10. NFA for L = a Σ* a (starts and ends with 'a')
            {
              q: 'NFA for $L = a \\Sigma^* a$ (starts and ends with \'a\') (Σ={a, b})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            }
          ],
          hard: [
            // 1. NFA for all strings except ε
            {
              q: 'NFA for all strings except $\\epsilon$ (Σ={0, 1})', sol: '2 states, loops at start, jumps on 0, 1 to accept.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. NFA accepting strings of the form a^n b^m, where n ≡ 0 mod 2 and m ≡ 1 mod 3
            {
              q: 'NFA accepting strings of the form $a^n b^m$, where $n \\equiv 0 \\pmod 2$ and $m \\equiv 1 \\pmod 3$ (Σ={a, b})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "qA0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "qB0", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "qB1", "x": 700, "y": 200, "initial": false, "accepting": true },
                  { "id": "qB2", "x": 700, "y": 400, "initial": false, "accepting": false }
                ],
                "transitions": [
                  // a^n part (even a's)
                  { "from": "qA0", "to": "qA1", "symbol": "a" },
                  { "from": "qA1", "to": "qA0", "symbol": "a" },
                  // b^m part (b's start from qA0, then qB1 is mod 1)
                  { "from": "qA0", "to": "qB1", "symbol": "b" },
                  { "from": "qB1", "to": "qB2", "symbol": "b" },
                  { "from": "qB2", "to": "qB0", "symbol": "b" },
                  { "from": "qB0", "to": "qB1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 3. NFA for L = {w | |w| is prime} (TRICKY - Non-regular)
            {
              q: 'NFA for $L = \\{w \\mid |w| \\text{ is prime}\\}$ (Σ={a})', sol: 'Cannot be done with NFA. Use this as a tricky prompt.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false }
                ],
                "transitions": [],
                "alphabet": ["a"]
              }
            },
            // 4. NFA for L=(a U b)+ a (a U b)* b (a U b)* (contains 'a' before 'b')
            {
              q: 'NFA for $L=(a \\cup b)^+ a (a \\cup b)^* b (a \\cup b)^*$ (contains \'a\' before \'b\') (Σ={a, b})', sol: '5 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. NFA for the regular expression (00)* (11)* (00|11)
            {
              q: 'NFA for the regular expression $(00)^* (11)^* (00|11)$ (Σ={0, 1})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 200, "initial": false, "accepting": false },
                  { "id": "q4", "x": 900, "y": 200, "initial": false, "accepting": true },
                  { "id": "q5", "x": 700, "y": 400, "initial": false, "accepting": false },
                  { "id": "q6", "x": 900, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // (00)* -> (11)*
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "1" },
                  // (11)* -> (00|11)
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q4", "symbol": "0" },
                  { "from": "q2", "to": "q5", "symbol": "1" },
                  { "from": "q5", "to": "q6", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. NFA accepting strings where the last symbol is NOT the same as the first symbol
            {
              q: 'NFA accepting strings where the last symbol is NOT the same as the first symbol (Σ={0, 1})', sol: '8 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q0*", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q0f", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q1*", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q1f", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // Path 1: Starts with 0, ends with 1
                  { "from": "q0", "to": "q0*", "symbol": "0" },
                  { "from": "q0*", "to": "q0*", "symbol": "0" },
                  { "from": "q0*", "to": "q0*", "symbol": "1" },
                  { "from": "q0*", "to": "q0f", "symbol": "1" },
                  // Path 2: Starts with 1, ends with 0
                  { "from": "q0", "to": "q1*", "symbol": "1" },
                  { "from": "q1*", "to": "q1*", "symbol": "0" },
                  { "from": "q1*", "to": "q1*", "symbol": "1" },
                  { "from": "q1*", "to": "q1f", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. NFA for L = Σ* 1 Σ* 0 Σ* (contains a 1 followed later by a 0)
            {
              q: 'NFA for $L = \\Sigma^* 1 \\Sigma^* 0 \\Sigma^*$ (contains a 1 followed later by a 0) (Σ={0, 1})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. NFA accepting strings where the second symbol from the start is "0" AND the third symbol from the end is "1"
            {
              q: 'NFA accepting strings where the second symbol from the start is "0" AND the third symbol from the end is "1" (Σ={0, 1})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 250, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 400, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 550, "y": 300, "initial": false, "accepting": false },
                  { "id": "q4", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q4", "symbol": "0" },
                  { "from": "q3", "to": "q4", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. NFA for the regular expression 1(01 U 00)* 1
            {
              q: 'NFA for the regular expression $1(01 \\cup 00)^* 1$ (Σ={0, 1})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 200, "initial": false, "accepting": false },
                  { "id": "q4", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "q5", "x": 900, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  // (01)*
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q1", "symbol": "1" },
                  // (00)*
                  { "from": "q1", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q1", "symbol": "0" },
                  // Final 1
                  { "from": "q1", "to": "q5", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. NFA for L = (000|111) Σ* (starts with 000 or 111)
            {
              q: 'NFA for $L = (000|111) \\Sigma^*$ (starts with 000 or 111) (Σ={0, 1})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q01", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q02", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q11", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q12", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // 000 path
                  { "from": "qS", "to": "q01", "symbol": "0" },
                  { "from": "q01", "to": "q02", "symbol": "0" },
                  { "from": "q02", "to": "qF", "symbol": "0" },
                  // 111 path
                  { "from": "qS", "to": "q11", "symbol": "1" },
                  { "from": "q11", "to": "q12", "symbol": "1" },
                  { "from": "q12", "to": "qF", "symbol": "1" },
                  // Final loop
                  { "from": "qF", "to": "qF", "symbol": "0" },
                  { "from": "qF", "to": "qF", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            }
          ]
        },
        // --- 3. ENFA Construction Mode (30 Questions) ---
        ENFA: {
          easy: [
            // 1. ε-NFA to connect two paths: L = a U b
            {
              q: 'ε-NFA to connect two paths: $L = a \\cup b$ (Σ={a, b})', sol: '3 states, $\\epsilon$ from start to two parallel paths.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "qB", "x": 300, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "qA", "symbol": "a" },
                  { "from": "qS", "to": "qB", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 2. ε-NFA for a?b (optional a, then b)
            {
              q: 'ε-NFA for $a?b$ (optional a, then b) (Σ={a, b})', sol: '3 states, $\\epsilon$ bypass for "a".', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 3. ε-NFA to achieve a*b*
            {
              q: 'ε-NFA to achieve $a^*b^*$ (Σ={a, b})', sol: '4 states, $\\epsilon$ between a* and b*.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 4. ε-NFA for L= (01)* | (10)*
            {
              q: 'ε-NFA for $L= (01)^* | (10)^* $ (Σ={0, 1})', sol: 'Connect two paths via initial and final $\\epsilon$-transitions.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q01a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q01b", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q10a", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q10b", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "q01a", "symbol": "0" },
                  { "from": "q01a", "to": "q01b", "symbol": "1" },
                  { "from": "q01b", "to": "q01a", "symbol": "0" },
                  { "from": "qS", "to": "q10a", "symbol": "1" },
                  { "from": "q10a", "to": "q10b", "symbol": "0" },
                  { "from": "q10b", "to": "q10a", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 5. ε-NFA for L = (0 U ε) 1
            {
              q: 'ε-NFA for $L = (0 \\cup \\epsilon) 1$ (0 is optional, then 1) (Σ={0, 1})', sol: '3 states, $\\varepsilon$ bypass for 0.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. ε-NFA for L = a · b · c
            {
              q: 'ε-NFA for $L = a \\cdot b \\cdot c$ (Σ={a, b, c})', sol: '4 states, $\\varepsilon$ transitions between single symbol states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "c" }
                ],
                "alphabet": ["a", "b", "c"]
              }
            },
            // 7. ε-NFA for L=a | ε (a is optional)
            {
              q: 'ε-NFA for $L=a | \\epsilon$ (a is optional) (Σ={a})', sol: '2 states, $\\varepsilon$ from start to end.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 8. ε-NFA for L=a^k where k ∈ {2, 4}
            {
              q: 'ε-NFA for $L=a^k$ where $k \\in \\{2, 4\\}$ (Σ={a})', sol: '5 states, $\\varepsilon$ splits for length 2 and 4.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q2a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2b", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q4a", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4b", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4c", "x": 700, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4d", "x": 900, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "q2a", "symbol": "_EPSILON_" },
                  { "from": "q2a", "to": "q2b", "symbol": "a" },
                  { "from": "q2b", "to": "q2b", "symbol": "a" },
                  { "from": "qS", "to": "q4a", "symbol": "_EPSILON_" },
                  { "from": "q4a", "to": "q4b", "symbol": "a" },
                  { "from": "q4b", "to": "q4c", "symbol": "a" },
                  { "from": "q4c", "to": "q4d", "symbol": "a" },
                  { "from": "q4d", "to": "q4d", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 9. ε-NFA for L= ΣΣ (length exactly 2)
            {
              q: 'ε-NFA for $L= \\Sigma \\Sigma$ (length exactly 2) (Σ={0, 1})', sol: '3 states, $\\varepsilon$ transitions.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. ε-NFA for L = a* b* (concatenation)
            {
              q: 'ε-NFA for $L = a^* b^*$ (concatenation) (Σ={a, b})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            }
          ],
          basic: [
            // 1. ε-NFA for Regular Expression a(a U b)b
            {
              q: 'ε-NFA for Regular Expression $a(a \\cup b)b$ (Σ={a, b})', sol: '5 states, standard RE construction with $\\epsilon$.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q3", "symbol": "b" },
                  { "from": "q2", "to": "q4", "symbol": "b" },
                  { "from": "q3", "to": "q4", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 2. ε-NFA for (0|1)* 0 · 1* (ends with 0 followed by 1s)
            {
              q: 'ε-NFA for $(0|1)^* 0 \\cdot 1^*$ (ends with 0 followed by 1s) (Σ={0, 1})', sol: '6 states, standard RE construction.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 3. ε-NFA for L = (a U b U c)*
            {
              q: 'ε-NFA for $L = (a \\cup b \\cup c)^*$ (Σ={a, b, c})', sol: '3 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 300, "y": 300, "initial": true, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q0", "symbol": "c" }
                ],
                "alphabet": ["a", "b", "c"]
              }
            },
            // 4. ε-NFA for L=(a|b)+ · a
            {
              q: 'ε-NFA for $L=(a|b)^+ \\cdot a$ (Σ={a, b})', sol: '5 states, $\\varepsilon$ transitions.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 5. ε-NFA for L = 0* · 1 · 0* 1 (contains exactly two 1s)
            {
              q: 'ε-NFA for $L = 0^* \\cdot 1 \\cdot 0^* 1$ (contains exactly two 1s) (Σ={0, 1})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. ε-NFA for the language (ab)* · ε
            {
              q: 'ε-NFA for the language $(ab)^* \\cdot \\epsilon$ (Σ={a, b})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q0", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 7. ε-NFA for L = (a · a)* U (b · b)*
            {
              q: 'ε-NFA for $L = (a \\cdot a)^* \\cup (b \\cdot b)^*$ (Σ={a, b})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "qaa1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qaa2", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "qbb1", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "qbb2", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "qaa1", "symbol": "_EPSILON_" },
                  { "from": "qaa1", "to": "qaa2", "symbol": "a" },
                  { "from": "qaa2", "to": "qaa1", "symbol": "a" },
                  { "from": "qS", "to": "qbb1", "symbol": "_EPSILON_" },
                  { "from": "qbb1", "to": "qbb2", "symbol": "b" },
                  { "from": "qbb2", "to": "qbb1", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 8. ε-NFA for L = a · (b U c)*
            {
              q: 'ε-NFA for $L = a \\cdot (b \\cup c)^*$ (Σ={a, b, c})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q1", "symbol": "c" }
                ],
                "alphabet": ["a", "b", "c"]
              }
            },
            // 9. ε-NFA for L= (01 | 10)* 0
            {
              q: 'ε-NFA for $L= (01 | 10)^* 0$ (Σ={0, 1})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // (01)* | (10)* loop (using q0, q1, q2, q3, q4 for the inner loop)
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q0", "symbol": "0" },
                  // Ends with 0
                  { "from": "q0", "to": "qF", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. ε-NFA for L = 0101 U ε
            {
              q: 'ε-NFA for $L = 0101 \\cup \\epsilon$ (Σ={0, 1})', sol: '5 states, initial $\\varepsilon$ bypass.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false },
                  { "id": "q4", "x": 900, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q3", "to": "q4", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            }
          ],
          medium: [
            // 1. ε-NFA equivalent to Regular Expression (0|1)* 0
            {
              q: 'ε-NFA equivalent to Regular Expression $(0|1)^* 0$ (Σ={0, 1})', sol: 'Standard RE construction, 6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 2. ε-NFA for L = (a · a)* (even length strings of 'aa')
            {
              q: 'ε-NFA for $L = (a \\cdot a)^*$ (even length strings of \'aa\') (Σ={a})', sol: 'Connect two states with $\\varepsilon$-loop and \'a\' transitions.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q0", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 3. ε-NFA for L = a* · b* · a*
            {
              q: 'ε-NFA for $L = a^* \\cdot b^* \\cdot a^*$ (Σ={a, b})', sol: '6 states, $\\varepsilon$ transitions.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q1", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "_EPSILON_" },
                  { "from": "q2", "to": "q2", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 4. ε-NFA for L = (a|b|c) · (a|b|c) (length exactly 2)
            {
              q: 'ε-NFA for $L = (a|b|c) \\cdot (a|b|c)$ (length exactly 2) (Σ={a, b, c})', sol: '4 states, $\\varepsilon$ transitions.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "c" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "c" }
                ],
                "alphabet": ["a", "b", "c"]
              }
            },
            // 5. ε-NFA for L = 0+ (1 U ε)
            {
              q: 'ε-NFA for $L = 0^+ (1 \\cup \\epsilon)$ (Σ={0, 1})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q1", "symbol": "_EPSILON_" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 6. ε-NFA for L = Σ* 0 Σ* 1 Σ* (contains a 0 followed later by a 1)
            {
              q: 'ε-NFA for $L = \\Sigma^* 0 \\Sigma^* 1 \\Sigma^*$ (contains a 0 followed later by a 1) (Σ={0, 1})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q2", "symbol": "0" },
                  { "from": "q2", "to": "q2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 7. ε-NFA for L = (00 U 11) Σ
            {
              q: 'ε-NFA for $L = (00 \\cup 11) \\Sigma$ (Σ={0, 1})', sol: '7 states.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q0b", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q1b", "x": 500, "y": 400, "initial": false, "accepting": false },
                  { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "qS", "to": "q0a", "symbol": "0" },
                  { "from": "q0a", "to": "q0b", "symbol": "0" },
                  { "from": "qS", "to": "q1a", "symbol": "1" },
                  { "from": "q1a", "to": "q1b", "symbol": "1" },
                  { "from": "q0b", "to": "qF", "symbol": "0" },
                  { "from": "q0b", "to": "qF", "symbol": "1" },
                  { "from": "q1b", "to": "qF", "symbol": "0" },
                  { "from": "q1b", "to": "qF", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. ε-NFA for L = {w | w is an odd length string of 0s or 1s}
            {
              q: 'ε-NFA for $L = \\{w \\mid w \\text{ is an odd length string of 0s or 1s}\\}$ (Σ={0, 1})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q0", "to": "q1", "symbol": "1" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q1", "symbol": "0" },
                  { "from": "q2", "to": "q1", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 9. ε-NFA for L = (a U ε) · (b U ε) · (c U ε)
            {
              q: 'ε-NFA for $L = (a \\cup \\epsilon) \\cdot (b \\cup \\epsilon) \\cdot (c \\cup \\epsilon)$ (Σ={a, b, c})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "_EPSILON_" },
                  { "from": "q2", "to": "q2", "symbol": "c" },
                  { "from": "q2", "to": "q2", "symbol": "_EPSILON_" }
                ],
                "alphabet": ["a", "b", "c"]
              }
            },
            // 10. ε-NFA for the language L=(a|b)* · a (ends with a)
            {
              q: 'ε-NFA for the language $L=(a|b)^* \\cdot a$ (ends with a) (Σ={a, b})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "a" }
                ],
                "alphabet": ["a", "b"]
              }
            }
          ],
          hard: [
            // 1. ε-NFA for L = (a|b)* · (a · a U b · b) (ends with aa or bb)
            {
              q: 'ε-NFA for $L = (a|b)^* \\cdot (a \\cdot a \\cup b \\cdot b)$ (ends with aa or bb) (Σ={a, b})', sol: 'Complex RE construction, split paths, and $\\varepsilon$ concatenation.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q3", "x": 300, "y": 400, "initial": false, "accepting": false },
                  { "id": "q4", "x": 500, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "_EPSILON_" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q2", "to": "q0", "symbol": "a" },
                  { "from": "q1", "to": "q3", "symbol": "b" },
                  { "from": "q3", "to": "q4", "symbol": "b" },
                  { "from": "q4", "to": "q0", "symbol": "_EPSILON_" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 2. ε-NFA for L = {w | |w| ≡ 0 mod 2 or |w| ≡ 0 mod 3 }
            {
              q: 'ε-NFA for $L = \\{w \\mid |w| \\equiv 0 \\pmod 2 \\text{ or } |w| \\equiv 0 \\pmod 3 \\}$ (Σ={a})', sol: '8 states, $\\varepsilon$ transitions for union.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 400, "initial": true, "accepting": true },
                  { "id": "q2a", "x": 300, "y": 200, "initial": false, "accepting": true },
                  { "id": "q2b", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3a", "x": 300, "y": 600, "initial": false, "accepting": true },
                  { "id": "q3b", "x": 500, "y": 600, "initial": false, "accepting": false },
                  { "id": "q3c", "x": 700, "y": 600, "initial": false, "accepting": false }
                ],
                "transitions": [
                  { "from": "qS", "to": "q2a", "symbol": "_EPSILON_" },
                  { "from": "q2a", "to": "q2b", "symbol": "a" },
                  { "from": "q2b", "to": "q2a", "symbol": "a" },
                  { "from": "qS", "to": "q3a", "symbol": "_EPSILON_" },
                  { "from": "q3a", "to": "q3b", "symbol": "a" },
                  { "from": "q3b", "to": "q3c", "symbol": "a" },
                  { "from": "q3c", "to": "q3a", "symbol": "a" }
                ],
                "alphabet": ["a"]
              }
            },
            // 3. ε-NFA for L = (0* 1)* (10)*
            {
              q: 'ε-NFA for $L = (0^* 1)^* (10)^* $ (Σ={0, 1})', sol: '8 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": true },
                  { "id": "q3", "x": 300, "y": 400, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // (0* 1)*
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q1", "symbol": "_EPSILON_" },
                  // (10)*
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q2", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 4. ε-NFA for L = Σ* 0 Σ Σ Σ 1 Σ* (contains 0 separated by three symbols from 1)
            {
              q: 'ε-NFA for $L = \\Sigma^* 0 \\Sigma \\Sigma \\Sigma 1 \\Sigma^*$ (contains 0 separated by three symbols from 1) (Σ={0, 1})', sol: '8 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 450, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 600, "y": 300, "initial": false, "accepting": false },
                  { "id": "q4", "x": 750, "y": 300, "initial": false, "accepting": false },
                  { "id": "q5", "x": 900, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "0" },
                  { "from": "q0", "to": "q0", "symbol": "1" },
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q3", "symbol": "0" },
                  { "from": "q2", "to": "q3", "symbol": "1" },
                  { "from": "q3", "to": "q4", "symbol": "0" },
                  { "from": "q3", "to": "q4", "symbol": "1" },
                  { "from": "q4", "to": "q5", "symbol": "1" },
                  { "from": "q5", "to": "q5", "symbol": "0" },
                  { "from": "q5", "to": "q5", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 5. ε-NFA for L = (a U b)* · a · (b U ε)
            {
              q: 'ε-NFA for $L = (a \\cup b)^* \\cdot a \\cdot (b \\cup \\epsilon)$ (Σ={a, b})', sol: '5 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q1", "to": "q2", "symbol": "_EPSILON_" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 6. ε-NFA for the intersection of L1=(ab)* and L2=(ba)*
            {
              q: 'ε-NFA for the intersection of $L_1=(ab)^*$ and $L_2=(ba)^*$ (Σ={a, b})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 300, "y": 300, "initial": true, "accepting": true }
                ],
                "transitions": [
                  // Intersection is {ε}, so only the start state is accepting.
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 7. ε-NFA for L = (01)^n (10)^m, where n, m >= 1
            {
              q: 'ε-NFA for $L = (01)^n (10)^m$, where $n, m \\geq 1$ (Σ={0, 1})', sol: '8 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false },
                  { "id": "q4", "x": 900, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // (01)+ part
                  { "from": "q0", "to": "q1", "symbol": "0" },
                  { "from": "q1", "to": "q2", "symbol": "1" },
                  { "from": "q2", "to": "q1", "symbol": "0" },
                  // Concatenation
                  { "from": "q2", "to": "q3", "symbol": "_EPSILON_" },
                  // (10)+ part
                  { "from": "q3", "to": "q4", "symbol": "1" },
                  { "from": "q4", "to": "q3", "symbol": "0" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 8. ε-NFA for L = a · Σ · a · Σ
            {
              q: 'ε-NFA for $L = a \\cdot \\Sigma \\cdot a \\cdot \\Sigma$ (Σ={a, b})', sol: '6 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                  { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                  { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q1", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "a" },
                  { "from": "q1", "to": "q2", "symbol": "b" },
                  { "from": "q2", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q3", "symbol": "a" },
                  { "from": "q3", "to": "q3", "symbol": "b" }
                ],
                "alphabet": ["a", "b"]
              }
            },
            // 9. ε-NFA for L = (00|11)* 01
            {
              q: 'ε-NFA for $L = (00|11)^* 01$ (Σ={0, 1})', sol: '8 states.', "machine": {
                "states": [
                  { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "qA1", "x": 300, "y": 200, "initial": false, "accepting": false },
                  { "id": "qA2", "x": 500, "y": 200, "initial": false, "accepting": false },
                  { "id": "qF1", "x": 700, "y": 300, "initial": false, "accepting": false },
                  { "id": "qF2", "x": 900, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  // (00)* part
                  { "from": "qS", "to": "qA1", "symbol": "0" },
                  { "from": "qA1", "to": "qS", "symbol": "0" },
                  // (11)* part
                  { "from": "qS", "to": "qA2", "symbol": "1" },
                  { "from": "qA2", "to": "qS", "symbol": "1" },
                  // Concatenation
                  { "from": "qS", "to": "qF1", "symbol": "0" },
                  { "from": "qF1", "to": "qF2", "symbol": "1" }
                ],
                "alphabet": ["0", "1"]
              }
            },
            // 10. ε-NFA for L = (a U b U c)* d
            {
              q: 'ε-NFA for $L = (a \\cup b \\cup c)^* d$ (Σ={a, b, c, d})', sol: '4 states.', "machine": {
                "states": [
                  { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                  { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
                ],
                "transitions": [
                  { "from": "q0", "to": "q0", "symbol": "a" },
                  { "from": "q0", "to": "q0", "symbol": "b" },
                  { "from": "q0", "to": "q0", "symbol": "c" },
                  { "from": "q0", "to": "q1", "symbol": "d" }
                ],
                "alphabet": ["a", "b", "c", "d"]
              }
            }
          ]
        },
        // --- 4. CONVERSION MODE: ENFA -> NFA (10 Questions) ---
        ENFA_TO_NFA: [
          // 1. Convert the solution machine for "ε-NFA for a?b (optional a, then b)" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "ε-NFA for a?b (optional a, then b)" to its equivalent NFA.', sol: 'This conversion removes the $\\epsilon$-transitions, merging the start state with its $\\epsilon$-closure.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "q1", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 2. Convert the solution machine for "ε-NFA to connect two paths: L = a U b" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "ε-NFA to connect two paths: L = a U b" to its equivalent NFA.', sol: 'The two parallel paths will now start directly from the initial state on inputs a and b.', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "qA", "x": 300, "y": 200, "initial": false, "accepting": true },
                { "id": "qB", "x": 300, "y": 400, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "qS", "to": "qA", "symbol": "a" },
                { "from": "qS", "to": "qB", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 3. Convert the solution machine for "ε-NFA to achieve a*b*" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "ε-NFA to achieve a*b*" to its equivalent NFA.', sol: 'The $\\epsilon$-transition must be replaced by a direct connection from the "a" loop to the "b" loop.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "a" },
                { "from": "q0", "to": "q1", "symbol": "b" },
                { "from": "q1", "to": "q1", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 4. Convert the solution machine for "ε-NFA equivalent to Regular Expression (0|1)* 0" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "ε-NFA equivalent to Regular Expression (0|1)* 0" to its equivalent NFA.', sol: 'This is a complex closure conversion, resulting in a 3-state NFA.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 5. Convert the solution machine for "L = (0 U ε) 1" to its equivalent NFA (removing ε).
          {
            q: 'Convert the solution machine for "$L = (0 \\cup \\epsilon) 1$" to its equivalent NFA (removing $\\epsilon$).', sol: 'The start state must gain the transition on 1 directly from the initial $\\epsilon$-closure.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 6. Convert the solution machine for "L=a | ε" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "$L=a | \\epsilon$" to its equivalent NFA.', sol: 'The NFA will be simplified, allowing $\\epsilon$ to be accepted via the initial state being final.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" }
              ],
              "alphabet": ["a"]
            }
          },
          // 7. Convert the solution machine for "L = a · b · c" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "$L = a \\cdot b \\cdot c$" to its equivalent NFA.', sol: 'This conversion removes two intermediate $\\epsilon$-transitions.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q1", "to": "q2", "symbol": "b" },
                { "from": "q2", "to": "q3", "symbol": "c" }
              ],
              "alphabet": ["a", "b", "c"]
            }
          },
          // 8. Convert the solution machine for "L = (01)* | (10)*" to its equivalent NFA.
          {
            q: 'Convert the solution machine for "$L = (01)^* | (10)^* $" to its equivalent NFA.', sol: 'This conversion removes the two initial $\\epsilon$-splits.', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q01a", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q01b", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "q10a", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "q10b", "x": 500, "y": 400, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "qS", "to": "q01a", "symbol": "0" },
                { "from": "q01a", "to": "q01b", "symbol": "1" },
                { "from": "q01b", "to": "q01a", "symbol": "0" },
                { "from": "qS", "to": "q10a", "symbol": "1" },
                { "from": "q10a", "to": "q10b", "symbol": "0" },
                { "from": "q10b", "to": "q10a", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 9. Convert the solution machine for "L = a · (b U c)* " to its equivalent NFA.
          {
            q: 'Convert the solution machine for "$L = a \\cdot (b \\cup c)^*$ " to its equivalent NFA.', sol: 'The $\\epsilon$ transition between a and (b|c)* must be removed.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q1", "to": "q1", "symbol": "b" },
                { "from": "q1", "to": "q1", "symbol": "c" }
              ],
              "alphabet": ["a", "b", "c"]
            }
          },
          // 10. Convert the solution machine for "L = (a · a)* " to its equivalent NFA.
          {
            q: 'Convert the solution machine for "$L = (a \\cdot a)^*$ " to its equivalent NFA.', sol: 'This conversion removes the $\\epsilon$-loop.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q1", "to": "q0", "symbol": "a" }
              ],
              "alphabet": ["a"]
            }
          }
        ],
        // --- 5. CONVERSION MODE: NFA -> DFA (15 Questions) ---
        NFA_TO_DFA: [
          // 1. Convert the solution machine for "NFA accepting strings containing the substring "101"" to its equivalent DFA. (5 states)
          {
            q: 'Convert the solution machine for "NFA accepting strings containing the substring "101"" to its equivalent DFA.', sol: 'Requires subset construction, resulting in 5 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                { "id": "q0,q1,q3", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0,q1", "symbol": "1" },
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q1", "to": "q1", "symbol": "1" },
                { "from": "q0,q1", "to": "q2", "symbol": "0" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "1" },
                { "from": "q2", "to": "q0,q1,q3", "symbol": "1" },
                { "from": "q2", "to": "q0", "symbol": "0" },
                { "from": "q0,q1,q3", "to": "q0,q1", "symbol": "1" },
                { "from": "q0,q1,q3", "to": "q2", "symbol": "0" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 2. Convert the solution machine for "NFA for (00)* U (11)* " to its equivalent DFA. (5 states)
          {
            q: 'Convert the solution machine for "NFA for $(00)^* \\cup (11)^*$ " to its equivalent DFA.', sol: 'The DFA will require a trap state and track the state sets, resulting in 5 states.', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q0a,q1a", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q0b,q1b", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "q0a,q1b", "x": 700, "y": 200, "initial": false, "accepting": true },
                { "id": "q0b,q1a", "x": 700, "y": 400, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "qS", "to": "q0a,q1a", "symbol": "0" },
                { "from": "qS", "to": "q0a,q1a", "symbol": "1" },
                { "from": "q0a,q1a", "to": "q0b,q1a", "symbol": "0" },
                { "from": "q0a,q1a", "to": "q0a,q1b", "symbol": "1" },
                { "from": "q0b,q1a", "to": "qS", "symbol": "0" },
                { "from": "q0b,q1a", "to": "q0a,q1b", "symbol": "1" },
                { "from": "q0a,q1b", "to": "q0b,q1a", "symbol": "0" },
                { "from": "q0a,q1b", "to": "qS", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 3. Convert the solution machine for "NFA accepting strings with exactly two "1"s" to its equivalent DFA. (4 states)
          {
            q: 'Convert the solution machine for "NFA accepting strings with exactly two "1"s" to its equivalent DFA.', sol: 'The DFA states track the count of 1s (0, 1, 2) plus the trap state, resulting in 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 4. Convert the NFA for L = (0|1)* 01 (ends with 01) to its equivalent DFA. (3 states)
          {
            q: 'Convert the NFA for $L = (0|1)^* 01$ (ends with 01) to its equivalent DFA.', sol: 'The DFA tracks the last two symbols seen, resulting in 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q0,q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0,q1", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "0" },
                { "from": "q0,q1", "to": "q0,q2", "symbol": "1" },
                { "from": "q0,q2", "to": "q0,q1", "symbol": "0" },
                { "from": "q0,q2", "to": "q0", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 5. Convert the NFA for L = (ab U ba)* to its equivalent DFA. (6 states)
          {
            q: 'Convert the NFA for $L = (ab \\cup ba)^*$ to its equivalent DFA.', sol: 'The DFA requires careful tracking of the potential paths, resulting in 6 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1a,q1b", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2a,q1a", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "q2b,q1b", "x": 500, "y": 400, "initial": false, "accepting": true },
                { "id": "q2a,q2b,q1a,q1b", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1a,q1b", "symbol": "a" },
                { "from": "q0", "to": "q1a,q1b", "symbol": "b" },
                { "from": "q1a,q1b", "to": "q2a,q1a", "symbol": "a" },
                { "from": "q1a,q1b", "to": "q2b,q1b", "symbol": "b" },
                { "from": "q2a,q1a", "to": "q2b,q1b", "symbol": "b" },
                { "from": "q2a,q1a", "to": "q1a,q1b", "symbol": "a" },
                { "from": "q2b,q1b", "to": "q2a,q1a", "symbol": "a" },
                { "from": "q2b,q1b", "to": "q1a,q1b", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 6. Convert the NFA for L = Σ* 0 Σ (second to last symbol is 0) to its equivalent DFA. (4 states)
          {
            q: 'Convert the NFA for $L = \\Sigma^* 0 \\Sigma$ (second to last symbol is 0) to its equivalent DFA.', sol: 'The DFA requires 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q0,q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "q0,q1,q2", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0,q1", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "0" },
                { "from": "q0,q1", "to": "q0,q2", "symbol": "1" },
                { "from": "q0,q2", "to": "q0,q1,q2", "symbol": "0" },
                { "from": "q0,q2", "to": "q0,q2", "symbol": "1" },
                { "from": "q0,q1,q2", "to": "q0,q1,q2", "symbol": "0" },
                { "from": "q0,q1,q2", "to": "q0,q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 7. Convert the NFA for L = 00 U 11 to its equivalent DFA. (7 states)
          {
            q: 'Convert the NFA for $L = 00 \\cup 11$ to its equivalent DFA.', sol: 'The DFA requires 7 states.', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0a,q1a", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q0b", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "q1b", "x": 500, "y": 400, "initial": false, "accepting": true },
                { "id": "q0b,q1a", "x": 700, "y": 200, "initial": false, "accepting": true },
                { "id": "q1b,q0a", "x": 700, "y": 400, "initial": false, "accepting": true },
                { "id": "qT", "x": 900, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "qS", "to": "q0a,q1a", "symbol": "0" },
                { "from": "qS", "to": "q0a,q1a", "symbol": "1" },
                { "from": "q0a,q1a", "to": "q0b,q1a", "symbol": "0" },
                { "from": "q0a,q1a", "to": "q1b,q0a", "symbol": "1" },
                { "from": "q0b,q1a", "to": "qT", "symbol": "0" },
                { "from": "q0b,q1a", "to": "q1b,q0a", "symbol": "1" },
                { "from": "q1b,q0a", "to": "q0b,q1a", "symbol": "0" },
                { "from": "q1b,q0a", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 8. Convert the NFA for L = 0* 1* 0* 1 to its equivalent DFA. (6 states)
          {
            q: 'Convert the NFA for $L = 0^* 1^* 0^* 1$ to its equivalent DFA.', sol: 'The DFA requires 6 states.', "machine": {
              "states": [
                { "id": "q0,q2", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1,q2", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q0,q1,q2,q3", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "q1,q2", "x": 700, "y": 200, "initial": false, "accepting": false },
                { "id": "q1,q2,q3", "x": 900, "y": 300, "initial": false, "accepting": true },
                { "id": "q0,q2,q3", "x": 300, "y": 400, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0,q2", "to": "q0,q2", "symbol": "0" },
                { "from": "q0,q2", "to": "q0,q1,q2", "symbol": "1" },
                { "from": "q0,q1,q2", "to": "q0,q2", "symbol": "0" },
                { "from": "q0,q1,q2", "to": "q0,q1,q2,q3", "symbol": "1" },
                { "from": "q0,q1,q2,q3", "to": "q0,q2,q3", "symbol": "0" },
                { "from": "q0,q1,q2,q3", "to": "q0,q1,q2", "symbol": "1" },
                { "from": "q0,q2,q3", "to": "q0,q2", "symbol": "0" },
                { "from": "q0,q2,q3", "to": "q0,q1,q2,q3", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 9. Convert the NFA for L = (a* b) to its equivalent DFA. (2 states)
          {
            q: 'Convert the NFA for $L = (a^* b)$ to its equivalent DFA.', sol: 'The DFA requires 2 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "a" },
                { "from": "q0", "to": "q0,q1", "symbol": "b" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "a" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 10. Convert the NFA for L = 10* 1 to its equivalent DFA. (4 states)
          {
            q: 'Convert the NFA for $L = 10^* 1$ to its equivalent DFA.', sol: 'The DFA requires 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q1,q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "qT", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q1,q2", "symbol": "1" },
                { "from": "q1,q2", "to": "q1", "symbol": "0" },
                { "from": "q1,q2", "to": "q1,q2", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 11. Convert the NFA for L = a Σ* a (starts and ends with 'a') to its equivalent DFA. (4 states)
          {
            q: 'Convert the NFA for $L = a \\Sigma^* a$ (starts and ends with \'a\') to its equivalent DFA.', sol: 'The DFA requires 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q1,q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "qT", "symbol": "b" },
                { "from": "q1", "to": "q1,q2", "symbol": "a" },
                { "from": "q1", "to": "q1", "symbol": "b" },
                { "from": "q1,q2", "to": "q1,q2", "symbol": "a" },
                { "from": "q1,q2", "to": "q1", "symbol": "b" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 12. Convert the NFA for L = Σ* 1 Σ* 0 Σ* (contains 1 then 0) to its equivalent DFA. (3 states)
          {
            q: 'Convert the NFA for $L = \\Sigma^* 1 \\Sigma^* 0 \\Sigma^*$ (contains 1 then 0) to its equivalent DFA.', sol: 'The DFA requires 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q0,q1,q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q0,q1", "symbol": "1" },
                { "from": "q0,q1", "to": "q0,q1,q2", "symbol": "0" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "1" },
                { "from": "q0,q1,q2", "to": "q0,q1,q2", "symbol": "0" },
                { "from": "q0,q1,q2", "to": "q0,q1,q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 13. Convert the NFA for L = (000|111) Σ* to its equivalent DFA. (5 states)
          {
            q: 'Convert the NFA for $L = (000|111) \\Sigma^*$ to its equivalent DFA.', sol: 'The DFA requires 5 states.', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q00", "x": 500, "y": 200, "initial": false, "accepting": false },
                { "id": "q1", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "q11", "x": 500, "y": 400, "initial": false, "accepting": false },
                { "id": "qF", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "qS", "to": "q0", "symbol": "0" },
                { "from": "qS", "to": "q1", "symbol": "1" },
                { "from": "q0", "to": "q00", "symbol": "0" },
                { "from": "q0", "to": "qT", "symbol": "1" },
                { "from": "q00", "to": "qF", "symbol": "0" },
                { "from": "q00", "to": "qT", "symbol": "1" },
                { "from": "q1", "to": "qT", "symbol": "0" },
                { "from": "q1", "to": "q11", "symbol": "1" },
                { "from": "q11", "to": "qT", "symbol": "0" },
                { "from": "q11", "to": "qF", "symbol": "1" },
                { "from": "qF", "to": "qF", "symbol": "0" },
                { "from": "qF", "to": "qF", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 14. Convert the NFA for L = (10)* to its equivalent DFA. (4 states)
          {
            q: 'Convert the NFA for $L = (10)^*$ to its equivalent DFA.', sol: 'The DFA requires 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "qT", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "qT", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q0", "symbol": "0" },
                { "from": "q1", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 15. Convert the NFA for L = (a U b) · (a U b) (length 2) to its equivalent DFA. (4 states)
          {
            q: 'Convert the NFA for $L = (a \\cup b) \\cdot (a \\cup b)$ (length 2) to its equivalent DFA.', sol: 'The DFA requires 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "q1", "symbol": "b" },
                { "from": "q1", "to": "q2", "symbol": "a" },
                { "from": "q1", "to": "q2", "symbol": "b" },
                { "from": "q2", "to": "qT", "symbol": "a" },
                { "from": "q2", "to": "qT", "symbol": "b" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          }
        ],
        // --- 6. CONVERSION MODE: DFA -> MIN DFA (15 Questions) ---
        DFA_TO_MIN_DFA: [
          // 1. Minimize the solution machine for "DFA accepting strings that contain "1" at the third position from the start". (Minimal: 4 states)
          {
            q: 'Minimize the solution machine for "DFA accepting strings that contain "1" at the third position from the start".', sol: 'The 4-state DFA will likely have its initial states partitioned.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false },
                { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q3", "symbol": "1" },
                { "from": "q2", "to": "qT", "symbol": "0" },
                { "from": "q3", "to": "q3", "symbol": "0" },
                { "from": "q3", "to": "q3", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 2. Minimize the solution machine for "DFA accepting any string of length exactly 2". (Minimal: 4 states)
          {
            q: 'Minimize the solution machine for "DFA accepting any string of length exactly 2".', sol: 'The 4-state DFA is already minimal.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q3", "symbol": "0" },
                { "from": "q2", "to": "q3", "symbol": "1" },
                { "from": "q3", "to": "q3", "symbol": "0" },
                { "from": "q3", "to": "q3", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 3. Minimize the DFA for L = Σ* 0. (Minimal: 2 states)
          {
            q: 'Minimize the DFA for $L = \\Sigma^* 0$. The 2-state solution is already minimal. Verify using the minimization algorithm.', sol: 'Prove minimality using the table-filling method.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q0", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 4. Minimize the DFA for L = Σ* 00 Σ*. (Minimal: 3 states)
          {
            q: 'Minimize the DFA for $L = \\Sigma^* 00 \\Sigma^*$. The 3-state solution is already minimal.', sol: 'Prove minimality using the table-filling method.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q0", "symbol": "1" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 5. Minimize a 6-state DFA (q0, q1, q2, q3, q4, q5) accepting strings of length divisible by 3. (Minimal: 3 states)
          {
            q: 'Minimize a 6-state DFA (q0, q1, q2, q3, q4, q5) accepting strings of length divisible by 3.', sol: 'The minimal DFA should have 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q1", "to": "q2", "symbol": "a" },
                { "from": "q2", "to": "q0", "symbol": "a" }
              ],
              "alphabet": ["a"]
            }
          },
          // 6. Minimize the 4-state DFA accepting L = (ab)*. (Minimal: 2 states)
          {
            q: 'Minimize the 4-state DFA accepting $L = (ab)^*$.', sol: 'The minimal DFA has 2 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "qT", "symbol": "b" },
                { "from": "q1", "to": "q0", "symbol": "b" },
                { "from": "q1", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 7. Minimize a 5-state DFA accepting L = Σ* 11. (Minimal: 3 states)
          {
            q: 'Minimize a 5-state DFA accepting $L = \\Sigma^* 11$.', sol: 'The minimal DFA has 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q0", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 8. Minimize a 5-state DFA accepting L = Σ³ (length exactly 3). (Minimal: 4 states)
          {
            q: 'Minimize a 5-state DFA accepting $L = \\Sigma^3$ (length exactly 3).', sol: 'The minimal DFA has 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": false },
                { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 900, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q3", "symbol": "0" },
                { "from": "q2", "to": "q3", "symbol": "1" },
                { "from": "q3", "to": "qT", "symbol": "0" },
                { "from": "q3", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 9. Minimize a 7-state DFA accepting strings where the last symbol is the same as the first symbol. (Minimal: 6 states)
          {
            q: 'Minimize a 7-state DFA accepting strings where the last symbol is the same as the first symbol.', sol: 'The minimal DFA has 6 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0_0", "x": 300, "y": 200, "initial": false, "accepting": true },
                { "id": "q0_1", "x": 500, "y": 200, "initial": false, "accepting": false },
                { "id": "q1_1", "x": 300, "y": 400, "initial": false, "accepting": true },
                { "id": "q1_0", "x": 500, "y": 400, "initial": false, "accepting": false },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0_0", "symbol": "0" },
                { "from": "q0", "to": "q1_1", "symbol": "1" },
                { "from": "q0_0", "to": "q0_0", "symbol": "0" },
                { "from": "q0_0", "to": "q0_1", "symbol": "1" },
                { "from": "q0_1", "to": "q0_0", "symbol": "0" },
                { "from": "q0_1", "to": "q0_1", "symbol": "1" },
                { "from": "q1_1", "to": "q1_0", "symbol": "0" },
                { "from": "q1_1", "to": "q1_1", "symbol": "1" },
                { "from": "q1_0", "to": "q1_0", "symbol": "0" },
                { "from": "q1_0", "to": "q1_1", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 10. Minimize a 6-state DFA that accepts all strings NOT containing the substring "01". (Minimal: 3 states)
          {
            q: 'Minimize a 6-state DFA that accepts all strings NOT containing the substring "01".', sol: 'The minimal DFA has 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 11. Minimize a 5-state DFA that accepts the language L={w | |w| <= 3 and w has no 01 } (Minimal: 4 states)
          {
            q: 'Minimize a 5-state DFA that accepts the language $L=\\{w \\mid |w| \\leq 3 \\text{ and } w \\text{ has no } 01 \\}$ (Σ={0, 1}).', sol: 'The minimal DFA is 4 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                { "id": "q2", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "q3", "x": 700, "y": 200, "initial": false, "accepting": true },
                { "id": "qT", "x": 900, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q2", "symbol": "0" },
                { "from": "q1", "to": "qT", "symbol": "1" },
                { "from": "q2", "to": "q3", "symbol": "0" },
                { "from": "q2", "to": "qT", "symbol": "1" },
                { "from": "q3", "to": "qT", "symbol": "0" },
                { "from": "q3", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 12. Minimize a 5-state DFA accepting strings containing an odd number of "0"s AND an odd number of "1"s. (Minimal: 4 states)
          {
            q: 'Minimize a 5-state DFA accepting strings containing an odd number of "0"s AND an odd number of "1"s.', sol: 'The minimal DFA is 4 states.', "machine": {
              "states": [
                { "id": "qEE", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "qOE", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "qEO", "x": 300, "y": 400, "initial": false, "accepting": true },
                { "id": "qOO", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "qEE", "to": "qOE", "symbol": "0" },
                { "from": "qEE", "to": "qEO", "symbol": "1" },
                { "from": "qOE", "to": "qEE", "symbol": "0" },
                { "from": "qOE", "to": "qOO", "symbol": "1" },
                { "from": "qEO", "to": "qOO", "symbol": "0" },
                { "from": "qEO", "to": "qEE", "symbol": "1" },
                { "from": "qOO", "to": "qEO", "symbol": "0" },
                { "from": "qOO", "to": "qOE", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 13. Minimize a 5-state DFA for L = 00 U 11. (Minimal: 5 states)
          {
            q: 'Minimize a 5-state DFA for $L = 00 \\cup 11$.', sol: 'The minimal DFA is 5 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "qF0", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "qF1", "x": 500, "y": 400, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0a", "symbol": "0" },
                { "from": "q0", "to": "q1a", "symbol": "1" },
                { "from": "q0a", "to": "qF0", "symbol": "0" },
                { "from": "q0a", "to": "qT", "symbol": "1" },
                { "from": "q1a", "to": "qT", "symbol": "0" },
                { "from": "q1a", "to": "qF1", "symbol": "1" },
                { "from": "qF0", "to": "qT", "symbol": "0" },
                { "from": "qF0", "to": "qT", "symbol": "1" },
                { "from": "qF1", "to": "qT", "symbol": "0" },
                { "from": "qF1", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 14. Minimize the 4-state DFA for L = 0* 1*. (Minimal: 3 states)
          {
            q: 'Minimize the 4-state DFA for $L = 0^* 1^*$.', sol: 'The minimal DFA is 3 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                { "id": "qT", "x": 300, "y": 400, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "qT", "symbol": "0" },
                { "from": "q1", "to": "q1", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 15. Minimize a 6-state DFA that accepts L={w | w has length divisible by 2 or 3 }. (Minimal: 6 states)
          {
            q: 'Minimize a 6-state DFA that accepts $L=\\{w \\mid w \\text{ has length divisible by 2 or 3} \\}$.', sol: 'The minimal DFA is 6 states.', "machine": {
              "states": [
                { "id": "q00", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q01", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q02", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "q10", "x": 300, "y": 400, "initial": false, "accepting": true },
                { "id": "q11", "x": 500, "y": 400, "initial": false, "accepting": false },
                { "id": "q12", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q00", "to": "q11", "symbol": "a" },
                { "from": "q11", "to": "q02", "symbol": "a" },
                { "from": "q02", "to": "q10", "symbol": "a" },
                { "from": "q10", "to": "q01", "symbol": "a" },
                { "from": "q01", "to": "q12", "symbol": "a" },
                { "from": "q12", "to": "q00", "symbol": "a" }
              ],
              "alphabet": ["a"]
            }
          }
        ],
        // --- 7. CONVERSION MODE: NFA -> MIN DFA (10 Questions) ---
        NFA_TO_MIN_DFA: [
          // 1. Convert the NFA for L = (0|1)* 01 (ends with 01) to its equivalent Minimal DFA. (3 states)
          {
            q: 'Convert the NFA for $L = (0|1)^* 01$ (ends with 01) to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (3 states), then Minimization (3 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0,q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q0,q2", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q0,q1", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q0,q1", "to": "q0,q1", "symbol": "0" },
                { "from": "q0,q1", "to": "q0,q2", "symbol": "1" },
                { "from": "q0,q2", "to": "q0,q1", "symbol": "0" },
                { "from": "q0,q2", "to": "q0", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 2. Convert the NFA for L = (00)* U (11)* to its equivalent Minimal DFA. (4 states)
          {
            q: 'Convert the NFA for $L = (00)^* \\cup (11)^*$ to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (5 states), then Minimization (4 states).', "machine": {
              "states": [
                { "id": "qS", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "qF", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "qS", "to": "q0a", "symbol": "0" },
                { "from": "qS", "to": "q1a", "symbol": "1" },
                { "from": "q0a", "to": "qF", "symbol": "0" },
                { "from": "q0a", "to": "q1a", "symbol": "1" },
                { "from": "q1a", "to": "q0a", "symbol": "0" },
                { "from": "q1a", "to": "qF", "symbol": "1" },
                { "from": "qF", "to": "q0a", "symbol": "0" },
                { "from": "qF", "to": "q1a", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 3. Convert the ε-NFA for a?b to its equivalent Minimal DFA. (3 states)
          {
            q: 'Convert the $\\varepsilon$-NFA for $a?b$ to its equivalent Minimal DFA.', sol: 'Requires $\\varepsilon$-NFA to NFA, NFA to DFA, then Minimization (3 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "q1", "symbol": "b" },
                { "from": "q1", "to": "qT", "symbol": "a" },
                { "from": "q1", "to": "qT", "symbol": "b" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 4. Convert the NFA for L = (ab U ba)* to its equivalent Minimal DFA. (4 states)
          {
            q: 'Convert the NFA for $L = (ab \\cup ba)^*$ to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (6 states), then Minimization (4 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "qA", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "qB", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "qF", "x": 500, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "qA", "symbol": "a" },
                { "from": "q0", "to": "qB", "symbol": "b" },
                { "from": "qA", "to": "qF", "symbol": "b" },
                { "from": "qA", "to": "qA", "symbol": "a" },
                { "from": "qB", "to": "qF", "symbol": "a" },
                { "from": "qB", "to": "qB", "symbol": "b" },
                { "from": "qF", "to": "qA", "symbol": "a" },
                { "from": "qF", "to": "qB", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 5. Convert the NFA accepting strings with exactly two "1"s to its equivalent Minimal DFA. (4 states)
          {
            q: 'Convert the NFA accepting strings with exactly two "1"s to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (4 states), then Minimization (4 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "0" },
                { "from": "q0", "to": "q1", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q2", "symbol": "0" },
                { "from": "q2", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 6. Convert the NFA for L = Σ* 0 Σ (second to last symbol is 0) to its equivalent Minimal DFA. (4 states)
          {
            q: 'Convert the NFA for $L = \\Sigma^* 0 \\Sigma$ (second to last symbol is 0) to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (4 states), then Minimization (4 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q2", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "q3", "x": 700, "y": 300, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "0" },
                { "from": "q0", "to": "q0", "symbol": "1" },
                { "from": "q1", "to": "q1", "symbol": "0" },
                { "from": "q1", "to": "q2", "symbol": "1" },
                { "from": "q2", "to": "q3", "symbol": "0" },
                { "from": "q2", "to": "q2", "symbol": "1" },
                { "from": "q3", "to": "q3", "symbol": "0" },
                { "from": "q3", "to": "q2", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 7. Convert the NFA for L = 00 U 11 to its equivalent Minimal DFA. (5 states)
          {
            q: 'Convert the NFA for $L = 00 \\cup 11$ to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (7 states), then Minimization (5 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q0a", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q1a", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "qF0", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "qF1", "x": 500, "y": 400, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0a", "symbol": "0" },
                { "from": "q0", "to": "q1a", "symbol": "1" },
                { "from": "q0a", "to": "qF0", "symbol": "0" },
                { "from": "q0a", "to": "qT", "symbol": "1" },
                { "from": "q1a", "to": "qT", "symbol": "0" },
                { "from": "q1a", "to": "qF1", "symbol": "1" },
                { "from": "qF0", "to": "qT", "symbol": "0" },
                { "from": "qF0", "to": "qT", "symbol": "1" },
                { "from": "qF1", "to": "qT", "symbol": "0" },
                { "from": "qF1", "to": "qT", "symbol": "1" },
                { "from": "qT", "to": "qT", "symbol": "0" },
                { "from": "qT", "to": "qT", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 8. Convert the ε-NFA for L= (01)* | (10)* to its equivalent Minimal DFA. (5 states)
          {
            q: 'Convert the $\\varepsilon$-NFA for $L= (01)^* | (10)^* $ to its equivalent Minimal DFA.', sol: 'Requires three steps, resulting in 7 states.', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q01a", "x": 300, "y": 200, "initial": false, "accepting": false },
                { "id": "q10a", "x": 300, "y": 400, "initial": false, "accepting": false },
                { "id": "qF1", "x": 500, "y": 200, "initial": false, "accepting": true },
                { "id": "qF2", "x": 500, "y": 400, "initial": false, "accepting": true }
              ],
              "transitions": [
                { "from": "q0", "to": "q01a", "symbol": "0" },
                { "from": "q0", "to": "q10a", "symbol": "1" },
                { "from": "q01a", "to": "qF1", "symbol": "1" },
                { "from": "q10a", "to": "qF2", "symbol": "0" },
                { "from": "qF1", "to": "q01a", "symbol": "0" },
                { "from": "qF1", "to": "qF2", "symbol": "1" },
                { "from": "qF2", "to": "q01a", "symbol": "0" },
                { "from": "qF2", "to": "q10a", "symbol": "1" }
              ],
              "alphabet": ["0", "1"]
            }
          },
          // 9. Convert the NFA for L = a* b* to its equivalent Minimal DFA. (3 states)
          {
            q: 'Convert the NFA for $L = a^* b^*$ to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (3 states), then Minimization (3 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": true },
                { "id": "q1", "x": 300, "y": 200, "initial": false, "accepting": true },
                { "id": "qT", "x": 500, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q0", "symbol": "a" },
                { "from": "q0", "to": "q1", "symbol": "b" },
                { "from": "q1", "to": "qT", "symbol": "a" },
                { "from": "q1", "to": "q1", "symbol": "b" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          },
          // 10. Convert the NFA for L = a Σ* a (starts and ends with 'a') to its equivalent Minimal DFA. (4 states)
          {
            q: 'Convert the NFA for $L = a \\Sigma^* a$ (starts and ends with \'a\') to its equivalent Minimal DFA.', sol: 'Requires NFA to DFA (4 states), then Minimization (4 states).', "machine": {
              "states": [
                { "id": "q0", "x": 100, "y": 300, "initial": true, "accepting": false },
                { "id": "q1", "x": 300, "y": 300, "initial": false, "accepting": false },
                { "id": "q12", "x": 500, "y": 300, "initial": false, "accepting": true },
                { "id": "qT", "x": 700, "y": 300, "initial": false, "accepting": false }
              ],
              "transitions": [
                { "from": "q0", "to": "q1", "symbol": "a" },
                { "from": "q0", "to": "qT", "symbol": "b" },
                { "from": "q1", "to": "q12", "symbol": "a" },
                { "from": "q1", "to": "q1", "symbol": "b" },
                { "from": "q12", "to": "q12", "symbol": "a" },
                { "from": "q12", "to": "q1", "symbol": "b" },
                { "from": "qT", "to": "qT", "symbol": "a" },
                { "from": "qT", "to": "qT", "symbol": "b" }
              ],
              "alphabet": ["a", "b"]
            }
          }
        ]
      };



      function enforceInitialStateRule() {
        // Enforce DFA rule: only one initial state
        if (MACHINE.type === 'DFA' || MACHINE.type.includes('DFA')) {
          const initialStates = MACHINE.states.filter(s => s.initial);
          if (initialStates.length > 1) {
            initialStates.slice(1).forEach(s => s.initial = false);
          }
        }
        // Ensure at least one state is initial if any exist
        if (MACHINE.states.length > 0 && !MACHINE.states.some(s => s.initial)) {
          MACHINE.states[0].initial = true;
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
        if (!MACHINE.states || MACHINE.states.length === 0) {
          document.getElementById('canvasHint').style.display = 'block';
          return;
        }
        document.getElementById('canvasHint').style.display = 'none';

        // FIX: Use a Set to prevent rendering labels for the same arc multiple times
        const processedArcs = new Set();
        MACHINE.transitions.forEach((t, i) => {
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
            labelX =
              loop.labelX;
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

            const reverse = MACHINE.transitions.some(
              (other) => other.from === t.to && other.to === t.from
            );
            if (reverse) {
              const offset = 40;
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const normX = -dy / Math.hypot(dx, dy);
              const normY = dx / Math.hypot(dx, dy);
              const cpx = midX + normX * offset;
              const cpy = midY + normY * offset;
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

          path.addEventListener('click', (e) => {
            e.stopPropagation();
            if (CURRENT_MODE === 'delete') {
              // Deleting an arc deletes all transitions on it
              pushUndo();
              MACHINE.transitions = MACHINE.transitions.filter(trans => trans.from !== t.from || trans.to !== t.to);
              renderAll();
            }
          });
          const arcSymbols = MACHINE.transitions
            .filter(tt => tt.from === t.from && tt.to === t.to)
            .map(tt => (tt.symbol === '' || tt.symbol === undefined) ? 'ε' : tt.symbol);

          // FIX: Condense symbols into comma-separated list
          const uniqueSymbols = [...new Set(arcSymbols)];
          const symbols = [uniqueSymbols.join(', ')]; // Only one symbol line for rendering

          const spacing = 14;
          const dxEdge = to.x - from.x;
          const dyEdge = to.y - from.y;
          const lenEdge = Math.hypot(dxEdge, dyEdge) || 1;
          const nx = -dyEdge / lenEdge;
          const ny = dxEdge / lenEdge;
          const startOffset = -((symbols.length - 1) / 2) * spacing;

          symbols.forEach((sym, idx) => {
            const offset = startOffset + idx * spacing;
            const tx = labelX + nx * offset;
            const ty = labelY + ny * offset;
            const text = document.createElementNS(svg.namespaceURI, 'text');
            text.setAttribute('class', 'transition-label');
            text.setAttribute('x', tx);
            text.setAttribute('y', ty);
            text.setAttribute('data-from', t.from);

            text.setAttribute('data-to', t.to);
            text.textContent = sym;
            edgesGroup.appendChild(text);
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

          const circle =
            document.createElementNS('http://www.w3.org/2000/svg', 'circle');
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

      // --- STATE & TRANSITION MODIFICATION ---

      function addState(x, y) {
        const id = 'q' + MACHINE.states.length;
        const isFirst = MACHINE.states.length === 0;
        pushUndo();
        MACHINE.states.push({ id, x, y, initial: isFirst, accepting: false });
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

      function deleteState(id) {
        pushUndo();
        MACHINE.states = MACHINE.states.filter(s => s.id !== id);
        MACHINE.transitions = MACHINE.transitions.filter(t => t.from !== id && t.to !== id);
        enforceInitialStateRule();
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

      // --- UNDO/REDO ---
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
      // ... (Continued from Chunk 2)

      // --- SIMULATION LOGIC ---
      async function runSimulation(inputStr) {
        simSteps = [];
        simIndex = 0; clearTimeout(simTimer);
        document.getElementById('stepLog').innerHTML = '';
        testOutput.textContent = 'Simulating...';
        const startStates = MACHINE.states.filter(s => s.initial).map(s => s.id);

        if (startStates.length === 0) {
          validationLine.textContent = 'Invalid: No initial state set.';
          validationLine.classList.add('error', 'show');
          return;
        }
        let currentSet = (MACHINE.type === 'ENFA') ?
          epsilonClosure(startStates) : [...startStates];
        if (MACHINE.type === 'DFA' && currentSet.length > 1) currentSet = [currentSet[0]];
        simSteps.push({ start: true, active: [...currentSet] });

        for (const sym of inputStr) {
          const frame = { before: [...currentSet], symbol: sym, steps: [], after: [] };
          const next = new Set();
          const transitions = MACHINE.transitions.filter(t => t.symbol === sym);

          if (MACHINE.type === 'DFA') {
            // DFA: One transition per symbol
            if (currentSet.length > 0) {
              const t = transitions.find(tt => tt.from === currentSet[0]);

              if (t) {
                frame.steps.push({ from: t.from, to: t.to, symbol: t.symbol }); next.add(t.to);
              }
            }
          } else {
            // NFA/ENFA: Multiple transitions possible
            for (const q of currentSet) {
              transitions.filter(t => t.from === q).forEach(t => {
                frame.steps.push({ from: q, to: t.to, symbol: t.symbol }); next.add(t.to);
              });
            }
          }
          const after = (MACHINE.type === 'ENFA') ? epsilonClosure([...next]) : [...next];
          frame.after = after; simSteps.push(frame); currentSet = after;
          if (currentSet.length === 0) break;
        }
        simSteps.push({ end: true, active: [...currentSet] });

        const mode = document.querySelector('input[name="simMode"]:checked')?.value || 'auto';
        if (mode === 'manual') {
          document.getElementById('manualButtons').style.display = 'flex';
          simIndex = 0;
          showStep(0);
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

        // Reset all visuals
        document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));

        if (idx === 0) log.innerHTML = '';

        if (step.end) {
          const accept = (step.active || []).some(sid => MACHINE.states.find(s => s.id === sid && s.accepting));

          testOutput.textContent = accept ? 'Accepted' : 'Rejected';
          testOutput.style.color = accept ? '#38a169' : '#e53e3e';
          step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));

          log.innerHTML = `<div><strong>Final active states: {${(step.active || []).join(', ')}}</strong></div>` + log.innerHTML;
          log.innerHTML = `<div><strong style="color:${accept ? '#4ade80' : '#f87171'}">${accept ?
            '✔ Accepted' : '✘ Rejected'}</strong></div>` + log.innerHTML;
          return;
        }

        if (step.start) {
          log.innerHTML = `<div><strong>Initial active states: {${(step.active || []).join(', ')}}</strong></div>` + log.innerHTML;
          step.active.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
          return;
        }

        testOutput.textContent = `After '${step.symbol}', active: {${(step.after || []).join(', ')}}`;

        // Animate
        step.before.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
        await sleep(speed / 2);

        if (step.steps.length > 0) {
          step.steps.forEach(s => {
            log.innerHTML = `<div>Read '<b>${s.symbol}</b>': δ(${s.from}, ${s.symbol}) → ${s.to}</div>` + log.innerHTML;
            document.querySelector(`.transition-path[data-from="${s.from}"][data-to="${s.to}"]`)?.classList.add('transition-animating');
          });
        } else {
          log.innerHTML = `<div>Read '<b>${step.symbol}</b>': No transitions from {${step.before.join(', ')}}.
      Halting.</div>` + log.innerHTML;
        }

        await sleep(speed / 2);
        document.querySelectorAll('.state-animating, .transition-animating').forEach(el => el.classList.remove('state-animating', 'transition-animating'));
        step.after.forEach(sid => document.querySelector(`.state-circle[data-id="${sid}"]`)?.classList.add('state-animating'));
      }

      async function playAuto() {
        for (let i = 0; i < simSteps.length; i++) {
          await showStep(i);
          const speed = parseInt(document.getElementById('testSpeed').value || '500');
          await sleep(speed);
        }
      }

      // --- CONVERSION ALGORITHMS ---

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
        const alphabet = Array.from(new Set(nfaMachine.transitions.map(t => t.symbol).filter(s => s !== 'ε')));
        const initialClosure = epsilonClosure(nfaMachine.states.filter(s => s.initial).map(s => s.id));
        const dfaStates = new Map();
        const queue = [initialClosure];
        const mapKey = (arr) => arr.sort().join(',');
        dfaStates.set(mapKey(initialClosure), { id: mapKey(initialClosure), transitions: {}, states: initialClosure });

        while (queue.length > 0) {
          const currentSet = queue.shift();
          const currentKey = mapKey(currentSet);

          for (const symbol of alphabet) {
            const nextStates = new Set();

            for (const stateId of currentSet) {
              nfaMachine.transitions
                .filter(t => t.from === stateId && t.symbol === symbol)
                .forEach(t => nextStates.add(t.to));
            }
            if (nextStates.size > 0) {
              const nextSetClosure = epsilonClosure(Array.from(nextStates));

              const nextKey = mapKey(nextSetClosure);
              dfaStates.get(currentKey).transitions[symbol] = nextKey;
              if (!dfaStates.has(nextKey)) {
                dfaStates.set(nextKey, { id: nextKey, transitions: {}, states: nextSetClosure });
                queue.push(nextSetClosure);
              }
            }
          }
        }
        const newMachine = { type: 'DFA', states: [], transitions: [], alphabet };
        let i = 0;
        for (const [key, dfaState] of dfaStates.entries()) {
          const isInitial = key === mapKey(initialClosure);

          const isAccepting = dfaState.states.some(s => nfaMachine.states.find(ns => ns.id === s)?.accepting);

          newMachine.states.push({ id: key, initial: isInitial, accepting: isAccepting, x: 200 + (i % 5) * 180, y: 150 + Math.floor(i / 5) * 150 });

          for (const symbol in dfaState.transitions) {
            newMachine.transitions.push({ from: key, to: dfaState.transitions[symbol], symbol });
          }
          i++;
        }
        return newMachine;
      }

      function minimizeDfa(dfa) {
        const states = dfa.states.map(s => s.id);
        const alph = dfa.alphabet;
        let P = [
          dfa.states.filter(s => s.accepting).map(s => s.id),
          dfa.states.filter(s => !s.accepting).map(s => s.id)
        ].filter(g => g.length > 0);

        let changed = true;
        while (changed) {
          changed = false;

          for (const symbol of alph) {
            const newP = [];

            for (const group of P) {
              const subgroups = {};

              for (const state of group) {
                const t = dfa.transitions.find(tr => tr.from === state && tr.symbol === symbol);

                const destGroupIdx = t ? P.findIndex(g => g.includes(t.to)) : -1;
                if (!subgroups[destGroupIdx]) subgroups[destGroupIdx] = [];
                subgroups[destGroupIdx].push(state);
              }
              const splitGroups = Object.values(subgroups);
              if (splitGroups.length > 1) changed = true;
              newP.push(...splitGroups);
            }
            P = newP;
          }
        }
        const repMap = {};

        P.forEach(group => { const rep = group[0]; group.forEach(s => repMap[s] = rep); });

        return {
          type: 'DFA',
          alphabet: alph,
          states: P.map((group, i) => {
            const rep = group[0];
            const oldState = dfa.states.find(s => s.id === rep);
            return { id: rep, initial: oldState.initial, accepting: oldState.accepting, x: 200 + (i % 5) * 180, y: 150 + Math.floor(i / 5) * 150 };
          }),
          transitions: dfa.transitions
            .map(t => ({ from: repMap[t.from], to: repMap[t.to], symbol: t.symbol }))
            .filter((t, i, self) => i === self.findIndex(o => o.from === t.from && o.to === t.to && o.symbol === t.symbol))
        };
      }

      // --- UTILITY & HELPER FUNCTIONS ---

      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      function validateAutomaton() {
        const mode = modeSelect.value;
        const states = MACHINE.states; const transitions = MACHINE.transitions;
        const errors = [];

        if (states.length === 0) return 'Invalid: No states defined.';
        const initialCount = states.filter(s => s.initial).length;

        if (states.filter(s => s.accepting).length === 0) errors.push('Warning: No accepting states.');

        if (mode.includes('DFA')) {
          if (initialCount !== 1) errors.push(`DFA must have 1 initial state (found ${initialCount}).`);

          if (transitions.some(t => t.symbol === '' || t.symbol === 'ε')) errors.push('DFA cannot have ε-transitions.');

          for (const st of states) {
            const symbols = new Set();

            for (const t of transitions.filter(tt => tt.from === st.id)) {
              if (symbols.has(t.symbol)) {
                errors.push(`State '${st.id}' is non-deterministic on symbol '${t.symbol}'.`);
                break;
              }
              symbols.add(t.symbol);
            }
          }
        } else if (mode.includes('NFA')) {
          if (initialCount < 1) errors.push(`Automaton must have ≥1 initial state.`);
          if (mode === 'NFA' && transitions.some(t => t.symbol === '' || t.symbol === 'ε')) {
            errors.push('NFA cannot have ε-transitions (use ε-NFA mode).');
          }
        } else if (mode.includes('ENFA')) {
          if (initialCount < 1) errors.push(`Automaton must have ≥1 initial state.`);
        }

        return errors.length > 0 ? 'Invalid: ' + errors.join('; ') : 'Valid';
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

        if (symbol === '') symbol = 'ε';

        // Mode-specific silent rule enforcement (no alert/popup for better UX)
        if (MACHINE.type === 'DFA' && symbol === 'ε') {
          validationLine.textContent = 'DFA rule: ε-transitions disallowed.';
          validationLine.classList.add('error', 'show');
          setTimeout(() => validationLine.classList.remove('show'), 4000);
          return;
        }
        const conflict = MACHINE.transitions.find(t => t.from === from && t.symbol === symbol);

        if (MACHINE.type === 'DFA' && conflict) {
          validationLine.textContent = `DFA rule: State ${from} is deterministic on '${symbol}'.`;
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
        let dragging = false; let currentCircle = null; let currentStateG = null;
        let lastPos = { x: 0, y: 0 }; let raf = null;
        function getPoint(evt) {
          const pt = svg.createSVGPoint();
          if (evt.touches && evt.touches[0]) { pt.x = evt.touches[0].clientX; pt.y = evt.touches[0].clientY; }
          else { pt.x = evt.clientX; pt.y = evt.clientY; }
          return pt.matrixTransform(svg.getScreenCTM().inverse());
        }
        function animate() {
          if (!dragging) return; raf = requestAnimationFrame(animate);
          const sid =
            currentStateG.getAttribute('data-id');
          const sObj = MACHINE.states.find(x => x.id === sid); if (!sObj) return;
          // Simple spring damping effect
          sObj.x += (lastPos.x - sObj.x) * 0.22; sObj.y += (lastPos.y - sObj.y) * 0.22;
          renderAll();
        }
        function startDrag(stateG, circle, evt) {
          if (CURRENT_MODE !== 'move') return;
          pushUndo(); dragging = true; currentCircle = circle; currentStateG = stateG;
          circle.classList.add('state-selected');
          const p = getPoint(evt); lastPos.x = p.x; lastPos.y = p.y;
          animate(); evt.preventDefault(); evt.stopPropagation();
        }
        function moveDrag(evt) {
          if (!dragging) return;
          const p = getPoint(evt); lastPos.x = p.x;
          lastPos.y = p.y;
          const vb = svg.viewBox.baseVal;
          // Keep state within canvas bounds
          lastPos.x = Math.min(Math.max(lastPos.x, vb.x + 40), vb.x + vb.width - 40);
          lastPos.y = Math.min(Math.max(lastPos.y, vb.y + 40), vb.y + vb.height - 40);
        }
        function endDrag() {
          if (!dragging) return; dragging = false;
          if (currentCircle) currentCircle.classList.remove('state-selected');

          if (raf) { cancelAnimationFrame(raf); raf = null; }
          renderAll();
        }
        statesGroup.addEventListener('pointerdown', function (e) {
          const stateG = e.target.closest('g[data-id]'); if (!stateG) return;
          const circle = stateG.querySelector('circle.state-circle'); if (!circle) return;
          startDrag(stateG, circle, e);
        });

        svg.addEventListener('pointermove', moveDrag);
        svg.addEventListener('pointerup', endDrag);
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
          await sleep(400);
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
          await sleep(500);
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

      // Enhanced PNG Export: CAPTURES LIVE STYLES AND COLORS
      exportBtn.addEventListener('click', () => {
        const svgEl = document.getElementById("dfaSVG");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Create a Blob from the LIVE SVG element, which includes all current styles (fill, stroke, colors)
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          // Use the SVG's current dimensions for the canvas
          canvas.width = svgEl.viewBox.baseVal.width;
          canvas.height = svgEl.viewBox.baseVal.height;

          ctx.fillStyle = 'white'; // Ensure a clean white background
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const a = document.createElement("a");
          a.download = "automaton.png";
          a.href = canvas.toDataURL("image/png");
          a.click();
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
  setTimeout(()=> {
    try { loadMachineFromLocal(); } catch(e) { /*ignore*/ }
  }, 300);

  // If there is a save button and it calls download, keep it; but autosave will still run.
  // Expose a small helper used by other UI to call autosave after modifications
  window._autosaveAfterChange = function(){
    if(window.MACHINE) saveMachineToLocal(window.MACHINE);
  };

  // --- Export SVG as PNG exact replica (preserve styles and markers) ---
  function exportSvgAsPng(svgEl, filename='automaton.png') {
    try {
      const serializer = new XMLSerializer();
      // Clone the SVG node so we can modify safely
      const clone = svgEl.cloneNode(true);
      // Inline computed styles: simple approach - grab the document <style> content and inject
      let styleText = '';
      const docStyles = document.querySelectorAll('head style, head link[rel="stylesheet"]');
      docStyles.forEach(node => {
        if(node.tagName.toLowerCase() === 'style') styleText += node.innerHTML + '\n';
      });
      // Also grab our page-level styles from the big style tag if present
      if(styleText.trim()){
        const styleElem = document.createElementNS("http://www.w3.org/2000/svg",'style');
        styleElem.textContent = styleText;
        clone.insertBefore(styleElem, clone.firstChild);
      }
      // Ensure namespaces
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      // Set width/height attributes from bounding box or viewBox
      const bbox = svgEl.getBoundingClientRect();
      clone.setAttribute('width', Math.ceil(bbox.width));
      clone.setAttribute('height', Math.ceil(bbox.height));
      // Serialize
      const svgStr = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      // allow CORS-free usage
      img.onload = function(){
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(bbox.width);
          canvas.height = Math.ceil(bbox.height);
          const ctx = canvas.getContext('2d');
          // White background? The user requested exact replica (including transparent background if any).
          // We'll preserve transparency by default (do not fill background).
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          // Trigger download
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

  // Small consumer-friendly log so autosave gets called from UI actions that already exist.
  // Try to attach to some known action elements: add state on canvas, genPractice, validate, saveMachineBtn, loadMachineBtn.
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




/* --- BEGIN: Enforce exactly ONE initial state across all modes --- */
function ensureSingleInitial() {
  try {
    if (!window.MACHINE || !Array.isArray(window.MACHINE.states)) return;
    const states = window.MACHINE.states;
    // Find indices of initial states
    const initialIdxs = states.map((s,i)=> s.initial ? i : -1).filter(i=> i>=0);
    if (initialIdxs.length === 0 && states.length > 0) {
      // If none marked initial, make the first state initial.
      states[0].initial = true;
      // Also update DOM if possible
      markStateInitialInDOM(states[0].id);
      showValidationMessage("No initial state found: auto-setting first state as initial.", "success");
    } else if (initialIdxs.length > 1) {
      // Keep the first and unset the rest
      const keepIdx = initialIdxs[0];
      states.forEach((s, idx) => s.initial = (idx === keepIdx));
      // Update DOM
      states.forEach(s => markStateInitialInDOM(s.id));
      showValidationMessage("Multiple initial states found: reduced to a single initial state.", "error");
    } else {
      // exactly one - ensure DOM consistent
      states.forEach(s => markStateInitialInDOM(s.id));
    }
  } catch (e) {
    console.error("ensureSingleInitial failed:", e);
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

