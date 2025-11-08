import { animateMachineDrawing } from './animation.js';

// --- Embedded Library Content (Eliminates Fetch Error) ---
const EMBEDDED_LIB_JSON = `
[
    {
        "type": "MOORE",
        "title": "Moore: Parity Checker (L mod 2)",
        "description": "Outputs '1' for even length inputs, '0' for odd length inputs. A classic introductory Moore machine.",
        "alphabet": ["0", "1"],
        "output_alphabet": ["0", "1"],
        "machine": {
            "type": "MOORE",
            "states": [
                {"id": "Even", "x": 150, "y": 300, "initial": true, "output": "1"},
                {"id": "Odd", "x": 350, "y": 300, "initial": false, "output": "0"}
            ],
            "transitions": [
                {"from": "Even", "to": "Odd", "symbol": "0"},
                {"from": "Even", "to": "Odd", "symbol": "1"},
                {"from": "Odd", "to": "Even", "symbol": "0"},
                {"from": "Odd", "to": "Even", "symbol": "1"}
            ]
        }
    },
    {
        "type": "MEALY",
        "title": "Mealy: Bit-Flipper",
        "description": "Outputs '0' if input is '1', and '1' if input is '0'. Inverts the input bit.",
        "alphabet": ["0", "1"],
        "output_alphabet": ["0", "1"],
        "machine": {
            "type": "MEALY",
            "states": [
                {"id": "q0", "x": 300, "y": 300, "initial": true}
            ],
            "transitions": [
                {"from": "q0", "to": "q0", "symbol": "0", "output": "1"},
                {"from": "q0", "to": "q0", "symbol": "1", "output": "0"}
            ]
        }
    }
]
`;
// --- End Embedded Library Content ---

async function fetchLibrary() {
  try {
    return JSON.parse(EMBEDDED_LIB_JSON);
  } catch (e) {
    console.error("Error parsing Mealy/Moore Library JSON:", e);
    return null;
  }
}

function renderEntry(entry) {
  const container = document.createElement('div');
  container.className = 'library-entry';

  const head = document.createElement('div');
  head.className = 'library-entry-header';

  const inputAlpha = (entry.machine?.alphabet || entry.alphabet || []).join(', ');
  const outputAlpha = (entry.machine?.output_alphabet || entry.output_alphabet || []).join(', ');
  
  const title = document.createElement('div');
  title.innerHTML = `<strong>${entry.title || 'Untitled'}</strong> <span class="library-entry-type">[${entry.type || 'N/A'}]</span>`;
  head.appendChild(title);

  const alphabets = document.createElement('div');
  alphabets.className = 'kv';
  alphabets.innerHTML = `&Sigma;: {${inputAlpha || '&Oslash;'}}, &Gamma;: {${outputAlpha || '&Oslash;'}}`;
  head.appendChild(alphabets);


  const actions = document.createElement('div');
  actions.className = 'library-entry-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'icon-btn';
  
  const machineData = entry.machine || entry;
  const hasMachineData = machineData && machineData.states && machineData.states.length > 0;

  if (hasMachineData) {
      openBtn.innerHTML = '<i data-lucide="play-circle"></i> Open';
      openBtn.onclick = () => {
          const machineToLoad = { 
              ...machineData, 
              type: entry.type || 'MEALY' 
          };
          // CRITICAL FIX: Call the global loader function defined in moore_mealy_ui.js
          if (window.loadMmMachine) {
              window.loadMmMachine(machineToLoad); 
          } else {
              window.customAlert("Error", "MM Studio is not fully initialized. Cannot load machine from library.");
          }
      };
  } else {
      openBtn.innerHTML = '<i data-lucide="file-question"></i> No Data';
      openBtn.disabled = true;
  }
  
  actions.appendChild(openBtn);
  container.appendChild(head);

  const desc = document.createElement('div');
  desc.className = 'library-entry-description';
  desc.textContent = entry.description || 'No description available.';
  container.appendChild(desc);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [openBtn] });
  }

  return container;
}

function renderLibraryItems(data) {
  const listEl = document.getElementById('libraryList');
  if (!listEl) return;
    
  // Re-check for elements inside the dynamically loaded UI
  const search = document.getElementById('libSearch');
  const filter = document.getElementById('libFilter');
    
  listEl.innerHTML = '';
  const q = (search || {value:''}).value.trim().toLowerCase();
  const f = (filter || {value:'all'}).value;
  
  const filtered = data.filter(entry => {
    const typeMatch = entry.type === 'MEALY' || entry.type === 'MOORE';
    if (!typeMatch) return false;

    if (f !== 'all' && entry.type !== f) return false;
    
    if (!q) return true;
    const hay = ((entry.title||'') + ' ' + (entry.description||'')).toLowerCase();
    return hay.includes(q);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="library-message">No Mealy/Moore entries found.</div>';
    return;
  }
  filtered.forEach(entry => {
    const el = renderEntry(entry);
    listEl.appendChild(el);
  });
}

export async function initializeLibrary() {
    const refreshBtn = document.getElementById('libRefresh');
    const search = document.getElementById('libSearch');
    const filter = document.getElementById('libFilter');
    
    const data = await fetchLibrary();
    window._MM_LIB_DATA = data;

    if (refreshBtn) refreshBtn.onclick = async () => {
        renderLibraryItems(window._MM_LIB_DATA);
    };

    if (search) search.oninput = () => renderLibraryItems(window._MM_LIB_DATA || []);
    if (filter) filter.onchange = () => renderLibraryItems(window._MM_LIB_DATA || []);

    renderLibraryItems(data);
}