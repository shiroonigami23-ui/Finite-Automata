import * as FA from './ui.js';
import * as FA_STATE from './state.js';
import * as FA_RENDER from './renderer.js';
import * as MM from './moore_mealy_ui.js';
import * as MM_STATE from './moore_mealy_state.js';
import * as MM_RENDER from './moore_mealy_renderer.js';
import * as FA_FILE from './file.js';
import * as MM_FILE from './moore_mealy_file.js';
import * as FA_LIB from './library-loader.js';
import * as MM_LIB from './moore_mealy_library_loader.js';


// --- Context Object for Dynamic Switching ---
export const StudioContext = {
    current: 'FA',
    get MACHINE() { return this.current === 'FA' ? FA_STATE.MACHINE : MM_STATE.MACHINE; },
    get initializeState() { return this.current === 'FA' ? FA_STATE.initializeState : MM_STATE.initializeState; },
    get initializeUI() { return this.current === 'FA' ? FA.initializeUI : MM.initializeUI; },
    get updateUndoRedoButtons() { 
        return this.current === 'FA' ? FA.updateUndoRedoButtons : MM.updateUndoRedoButtons; 
    },
    // The state setter function is needed by external modules like file.js
    get setMachine() { return this.current === 'FA' ? FA_STATE.setMachine : MM_STATE.setMachine; },
    get setRenderFunction() { return this.current === 'FA' ? FA_STATE.setRenderFunction : MM_STATE.setRenderFunction; },
    get renderAll() { return this.current === 'FA' ? FA_RENDER.renderAll : MM_RENDER.renderAll; },
    
    // File/Library Handlers - Passed the context's update function
    get handleSaveMachine() { return this.current === 'FA' ? FA_FILE.saveMachine : MM_FILE.handleSaveMachine; },
    // FIX: Load Machine must be fully dynamic, passing the context's button updater
    get loadMachine() { 
        const loadFn = this.current === 'FA' ? FA_FILE.loadMachine : MM_FILE.loadMachine;
        return (e) => loadFn(e, this.updateUndoRedoButtons);
    },
    get initializeLibrary() { return this.current === 'FA' ? FA_LIB.initializeLibrary : MM_LIB.initializeLibrary; },
    
    // HTML Content Getter
    getHtmlContent: function(target) {
        return target === 'FA' ? this.faHtml() : this.mmHtml();
    },
    
      // --- Inside StudioContext object in unified_main.js ---

    // Anonymous function property for FA HTML
    faHtml: function() {
        return `
    <div class="app-container" role="application" aria-label="Finite Automata Practice Studio">
      <header class="header">
        <h1>Finite Automata Practice</h1>
        <button id="panelToggleBtn" class="panel-toggle-btn" type="button">
            <i data-lucide="menu"></i>
        </button>
      </header>
      <main class="main-content">
        <aside id="controlPanel" class="control-panel" aria-label="Controls">
          <details class="control-section" open>
            <summary>
                <i data-lucide="sliders-horizontal"></i>
                <span>Mode & Interaction</span>
            </summary>
            <div class="control-section-content">
              <div style="display:flex;gap:8px;">
                <select id="modeSelect" aria-label="Mode select">
                  <option value="DFA">DFA</option>
                  <option value="NFA">NFA</option>
                  <option value="ENFA">ε-NFA</option>
                  <option value="ENFA_TO_NFA">ε-NFA → NFA</option>
                  <option value="NFA_TO_DFA">NFA → DFA</option>
                  <option value="NFA_TO_MIN_DFA">NFA → Minimal DFA</option>
                  <option value="DFA_TO_MIN_DFA">DFA → Minimal DFA</option>
                </select>
              </div>
            </div>
          </details>
          <details class="control-section" open>
            <summary>
                <i data-lucide="puzzle"></i>
                <span>Practice Generator</span>
            </summary>
            <div class="control-section-content">
              <div style="margin-bottom:12px">
                <div style="display:flex;gap:8px">
                  <select id="practiceMode" style="flex:1;">
                    <option value="basic">Basic</option>
                    <option value="medium">Medium</option>
                    <option value="easy">Easy</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button class="icon-btn" id="genPracticeBtn" type="button">Generate</button>
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
                  <button class="icon-btn" id="showSolBtn" type="button">Show Solution</button>
                  <button class="icon-btn" id="resetPractice" type="button">Reset</button>
                  <button class="icon-btn" id="checkAnswerBtn" type="button">Check Answer</button>
                </div>
                <div id="practiceBox">No practice generated yet.</div>
              </div>
            </div>
          </details>
          <details class="control-section">
            <summary>
                <i data-lucide="flask-conical"></i>
                <span>Testing</span>
            </summary>
             <div class="control-section-content">
              <div class="controls-group">
                <div class="test-panel">
                  <div class="input"><input id="testInput" placeholder="Enter string (e.g., abbab)" /></div>
                  <button id="runTestBtn" class="run-btn" type="button">Run</button>
                </div>
                <div id="randomStringBox">
                  <i data-lucide="dice-5"></i> <button id="genRandBtn" class="icon-btn" type="button">Random</button>
                </div>
                <details id="testOptionsCollapse">
                  <summary><i data-lucide="settings-2"></i> Simulation Options</summary>
                  <div id="testOptions">
                    <label><input type="radio" name="simMode" value="auto" checked>
                      Auto</label>
                    <label><input type="radio" name="simMode" value="manual"> Manual</label>
                    <label>Speed:
                      <select id="testSpeed">
                        <option value="500">Fast</option>
                        <option value="1500" selected>Normal</option>
                        <option value="2500">Slow</option>
                      </select>
                    </label>
                    <div id="manualButtons" style="display:none;">
                      <button id="stepPrev" class="icon-btn" type="button">◀ Prev</button>
                      <button id="stepNext" class="icon-btn" type="button">Next ▶</button>
                      <button id="stepReset" class="icon-btn" type="button">⟲ Reset</button>
                    </div>
                  </div>
                </details>
                <div id="testOutput" class="output-display">Ready</div>
              </div>
            
              <div style="border-top:1px solid #e6eef8;margin-top:12px;padding-top:12px;">
                <details id="bulkTestSection">
                  <summary><i data-lucide="test-tubes"></i> Bulk Testing</summary>
                  <div>
                    <textarea id="bulkTestInput" placeholder="Enter test strings (one per line)..."></textarea>
                    <button id="bulkRunBtn" class="icon-btn" style="width:100%; margin-top: 8px;" type="button">Run Bulk Test</button>
                    <div id="bulkTestOutput">
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </details>
          <details class="control-section">
            <summary>
                <i data-lucide="folder"></i>
                <span>File</span>
            </summary>
            <div class="control-section-content">
              <div class="control-row">
                <button id="saveMachineBtn" title="Save machine (JSON)" type="button"><i data-lucide="save"></i> Save</button>
                <button id="loadMachineBtn" title="Load machine (JSON)" type="button"><i data-lucide="folder-open"></i> Load</button>
              </div>
              <div class="control-row">
                <button id="exportPngBtn" title="Export canvas as PNG" type="button"><i data-lucide="image"></i> Export PNG</button>
                <button id="importImageBtn" title="Import from Image" type="button"><i data-lucide="scan-line"></i> Import Image</button>
              </div>
              <input type="file" id="loadFileInput" accept=".json" style="display:none" />
              <input type="file" id="importImageInput" accept="image/*" style="display:none" />
            </div>
          </details>
          
          <details class="control-section" id="aiGeneratorSection">
            <summary>
                <i data-lucide="wand-2"></i>
                <span>AI Generator</span>
            </summary>
            <div class="control-section-content">
              <div>
                <label for="aiDescInput" style="font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 4px;">From Description</label>
                <textarea id="aiDescInput" placeholder="e.g., A DFA that accepts strings with an even number of 0s" style="height: 60px; resize: vertical;"></textarea>
                <button id="aiGenerateFromDescBtn" class="icon-btn" style="width:100%; margin-top: 8px;" type="button">Generate</button>
              </div>
              <div style="border-top: 1px solid #e6eef8; margin: 16px 0;"></div>
              <div>
                <label for="aiRegexInput" style="font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 4px;">From Regex</label>
                <input id="aiRegexInput" placeholder="e.g., (a|b)*abb" />
                <button id="aiGenerateFromRegexBtn" class="icon-btn" style="width:100%; margin-top: 8px;" type="button">Generate</button>
              </div>
            </div>
          </details>
          
          <details class="control-section" id="librarySection">
            <summary>
                <i data-lucide="library"></i>
                <span>Library</span>
            </summary>
            <div class="control-section-content">
              <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">
                <input id="libSearch" placeholder="Search..." />
                <select id="libFilter">
                  <option value="all">All Types</option>
                  <option value="DFA">DFA</option>
                  <option value="NFA">NFA</option>
                  <option value="ENFA">ε-NFA</option>
                </select>
                <button id="libRefresh" class="icon-btn" title="Refresh library" type="button"><i data-lucide="refresh-cw"></i></button>
              </div>
              <div id="libraryList">
                <div>Library empty — click Refresh to load.</div>
              </div>
            </div>
          </details>
          
          <details class="control-section" open>
            <summary>
                <i data-lucide="home"></i>
                <span>Navigation</span>
            </summary>
            <div class="control-section-content">
              <button id="backToMenuBtn" class="icon-btn" style="width:100%;">
                <i data-lucide="arrow-left-circle"></i> Back to Main Menu
              </button>
            </div>
          </details>
        </aside>
        
        <div class="main-column">
            <section id="visualization-panel" class="visualization-panel" aria-label="Visualization" style="position: relative;">
              <div class="visualization-header" style="display:flex;align-items:center;gap:12px;">
                <div style="flex:1"><strong>Automata Visualization</strong>
                  <div class="kv">Mode: <span id="modeLabel">DFA</span></div>
                </div>
              </div>
              <div class="canvas-wrapper" id="canvasWrapper">
                <div class="canvas-top">
                  <div class="canvas-toolbar" role="toolbar" aria-label="Canvas toolbar">
                    <div class="toolbar-icon" id="tool-addclick" title="Add state on canvas click" data-mode="addclick"><i
                        data-lucide="plus-circle"></i></div>
                    <div class="toolbar-icon" id="tool-move" title="Move states" data-mode="move"><i data-lucide="move"
                        ></i></div>
                    <div class="toolbar-icon" id="tool-transition" title="Add transition" data-mode="transition"><i
                        data-lucide="git-branch"></i></div>
                    <div class="toolbar-icon" id="tool-rename" title="Rename state" data-mode="rename"><i
                        data-lucide="edit-3"></i></div>
                    <div class="toolbar-icon" id="tool-delete" title="Delete state/transition" data-mode="delete"><i
                        data-lucide="trash-2"></i></div>
                    <div class="toolbar-icon" id="tool-stateprops" title="Set state properties" data-mode="stateprops"><i
                        data-lucide="settings"></i></div>
    
                    <button id="validateBtn" class="toolbar-icon" title="Validate Automaton" style="margin-left:8px" type="button"><i
                        data-lucide="check-circle"></i></button>
    
                    <div class="toolbar-icon" id="clearCanvasBtn" title="Clear Canvas"><i data-lucide="file-x"></i></div>
    
                    <div id="validationLine" class="validation-box"></div>
    
                    <button id="undoBtn" class="toolbar-icon" title="Undo" style="margin-left:auto;" type="button"><i
                        data-lucide="corner-up-left"></i></button>
                    <button id="redoBtn" class="toolbar-icon" title="Redo" type="button"><i data-lucide="corner-up-right"></i></button>
                  </div>
                </div>
                <div class="canvas-area">
                  <div class="svg-canvas" id="svgWrapper" tabindex="0">
                    <svg id="dfaSVG" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" role="img"
                      aria-label="Automaton canvas">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#667eea" />
                        </marker>
                        <marker id="arrowhead-export" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#000000" />
                        </marker>
                      </defs>
                      <g id="edges"></g>
                      <g id="states"></g>
                      <text id="canvasHint" x="700" y="420" text-anchor="middle" fill="#9aa6b2" font-size="18">Tap canvas to
                        add a state (use ➕ tool)</text>
                    </svg>
                  </div>
                </div>
              </div>
    
              <div class="zoom-controls" style="position: absolute; right: 30px; top: 150px; z-index: 50;">
                <button id="zoomInBtn" class="toolbar-icon" title="Zoom In" type="button"><i data-lucide="zoom-in"></i></button>
                <input id="zoomSlider" type="range" min="50" max="200" value="100" />
                <button id="zoomOutBtn" class="toolbar-icon" title="Zoom Out" type="button"><i data-lucide="zoom-out"></i></button>
                <button id="zoomResetBtn" class="toolbar-icon" title="Reset Zoom" type="button"><i data-lucide="refresh-ccw"></i></button>
              </div>
            </section>
            
            <div id="stepLog">Step log appears here.</div>
        </div>
        
      </main>
    </div>
`;
    },
    // Anonymous function property for MM HTML
    mmHtml: function() {
        return `
    <div class="app-container" role="application" aria-label="Mealy and Moore Machine Practice Studio">
      <header class="header" style="background: linear-gradient(90deg, #ff9800, #ff5722);">
        <h1>Mealy/Moore Machine Studio</h1>
        <button id="panelToggleBtn" class="panel-toggle-btn" type="button">
            <i data-lucide="menu"></i>
        </button>
      </header>
      <main class="main-content">
        <aside id="controlPanel" class="control-panel" aria-label="Controls">
          <details class="control-section" open>
            <summary>
                <i data-lucide="sliders-horizontal"></i>
                <span>Mode & Interaction</span>
            </summary>
            <div class="control-section-content">
              <div style="display:flex;gap:8px;">
                <select id="modeSelect" aria-label="Mode select">
                  <option value="MOORE">Moore Machine</option>
                  <option value="MEALY">Mealy Machine</option>
                  <option value="MOORE_TO_MEALY">Moore → Mealy</option>
                </select>
              </div>
            </div>
          </details>
          <details class="control-section" open>
            <summary>
                <i data-lucide="puzzle"></i>
                <span>Practice Generator</span>
            </summary>
            <div class="control-section-content">
              <div style="margin-bottom:12px">
                <div style="display:flex;gap:8px">
                  <select id="practiceMode" style="flex:1;">
                    <option value="easy">Easy</option>
                    <option value="basic">Basic</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button class="icon-btn" id="genPracticeBtn" type="button">Generate</button>
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
                  <button class="icon-btn" id="showSolBtn" type="button">Show Solution</button>
                  <button class="icon-btn" id="resetPractice" type="button">Reset</button>
                  <button class="icon-btn" id="checkAnswerBtn" type="button">Check Answer</button>
                </div>
                <div id="practiceBox">No practice generated yet.</div>
              </div>
            </div>
          </details>
          <details class="control-section">
            <summary>
                <i data-lucide="flask-conical"></i>
                <span>Testing (I/O Trace)</span>
            </summary>
             <div class="control-section-content">
              <div class="controls-group">
                <div class="test-panel">
                  <div class="input"><input id="testInput" placeholder="Enter input string (e.g., 0101)" /></div>
                  <button id="runTestBtn" class="run-btn" type="button">Run</button>
                </div>
                <div id="randomStringBox">
                  <i data-lucide="dice-5"></i> <button id="genRandBtn" class="icon-btn" type="button">Random</button>
                </div>
                <details id="testOptionsCollapse">
                  <summary><i data-lucide="settings-2"></i> Simulation Options</summary>
                  <div id="testOptions">
                    <label><input type="radio" name="simMode" value="auto" checked> Auto</label>
                    <label><input type="radio" name="simMode" value="manual"> Manual</label>
                    <label>Speed:
                      <select id="testSpeed">
                        <option value="500">Fast</option>
                        <option value="1500" selected>Normal</option>
                        <option value="2500">Slow</option>
                      </select>
                    </label>
                    <div id="manualButtons" style="display:none;">
                      <button id="stepPrev" class="icon-btn" type="button">◀ Prev</button>
                      <button id="stepNext" class="icon-btn" type="button">Next ▶</button>
                      <button id="stepReset" class="icon-btn" type="button">⟲ Reset</button>
                    </div>
                  </div>
                </details>
                <div id="testOutput" class="output-display">Ready</div>
              </div>
            
              <div style="border-top:1px solid #e6eef8;margin-top:12px;padding-top:12px;">
                <details id="bulkTestSection">
                  <summary><i data-lucide="test-tubes"></i> Bulk Testing</summary>
                  <div>
                      <textarea id="bulkTestInput" placeholder="Enter input strings (one per line)..."></textarea>
                    <button id="bulkRunBtn" class="icon-btn" style="width:100%; margin-top: 8px;" type="button">Run Bulk Test</button>
                    <div id="bulkTestOutput"></div>
                  </div>
                </details>
              </div>
            </div>
          </details>
          <details class="control-section">
            <summary>
                <i data-lucide="folder"></i>
                <span>File</span>
            </summary>
     <div class="control-section-content">
       <div class="control-row">
                <button id="saveMachineBtn" title="Save machine (JSON)" type="button"><i data-lucide="save"></i> Save</button>
                <button id="loadMachineBtn" title="Load machine (JSON)" type="button"><i data-lucide="folder-open"></i> Load</button>
              </div>
              <div class="control-row">
                <button id="exportPngBtn" title="Export canvas as PNG" type="button"><i data-lucide="image"></i> Export PNG</button>
                <button id="importImageBtn" title="Import from Image" type="button"><i data-lucide="scan-line"></i> Import Image</button>
              </div>
              <input type="file" id="loadFileInput" accept=".json" style="display:none" />
              <input type="file" id="importImageInput" accept="image/*" style="display:none" />
            </div>
          </details>
          
          <details class="control-section" id="aiGeneratorSection">
            <summary>
     <i data-lucide="wand-2"></i>
                <span>AI Generator (Mealy/Moore)</span>
            </summary>
            <div class="control-section-content">
              <div>
                <label for="aiDescInput" style="font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 4px;">Description of I/O Task</label>
                <textarea id="aiDescInput" placeholder="e.g., A Moore machine that outputs '1' if the number of '0's is even, otherwise '0'." style="height: 60px; resize: vertical;"></textarea>
                <button id="aiGenerateFromDescBtn" class="icon-btn" style="width:100%; margin-top: 8px;" type="button">Generate</button>
              </div>
            </div>
          </details>
          
          <details class="control-section" id="librarySection">
            <summary>
                <i data-lucide="library"></i>
                <span>Library</span>
            </summary>
            <div class="control-section-content">
              <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">
                <input id="libSearch" placeholder="Search..." />
                <select id="libFilter">
                  <option value="all">All Types</option>
                  <option value="MOORE">Moore</option>
                  <option value="MEALY">Mealy</option>
                </select>
                <button id="libRefresh" class="icon-btn" title="Refresh library" type="button"><i data-lucide="refresh-cw"></i></button>
              </div>
              <div id="libraryList">
                <div>Library empty — click Refresh to load.</div>
              </div>
            </div>
          </details>
          
          <details class="control-section" open>
            <summary>
                <i data-lucide="home"></i>
                <span>Navigation</span>
            </summary>
            <div class="control-section-content">
              <button id="backToMenuBtn" class="icon-btn" style="width:100%;">
                <i data-lucide="arrow-left-circle"></i> Back to Main Menu
              </button>
            </div>
          </details>
        </aside>
        
        <div class="main-column">
            <section id="visualization-panel" class="visualization-panel" aria-label="Visualization" style="position: relative;">
              <div class="visualization-header" style="display:flex;align-items:center;gap:12px;">
                <div style="flex:1"><strong>Automata Visualization</strong>
                  <div class="kv">Mode: <span id="modeLabel">Moore Machine</span></div>
                </div>
              </div>
              <div class="canvas-wrapper" id="canvasWrapper">
                <div class="canvas-top">
                  <div class="canvas-toolbar" role="toolbar" aria-label="Canvas toolbar">
                    <div class="toolbar-icon" id="tool-addclick" title="Add state on canvas click" data-mode="addclick"><i
                        data-lucide="plus-circle"></i></div>
                    <div class="toolbar-icon" id="tool-move" title="Move states" data-mode="move"><i data-lucide="move"
                        ></i></div>
                    <div class="toolbar-icon" id="tool-transition" title="Add transition" data-mode="transition"><i
                        data-lucide="git-branch"></i></div>
                    <div class="toolbar-icon" id="tool-rename" title="Rename state" data-mode="rename"><i
                        data-lucide="edit-3"></i></div>
                    <div class="toolbar-icon" id="tool-delete" title="Delete state/transition" data-mode="delete"><i
                        data-lucide="trash-2"></i></div>
                    <div class="toolbar-icon" id="tool-stateprops" title="Set state properties" data-mode="stateprops"><i
                        data-lucide="settings"></i></div>
    
                    <button id="validateBtn" class="toolbar-icon" title="Validate Automaton" style="margin-left:8px" type="button"><i
                        data-lucide="check-circle"></i></button>
    
                    <div class="toolbar-icon" id="clearCanvasBtn" title="Clear Canvas"><i data-lucide="file-x"></i></div>
    
                    <div id="validationLine" class="validation-box"></div>
    
                    <button id="undoBtn" class="toolbar-icon" title="Undo" style="margin-left:auto;" type="button"><i
                        data-lucide="corner-up-left"></i></button>
                    <button id="redoBtn" class="toolbar-icon" title="Redo" type="button"><i data-lucide="corner-up-right"></i></button>
                  </div>
                </div>
                <div class="canvas-area">
                  <div class="svg-canvas" id="svgWrapper" tabindex="0">
                    <svg id="dfaSVG" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" role="img"
                      aria-label="Automaton canvas">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#ff9800" />
                        </marker>
                        <marker id="arrowhead-export" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#000000" />
                        </marker>
                      </defs>
                      <g id="edges"></g>
                      <g id="states"></g>
                      <text id="canvasHint" x="700" y="420" text-anchor="middle" fill="#9aa6b2" font-size="18">Tap canvas to
                        add a state (use ➕ tool)</text>
                    </svg>
                  </div>
                </div>
              </div>
    
              <div class="zoom-controls" style="position: absolute; right: 30px; top: 150px; z-index: 50;">
                <button id="zoomInBtn" class="toolbar-icon" title="Zoom In" type="button"><i data-lucide="zoom-in"></i></button>
                <input id="zoomSlider" type="range" min="50" max="200" value="100" />
                <button id="zoomOutBtn" class="toolbar-icon" title="Zoom Out" type="button"><i data-lucide="zoom-out"></i></button>
                <button id="zoomResetBtn" class="toolbar-icon" title="Reset Zoom" type="button"><i data-lucide="refresh-ccw"></i></button>
              </div>
            </section>
            
            <div id="stepLog">I/O Trace steps appear here.</div>
        </div>
        
      </main>
    </div>
`;
    },
    
    // The state setter function is needed by external modules like file.js
    get setMachine() { return this.current === 'FA' ? FA_STATE.setMachine : MM_STATE.setMachine; },
    
};


/**
 * Dynamically loads the studio HTML content and initializes the appropriate scripts.
 * @param {'FA' | 'MM'} target The studio to load.
 */
function loadStudio(target) {
    const studioContent = document.getElementById('studioContent');
    const mainApp = document.getElementById('mainApp');
    if (!studioContent || !mainApp) {
        console.error("Critical DOM element #studioContent or #mainApp missing.");
        return;
    }
    mainApp.style.display = 'block';
    
    const htmlContent = StudioContext.getHtmlContent(target);
    studioContent.innerHTML = htmlContent;
    
    StudioContext.current = target;
    
    setTimeout(() => {
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // 1. Set the correct render function pointer in the state module
        StudioContext.setRenderFunction(StudioContext.renderAll);
        
        // 2. Initialize state (which calls updateUndoRedoButtons via context)
        StudioContext.initializeState(StudioContext.updateUndoRedoButtons);
        
        // 3. Initialize UI (which hooks up all the click handlers)
        StudioContext.initializeUI();
        
        // 4. Final render and library load
        StudioContext.renderAll(); 

    }, 50); 
}

// --- Main Application Startup ---
document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById('splashScreen');
    
    if (!splashScreen) {
        loadStudio('FA');
        return;
    }

    const navButtons = document.querySelectorAll('.splash-nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            if (!e.currentTarget.disabled) {
                splashScreen.style.opacity = '0';
                
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    loadStudio(target);
                }, 800);
            }
        });
    });
    
    // Default load if no selection is made or in an environment without the splash screen
    if(window.location.hash === '#mm') {
         loadStudio('MM');
    } else {
         loadStudio('FA');
    }
});


// Export context for use in all imported modules
window.StudioContext = StudioContext;