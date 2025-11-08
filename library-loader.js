import { animateMachineDrawing } from './animation.js';

// --- Minimal Embedded FA Library Content (Avoids Fetch Error) ---
const EMBEDDED_LIB_JSON = `
[
    {
        "id": "dfa_even_0s",
        "title": "DFA: Even number of 0s",
        "type": "DFA",
        "description": "Accepts binary strings containing an even number of '0's.",
        "machine": {
            "states": [
                {"id": "qE", "initial": true, "accepting": true, "x": 100, "y": 300},
                {"id": "qO", "initial": false, "accepting": false, "x": 300, "y": 300}
            ],
            "transitions": [
                {"from": "qE", "to": "qO", "symbol": "0"},
                {"from": "qE", "to": "qE", "symbol": "1"},
                {"from": "qO", "to": "qE", "symbol": "0"},
                {"from": "qO", "to": "qO", "symbol": "1"}
            ],
            "alphabet": ["0", "1"]
        }
    }
]
`;
// --- End Embedded Library Content ---

// const LIB_URL = './library.json'; // Removed, now using embedded data

async function fetchLibrary() {
  try {
    // Parse the embedded JSON string directly
    return JSON.parse(EMBEDDED_LIB_JSON);
  } catch (e) {
    console.error("Error parsing FA Library JSON:", e);
    return null;
  }
}

function renderEntry(entry) {
  const container = document.createElement('div');
  container.className = 'library-entry';

  const head = document.createElement('div');
  head.className = 'library-entry-header';

  const title = document.createElement('div');
  title.innerHTML = `<strong>${entry.title || entry.id || 'Untitled'}</strong> <span class="library-entry-type">[${entry.type || 'N/A'}]</span>`;
  head.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'library-entry-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'icon-btn';
  
  // --- UPDATED: Check for machine data before enabling the button ---
  const machineData = entry.machine || entry;
  const hasMachineData = machineData && machineData.states && machineData.states.length > 0;

  if (hasMachineData) {
      openBtn.innerHTML = '<i data-lucide="play-circle"></i> Open';
      openBtn.onclick = () => {
          // Use the unified context setMachine function
          const machineToLoad = { ...machineData, type: entry.type || 'DFA', title: entry.title };
          window.StudioContext.loadMachine(machineToLoad);
          
          const modeSelect = document.getElementById('modeSelect');
          if (modeSelect) {
              modeSelect.value = entry.type || 'DFA';
              // No need to dispatch change event, loading handles setting the type
          }
      };
  } else {
      openBtn.innerHTML = '<i data-lucide="file-question"></i> No Data';
      openBtn.disabled = true;
  }
  
  actions.appendChild(openBtn);

  head.appendChild(actions);
  container.appendChild(head);

  const desc = document.createElement('div');
  desc.className = 'library-entry-description';
  desc.textContent = entry.description || entry.sol || 'No description available.';
  container.appendChild(desc);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [openBtn] });
  }

  return container;
}

async function refreshLibrary() {
  const listEl = document.getElementById('libraryList');
  if (!listEl) return;
  listEl.innerHTML = '<div class="library-message">Loading library…</div>';
  const data = await fetchLibrary();
  if (!data) {
    listEl.innerHTML = '<div class="library-message error">Failed to load library.json</div>';
    return;
  }
  window._LIB_DATA = data;
  renderLibraryItems(data);
}

function renderLibraryItems(data) {
  const listEl = document.getElementById('libraryList');
  if (!listEl) return;
    
  listEl.innerHTML = '';
  const q = (document.getElementById('libSearch') || {value:''}).value.trim().toLowerCase();
  const f = (document.getElementById('libFilter') || {value:'all'}).value;
  const filtered = data.filter(entry => {
    if (f !== 'all' && entry.type !== f) return false;
    if (!q) return true;
    const hay = ((entry.title||'') + ' ' + (entry.id||'') + ' ' + (entry.description||'') + ' ' + ((entry.tags||[]).join(' '))).toLowerCase();
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="library-message">No entries match.</div>';
    return;
  }
  filtered.forEach(entry => {
    const el = renderEntry(entry);
    listEl.appendChild(el);
  });
}

export function initializeLibrary() {
    const refreshBtn = document.getElementById('libRefresh');
    const search = document.getElementById('libSearch');
    const filter = document.getElementById('libFilter');
    
    if (refreshBtn) refreshBtn.onclick = refreshLibrary;
    
    if (search) search.oninput = () => renderLibraryItems(window._LIB_DATA || []);
    if (filter) filter.onchange = () => renderLibraryItems(window._LIB_DATA || []);

    refreshLibrary();
}