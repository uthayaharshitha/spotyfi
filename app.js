/* ─────────────────────────────────────────────────────────────────────
   SPOTIFY MOBILE — APP.JS
   Features:
    A) Sort by Inactivity (Cleanup Mode)
    B) Multi-Select System
───────────────────────────────────────────────────────────────────── */

// ── DATA (Mock) ──────────────────────────────────────────────────
const SONGS = [
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", playCount: 84, playing: true, grad: ["#c62828", "#880e4f"] },
  { id: 2, title: "Levitating", artist: "Dua Lipa", playCount: 52, grad: ["#283593", "#1565c0"] },
  { id: 3, title: "Stay", artist: "The Kid LAROI", playCount: 45, grad: ["#558b2f", "#1b5e20"] },
  { id: 4, title: "As It Was", artist: "Harry Styles", playCount: 41, grad: ["#e65100", "#bf360c"] },
  { id: 5, title: "Anti-Hero", artist: "Taylor Swift", playCount: 38, grad: ["#4a148c", "#311b92"] },
  { id: 6, title: "Heat Waves", artist: "Glass Animals", playCount: 22, grad: ["#01579b", "#0d47a1"] },
  { id: 7, title: "Cruel Summer", artist: "Taylor Swift", playCount: 18, grad: ["#006064", "#004d40"] },
  { id: 8, title: "Flowers", artist: "Miley Cyrus", playCount: 15, grad: ["#827717", "#f57f17"] },
  { id: 9, title: "Unholy", artist: "Sam Smith", playCount: 12, grad: ["#880e4f", "#4a148c"] },
  { id: 10, title: "Golden Hour", artist: "JVKE", playCount: 9, grad: ["#e65100", "#827717"] },
  { id: 11, title: "Someone Like You", artist: "Adele", playCount: 8, grad: ["#1a237e", "#283593"] },
  { id: 12, title: "Watermelon Sugar", artist: "Harry Styles", playCount: 6, grad: ["#b71c1c", "#e65100"] },
  { id: 13, title: "Good 4 U", artist: "Olivia Rodrigo", playCount: 5, grad: ["#37474f", "#263238"] },
  // Low play counts (Inactive threshold <= 4)
  { id: 14, title: "Dancing Queen", artist: "ABBA", playCount: 4, grad: ["#006064", "#01579b"] },
  { id: 15, title: "Bad Guy", artist: "Billie Eilish", playCount: 3, grad: ["#4e342e", "#3e2723"] },
  { id: 16, title: "Shivers", artist: "Ed Sheeran", playCount: 3, grad: ["#4a148c", "#880e4f"] },
  { id: 17, title: "Starboy", artist: "The Weeknd", playCount: 2, grad: ["#1b5e20", "#827717"] },
  { id: 18, title: "Peaches", artist: "Justin Bieber", playCount: 2, grad: ["#f57f17", "#e65100"] },
  { id: 19, title: "Montero", artist: "Lil Nas X", playCount: 1, grad: ["#b71c1c", "#4a148c"] },
  { id: 20, title: "Driver's License", artist: "Olivia Rodrigo", playCount: 1, grad: ["#1a237e", "#0d47a1"] },
  { id: 21, title: "Save Your Tears", artist: "The Weeknd", playCount: 1, grad: ["#880e4f", "#b71c1c"] },
  { id: 22, title: "Industry Baby", artist: "Lil Nas X", playCount: 0, grad: ["#e65100", "#006064"] },
  { id: 23, title: "Kiss Me More", artist: "Doja Cat", playCount: 0, grad: ["#4a148c", "#e65100"] }
];

// Randomize durations on load
SONGS.forEach(s => {
  const mins = Math.floor(Math.random() * 3) + 2; // 2 to 4 mins
  const secs = Math.floor(Math.random() * 60);
  s.duration = `${mins}:${secs.toString().padStart(2, '0')}`;
});

const THRESHOLD = 5; // minimum playCount to be considered "active"

// ── STATE ────────────────────────────────────────────────────────
let state = {
  isCleanupMode: false,
  isMultiSelect: false,
  isShuffled: false,
  searchQuery: '',
  selectedSongs: new Set(),
  activeSheetSongId: null,
  playingSongId: 1
};

// ── DOM REFS ─────────────────────────────────────────────────────
const ui = {
  scroll:      document.getElementById('scrollContent'),
  topbar:      document.getElementById('mobileTopbar'),
  topTitle:    document.getElementById('topbarTitle'),
  heroTitle:   document.querySelector('.playlist-title'),
  shuffleBtn:  document.getElementById('shuffleBtn'),
  cleanupBtn:  document.getElementById('cleanupBtn'),
  cleanupDot:  document.getElementById('cleanupDot'),
  searchInput: document.getElementById('playlistSearch'),
  multiTopbar: document.getElementById('multiselectTopbar'),
  multiCount:  document.getElementById('multiSelectCount'),
  bottomBar:   document.getElementById('bottomActionBar'),
  songList:    document.getElementById('songList'),
  sheet:       document.getElementById('bottomSheet'),
  overlay:     document.getElementById('sheetOverlay'),
  toast:       document.getElementById('toast'),
  hamburgerBtn:document.getElementById('hamburgerBtn'),
  sidebar:     document.querySelector('.sidebar'),
  sidebarOverlay:document.getElementById('sidebarOverlay')
};

// ── INIT ─────────────────────────────────────────────────────────
window.onload = () => {
  if (ui.topTitle && ui.heroTitle) {
    ui.topTitle.textContent = ui.heroTitle.textContent;
  }
  if (ui.scroll) ui.scroll.addEventListener('scroll', onScroll);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') handleBack(); });
  
  if (ui.searchInput) {
    ui.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderSongs();
    });
  }
  
  if (ui.hamburgerBtn) {
    ui.hamburgerBtn.addEventListener('click', toggleSidebar);
  }
  if (ui.sidebarOverlay) {
    ui.sidebarOverlay.addEventListener('click', closeSidebar);
  }

  renderSongs();
}

// ── SIDEBAR TOGGLE ───────────────────────────────────────────────
function toggleSidebar() {
  if (ui.sidebar && ui.sidebarOverlay) {
    const isOpen = ui.sidebar.classList.contains('open');
    if (isOpen) {
      closeSidebar();
    } else {
      ui.sidebar.classList.add('open');
      ui.sidebarOverlay.classList.remove('hidden');
      ui.sidebarOverlay.classList.add('visible');
    }
  }
}

function closeSidebar() {
  if (ui.sidebar && ui.sidebarOverlay) {
    ui.sidebar.classList.remove('open');
    ui.sidebarOverlay.classList.remove('visible');
    setTimeout(() => {
      ui.sidebarOverlay.classList.add('hidden');
    }, 300); // transition duration
  }
}

// ── SCROLL DETECT ────────────────────────────────────────────────
// Fades in top header title when hero title scrolls out of view
function onScroll() {
  const heroRect = ui.heroTitle.getBoundingClientRect();
  const threshold = 80; // topbar height approx
  if (heroRect.bottom < threshold) {
    ui.topTitle.classList.add('visible');
    ui.topbar.style.background = '#121212'; // Keep following with solid bg
    ui.topbar.style.backdropFilter = 'blur(10px)';
  } else {
    ui.topTitle.classList.remove('visible');
    ui.topbar.style.background = 'rgba(18, 18, 18, 0.7)'; // Dim but visible
    ui.topbar.style.backdropFilter = 'blur(10px)';
  }
}

function renderSongs() {
  ui.songList.innerHTML = '';
  
  // Apply Search Filter
  let displaySongs = SONGS.filter(s => 
    s.title.toLowerCase().includes(state.searchQuery) ||
    s.artist.toLowerCase().includes(state.searchQuery)
  );
  
  if (state.isCleanupMode) {
    // Activity Assort Sort: Most played first, then inactive ones separately
    const activeSongs = displaySongs.filter(s => s.playCount >= THRESHOLD).sort((a,b) => b.playCount - a.playCount);
    const inactiveSongs = displaySongs.filter(s => s.playCount < THRESHOLD).sort((a,b) => b.playCount - a.playCount);
    
    activeSongs.forEach((s, idx) => ui.songList.appendChild(buildRow(s, true, idx + 1)));
    
    if (inactiveSongs.length > 0) {
      const header = document.createElement('h3');
      header.className = 'section-header';
      header.textContent = 'Songs not played in 3 months';
      ui.songList.appendChild(header);
      inactiveSongs.forEach((s, idx) => ui.songList.appendChild(buildRow(s, true, activeSongs.length + idx + 1)));
    }
  } else {
    // DEFAULT FLAT LIST (or Shuffled)
    displaySongs.forEach((s, idx) => ui.songList.appendChild(buildRow(s, false, idx + 1)));
  }

  // Inject "Add Songs" button if search is empty
  if (state.searchQuery === '' && !state.isCleanupMode) {
    ui.songList.appendChild(buildAddMoreBtn());
  }

  updateMultiSelectUI();
}

function buildHeader(title, count) {
  // Desktop doesn't use section headers in the same way, but if needed,
  // we can just return an empty doc fragment since we sort the whole list.
  return document.createDocumentFragment();
}

function buildDivider() {
  return document.createDocumentFragment();
}

function buildAddMoreBtn() {
  const d = document.createElement('div');
  d.className = 'add-more-row';
  d.innerHTML = `
    <div class="add-icon-box">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>
    </div>
    <div class="add-more-text">
      <span class="add-main">Add to this playlist</span>
      <span class="add-sub">Find more songs</span>
    </div>
  `;
  d.addEventListener('click', () => {
    showToast('🔍 Opening search...');
    if(ui.searchInput) ui.searchInput.focus();
  });
  return d;
}

function buildRow(song, isSortedView, index) {
  const row = document.createElement('div');
  const isSelected = state.selectedSongs.has(song.id);
  const isPlaying  = state.playingSongId === song.id;

  row.className = 'song-row' +
    (isSelected ? ' selected' : '') +
    (isPlaying  ? ' playing' : '');
  row.dataset.id = song.id;

  // Render the index number OR a play icon if hovered/playing
  const numColHTML = `
    <div class="row-num-col">
      <span class="row-num">${isPlaying ? '<svg width="14" height="14" fill="var(--green)" viewBox="0 0 24 24"><path d="M6 3v18l15-9L6 3z"/></svg>' : index}</span>
      <span class="play-icon-hover"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3v18l15-9L6 3z"/></svg></span>
      ${state.isMultiSelect ? `<div class="song-checkbox ${isSelected ? 'checked' : ''}"></div>` : ''}
    </div>
  `;

  const [c1, c2] = song.grad;
  // Info Col (Thumb + Title + Artist)
  const infoColHTML = `
    <div class="row-info-col">
      <div class="song-thumb">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g${song.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
            </linearGradient>
          </defs>
          <rect width="40" height="40" fill="url(#g${song.id})"/>
          <text x="20" y="26" text-anchor="middle" font-size="20" fill="rgba(255,255,255,0.4)">♪</text>
        </svg>
      </div>
      <div class="song-text">
        <span class="song-title">${song.title}</span>
        <span class="song-artist">${song.artist}</span>
      </div>
    </div>
  `;

  // Album Col
  const albumColHTML = `<div class="row-album-col">${song.title} (Single)</div>`;
  
  // Date added Col (becomes Play Count string if sorted)
  let dateText = isSortedView 
    ? `<span class="inactivity-tag">Played ${song.playCount} time${song.playCount !== 1 ? 's' : ''}</span>`
    : `Oct 24, 2023`;
  const dateColHTML = `<div class="row-date-col">${dateText}</div>`;

  // Time Col
  const timeColHTML = `<div class="row-time-col">${song.duration}</div>`;

  // Dots Col
  const dotsColHTML = `
    <div class="row-dots-col">
      <button class="song-dots-btn" aria-label="More options">•••</button>
    </div>
  `;

  row.innerHTML = numColHTML + infoColHTML + albumColHTML + dateColHTML + timeColHTML + dotsColHTML;

  // ROW CLICK HANDLER
  row.addEventListener('click', (e) => {
    // If clicking dots, open context menu
    if (e.target.closest('.song-dots-btn')) {
      e.stopPropagation();
      openSheet(song, e);
      return;
    }
    // If multiselect ON, toggle checkbox
    if (state.isMultiSelect) {
      toggleSelect(song.id, row);
      return;
    }
    // Otherwise play song
    state.playingSongId = song.id;
    // Update global playbar UI
    document.getElementById('playbarTitle').textContent = song.title;
    document.getElementById('playbarArtist').textContent = song.artist;
    
    renderSongs();
  });

  return row;
}

// ── FEATURE A: CLEANUP TOGGLE ────────────────────────────────────
function toggleCleanupMode() {
  state.isCleanupMode = !state.isCleanupMode;
  
  if (state.isCleanupMode) {
    showToast('📊 Activity Assort: Splitting playlist...');
  } else {
    showToast('Restored default order');
  }

  ui.cleanupBtn.classList.toggle('active', state.isCleanupMode);
  ui.cleanupDot.classList.toggle('hidden', !state.isCleanupMode);
  
  renderSongs();
}

// ── SHUFFLE TOGGLE ───────────────────────────────────────────────
function toggleShuffle() {
  state.isShuffled = !state.isShuffled;
  
  // Visual state toggle
  ui.shuffleBtn.classList.toggle('active', state.isShuffled);
  
  if (state.isShuffled) {
    // Turn off cleanup state if it's currently on (Spotify behavior)
    if (state.isCleanupMode) toggleCleanupMode();
    
    // Fisher-Yates shuffle the master array
    for (let i = SONGS.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [SONGS[i], SONGS[j]] = [SONGS[j], SONGS[i]];
    }
    showToast('🔀 Shuffled playlist');
  } else {
    // Attempting to "unshuffle" without saving original index is tricky,
    // so let's just reverse shuffle or re-sort by ID for the prototype
    SONGS.sort((a,b) => a.id - b.id);
    showToast('Unshuffled');
  }

  renderSongs();
}

// ── DESKTOP CONTEXT MENU ─────────────────────────────────────────
function openSheet(song, e) {
  state.activeSheetSongId = song.id;
  
  // Position menu near the click
  const rect = e.target.getBoundingClientRect();
  ui.sheet.style.top = `${rect.bottom + window.scrollY}px`;
  
  // Keep menu inside window bounds
  if (rect.left + 200 > window.innerWidth) {
    ui.sheet.style.left = `${window.innerWidth - 220}px`;
  } else {
    ui.sheet.style.left = `${rect.left}px`;
  }

  ui.overlay.classList.remove('hidden');
  ui.sheet.classList.remove('hidden');
}

function closeSheet() {
  ui.overlay.classList.add('hidden');
  ui.sheet.classList.add('hidden');
  setTimeout(() => { state.activeSheetSongId = null; }, 300);
}

// Global open sheet handler (if needed from header)
function openPlaylistMenu() {
  showToast('Playlist options');
}

function sheetAction(action) {
  const id = state.activeSheetSongId;
  const song = SONGS.find(s => s.id === id);
  closeSheet();

  if (action === 'remove') {
    const idx = SONGS.findIndex(s => s.id === id);
    if (idx > -1) SONGS.splice(idx, 1);
    renderSongs();
    showToast(`Removed "${song.title}"`);
  } else {
    showToast(`Action: ${action}`);
  }
}

// ── FEATURE B: MULTI-SELECT ──────────────────────────────────────
function enterMultiSelectFromSheet() {
  const id = state.activeSheetSongId;
  closeSheet();
  
  state.isMultiSelect = true;
  state.selectedSongs.add(id); // pre-select right-clicked song
  
  // Transition UI
  ui.topbar.classList.add('hidden');
  ui.multiTopbar.classList.remove('hidden');
  
  renderSongs(); // slide in checkboxes
}

function exitMultiSelect() {
  state.isMultiSelect = false;
  state.selectedSongs.clear();
  
  ui.topbar.classList.remove('hidden');
  ui.multiTopbar.classList.add('hidden');
  
  renderSongs(); // slide out checkboxes
}

function toggleSelect(id, rowEl) {
  if (state.selectedSongs.has(id)) state.selectedSongs.delete(id);
  else state.selectedSongs.add(id);

  // Quick DOM update for snappiness (bypassing full render)
  const isSelected = state.selectedSongs.has(id);
  rowEl.classList.toggle('selected', isSelected);
  const cb = rowEl.querySelector('.song-checkbox');
  if (cb) cb.classList.toggle('checked', isSelected);

  updateMultiSelectUI();
}

function toggleSelectAll() {
  if (state.selectedSongs.size === SONGS.length) {
    state.selectedSongs.clear();
  } else {
    SONGS.forEach(s => state.selectedSongs.add(s.id));
  }
  renderSongs();
}

function updateMultiSelectUI() {
  if (!state.isMultiSelect) {
    ui.bottomBar.classList.add('hidden');
    return;
  }
  
  const nx = state.selectedSongs.size;
  
  // Topbar count
  ui.multiCount.textContent = nx === 0 ? 'No songs selected' : `${nx} selected`;
  document.getElementById('selectAllBtn').textContent = nx === SONGS.length ? 'None' : 'All';

  // Bottom action bar visibility
  if (nx > 0) {
    ui.bottomBar.classList.remove('hidden');
  } else {
    ui.bottomBar.classList.add('hidden');
  }
}

// ── BULK ACTIONS ─────────────────────────────────────────────────
function bulkAction(type) {
  const n = state.selectedSongs.size;
  const ids = Array.from(state.selectedSongs);

  if (type === 'remove') {
    ids.forEach(id => {
      const idx = SONGS.findIndex(s => s.id === id);
      if (idx > -1) SONGS.splice(idx, 1);
    });
    showToast(`Removed ${n} song${n !== 1 ? 's' : ''}`);
  } else {
    const map = { add: 'Added to playlist', move: 'Moved', queue: 'Added to queue' };
    showToast(`${map[type]} (${n} items)`);
  }

  exitMultiSelect();
}

// ── NAVIGATION / UTILS ───────────────────────────────────────────
function handleBack() {
  if (state.isMultiSelect) exitMultiSelect();
  else if (!ui.sheet.classList.contains('hidden')) closeSheet();
}

let toastTimer;
function showToast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ui.toast.classList.remove('show');
  }, 2500);
}
