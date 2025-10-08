const LIB_URL = './library.json';

async function fetchLibrary() {
  try {
    const res = await fetch(LIB_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('Failed to fetch library.json: ' + res.status);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function renderEntry(entry) {
  const container = document.createElement('div');
  container.style.border = '1px solid #e6eef8';
  container.style.padding = '8px';
  container.style.borderRadius = '8px';
  container.style.background = '#fff';

  const head = document.createElement('div');
  head.style.display = 'flex';
  head.style.justifyContent = 'space-between';
  head.style.alignItems = 'center';

  const title = document.createElement('div');
  title.innerHTML = `<strong>${entry.title || entry.id}</strong> <span style="color:#94a3b8;font-size:0.85em">[${entry.type || 'N/A'}]</span>`;
  head.appendChild(title);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '6px';

  const openBtn = document.createElement('button');
  openBtn.className = 'icon-btn';
  openBtn.textContent = 'Open';
  openBtn.onclick = () => {
    if (entry.machine) {
      if (typeof window.loadMachineFromObject === 'function') {
        const machineToLoad = { ...entry.machine, type: entry.type || 'DFA', title: entry.title || entry.id };
        window.loadMachineFromObject(machineToLoad);
      } else {
        alert('Error: The loadMachineFromObject function is missing. Make sure library_helper.js is loaded.');
      }
    } else {
      alert('No machine data in this entry.');
    }
  };
  actions.appendChild(openBtn);

  const viewBtn = document.createElement('button');
  viewBtn.className = 'icon-btn';
  viewBtn.textContent = 'View JSON';
  viewBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(entry, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  };
  actions.appendChild(viewBtn);

  head.appendChild(actions);
  container.appendChild(head);

  const desc = document.createElement('div');
  desc.style.marginTop = '6px';
  desc.style.color = '#374151';
  desc.style.fontSize = '0.95em';
  desc.textContent = entry.description || entry.sol || '';
  container.appendChild(desc);

  // This block checks for an imageUrl and displays the image if it exists.
  if (entry.imageUrl) {
    const imgWrapper = document.createElement('div');
    imgWrapper.style.marginTop = '8px';
    const img = document.createElement('img');
    img.src = entry.imageUrl;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '6px';
    img.style.border = '1px solid #eef2ff';
    img.alt = entry.title || 'Automaton Image';
    imgWrapper.appendChild(img);
    container.appendChild(imgWrapper);
  }

  if (entry.tags && entry.tags.length) {
    const tagRow = document.createElement('div');
    tagRow.style.marginTop = '6px';
    tagRow.style.fontSize = '0.85em';
    tagRow.style.color = '#6b7280';
    tagRow.textContent = 'Tags: ' + entry.tags.join(', ');
    container.appendChild(tagRow);
  }
  return container;
}

async function refreshLibrary() {
  const listEl = document.getElementById('libraryList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="color:#94a3b8;padding:8px">Loading library…</div>';
  const data = await fetchLibrary();
  if (!data) {
    listEl.innerHTML = '<div style="color:#e53e3e;padding:8px">Failed to load library.json</div>';
    return;
  }
  window._LIB_DATA = data;
  renderLibraryItems(data);
}

function renderLibraryItems(data) {
  const listEl = document.getElementById('libraryList');
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
    listEl.innerHTML = '<div style="color:#94a3b8;padding:8px">No entries match.</div>';
    return;
  }
  filtered.forEach(entry => {
    const el = renderEntry(entry);
    listEl.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('libRefresh');
  if (refreshBtn) refreshBtn.onclick = refreshLibrary;
  const search = document.getElementById('libSearch');
  const filter = document.getElementById('libFilter');
  if (search) search.oninput = () => renderLibraryItems(window._LIB_DATA || []);
  if (filter) filter.onchange = () => renderLibraryItems(window._LIB_DATA || []);
  const openJson = document.getElementById('openLibJson');
  if (openJson) openJson.onclick = () => window.open(LIB_URL, '_blank');
  const downloadLib = document.getElementById('downloadLib');
  if (downloadLib) downloadLib.onclick = () => window.open('./fa_library_package_fixed.zip', '_blank');

  setTimeout(()=>refreshLibrary(), 300);
});

const s = document.createElement('script');
s.src = './auto-renderer.js';
document.body.appendChild(s);
