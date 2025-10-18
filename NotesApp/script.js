/* =========================================================
   MarkNotes - Final JS
   Features:
   - create/edit/delete notes
   - tags + Smart Tag suggestions
   - favorites, search, filters
   - toolbar: font family/size/color + markdown formatting
   - localStorage persistence + export/import
   - dashboard stats, dark/light theme
   - welcome message, loader splash, autosave
   ========================================================= */

const APP_KEY = "marknotes_v1";
const loader = document.getElementById("loader");
const appRoot = document.getElementById("app");
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const saveBtn = document.getElementById("save-note");
const deleteBtn = document.getElementById("delete-note");
const favoriteBtn = document.getElementById("favorite-note");
const notesListEl = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");
const searchInput = document.getElementById("search");
const tagInput = document.getElementById("tag-input");
const titleInput = document.getElementById("note-title");
const toggleThemeBtn = document.getElementById("toggle-theme");
const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");
const filters = document.querySelectorAll(".filter-btn");
const tagListEl = document.getElementById("tag-list");
const statTotal = document.getElementById("stat-total");
const statFav = document.getElementById("stat-fav");
const statTopTag = document.getElementById("stat-top-tag");
const toastContainer = document.getElementById("toast-container");
const welcomeEl = document.getElementById("welcome");
const tagSuggestionsEl = document.getElementById("tag-suggestions");
const fontFamilySelect = document.getElementById("font-family");
const fontSizeSelect = document.getElementById("font-size");
const fontColorInput = document.getElementById("font-color");
const boldBtn = document.getElementById("bold-btn");
const italicBtn = document.getElementById("italic-btn");
const underlineBtn = document.getElementById("underline-btn");
const suggestTagsBtn = document.getElementById("suggest-tags-btn");

let notes = [];
let activeNoteId = null;
let activeFilter = "all";

/* ---------- Loader + Welcome ---------- */
window.addEventListener("load", () => {
  setTimeout(() => handleUserWelcome(), 700);
});

function handleUserWelcome() {
  const loaderContent = document.querySelector(".loader-content");
  let name = localStorage.getItem("marknotes_user");

  if (!name) {
    name = prompt("👋 Welcome! Please enter your name:")?.trim() || "Guest";
    localStorage.setItem("marknotes_user", name);
    loaderContent.innerHTML = `<div class="logo">MarkNotes</div><div class="sub">Nice to meet you, ${escapeHtml(name)} ✨</div>`;
  } else {
    loaderContent.innerHTML = `<div class="logo">MarkNotes</div><div class="sub">Welcome back, ${escapeHtml(name)} 👋</div>`;
  }

  setTimeout(() => {
    loader.style.display = "none";
    appRoot.classList.remove("hidden");
    welcomeEl.textContent = `Hello, ${name}!`;
    initApp();
    showToast(`Welcome ${name}!`);
  }, 1200);
}

/* ---------- LocalStorage Helpers ---------- */
function loadFromStorage() {
  try {
    notes = JSON.parse(localStorage.getItem(APP_KEY)) || [];
  } catch {
    notes = [];
  }
}
function saveToStorage() {
  localStorage.setItem(APP_KEY, JSON.stringify(notes));
}
function uid() {
  return "id-" + Math.random().toString(36).slice(2, 9);
}
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function debounce(fn, delay = 250) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), delay);
  };
}
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

/* ---------- CRUD ---------- */
function createNote() {
  const n = { id: uid(), title: "Untitled", content: "", tags: [], favorite: false, created: Date.now(), updated: Date.now() };
  notes.unshift(n);
  saveToStorage();
  refreshUI(n.id);
  openNote(n.id);
  showToast("📝 Note created");
}
function openNote(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;
  activeNoteId = id;
  titleInput.value = n.title;
  editor.value = n.content;
  preview.innerHTML = renderMarkdown(n.content);
  tagInput.value = (n.tags || []).join(", ");
}
function saveActiveNote() {
  if (!activeNoteId) return createNote();
  const n = notes.find(x => x.id === activeNoteId);
  if (!n) return;
  n.title = titleInput.value.trim() || "Untitled";
  n.content = editor.value;
  n.tags = (tagInput.value || "").split(",").map(t => t.trim()).filter(Boolean);
  n.updated = Date.now();
  notes = [n, ...notes.filter(x => x.id !== n.id)];
  saveToStorage();
  refreshUI(n.id);
  showToast("💾 Saved");
}
function deleteNote(id) {
  notes = notes.filter(x => x.id !== id);
  saveToStorage();
  if (activeNoteId === id) clearEditor();
  refreshUI();
  showToast("🗑️ Deleted");
}
function toggleFavorite(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;
  n.favorite = !n.favorite;
  n.updated = Date.now();
  saveToStorage();
  refreshUI(id);
}

/* ---------- UI Rendering ---------- */
function displayNotes(list) {
  notesListEl.innerHTML = "";
  if (!list.length) {
    notesListEl.innerHTML = '<li class="note-empty">No notes yet</li>';
    return;
  }
  list.forEach(n => {
    const li = document.createElement("li");
    li.className = "note-item";
    li.dataset.id = n.id;
    li.innerHTML = `
      <div class="note-main">
        <strong>${escapeHtml(n.title)}</strong>
        <div class="meta">${escapeHtml((n.content || "").slice(0, 90).replace(/\n/g, " "))}</div>
      </div>
      <div class="note-actions">
        <button class="fav">${n.favorite ? "★" : "☆"}</button>
        <button class="del">🗑️</button>
      </div>`;
    li.querySelector(".fav").onclick = e => { e.stopPropagation(); toggleFavorite(n.id); };
    li.querySelector(".del").onclick = e => { e.stopPropagation(); if (confirm("Delete this note?")) deleteNote(n.id); };
    li.onclick = () => openNote(n.id);
    notesListEl.appendChild(li);
  });
}
function renderTags() {
  const tagCount = {};
  notes.forEach(n => (n.tags || []).forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  tagListEl.innerHTML = "";
  Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]).forEach(t => {
    const btn = document.createElement("button");
    btn.className = "tag-item";
    btn.textContent = `${t} (${tagCount[t]})`;
    btn.onclick = () => filterByTag(t);
    tagListEl.appendChild(btn);
  });
  statTopTag.textContent = Object.keys(tagCount)[0] || "-";
}
function refreshUI(openId = null) {
  renderTags();
  updateStatsAnimated();
  filterNotes();
  if (openId) {
    setTimeout(() => {
      document.querySelector(`[data-id="${openId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}
function clearEditor() {
  titleInput.value = "";
  editor.value = "";
  preview.innerHTML = "";
  tagInput.value = "";
  activeNoteId = null;
}

/* ---------- Stats ---------- */
function updateStatsAnimated() {
  animateCount(statTotal, notes.length);
  animateCount(statFav, notes.filter(n => n.favorite).length);
}
function animateCount(el, val) {
  let c = 0;
  const step = Math.max(1, Math.floor(val / 20));
  const t = setInterval(() => {
    c += step;
    if (c >= val) { el.textContent = val; clearInterval(t); } else el.textContent = c;
  }, 20);
}

/* ---------- Filters & Search ---------- */
function filterNotes() {
  let list = [...notes];
  if (activeFilter === "fav") list = list.filter(n => n.favorite);
  const q = (searchInput.value || "").trim().toLowerCase();
  if (q) list = list.filter(n => (n.title + n.content + (n.tags || []).join(" ")).toLowerCase().includes(q));
  displayNotes(list);
}
function filterByTag(tag) {
  displayNotes(notes.filter(n => (n.tags || []).includes(tag)));
}

/* ---------- Export / Import ---------- */
function exportNotes() {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "marknotes-export.json";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("📤 Exported");
}
function importNotesFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const arr = JSON.parse(e.target.result);
      if (!Array.isArray(arr)) throw new Error("Invalid file");
      arr.forEach(item => { if (!item.id) item.id = uid(); });
      notes = [...arr, ...notes];
      saveToStorage();
      refreshUI();
      showToast("📥 Imported");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------- Toolbar ---------- */
fontFamilySelect.addEventListener("change", e => editor.style.fontFamily = e.target.value);
fontSizeSelect.addEventListener("change", e => editor.style.fontSize = e.target.value);
fontColorInput.addEventListener("input", e => editor.style.color = e.target.value);

function wrapSelection(start, end = start) {
  const el = editor;
  const s = el.selectionStart, e = el.selectionEnd;
  el.value = el.value.slice(0, s) + start + el.value.slice(s, e) + end + el.value.slice(e);
  preview.innerHTML = renderMarkdown(el.value);
}
boldBtn.onclick = () => wrapSelection("**", "**");
italicBtn.onclick = () => wrapSelection("*", "*");
underlineBtn.onclick = () => wrapSelection("<u>", "</u>");

/* ---------- Smart Tags ---------- */
function suggestTagsFromText(text, limit = 6) {
  const STOPWORDS = new Set(["the","and","is","in","to","a","of","it","this","that","for","on","with","as","are","was","be","by","an","or","at","from","you","your","i","we","they","but","if","not","have","has","will","can"]);
  const freq = {};
  text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).forEach(w => {
    if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, limit);
}
function showTagSuggestions() {
  const suggestions = suggestTagsFromText(editor.value + " " + titleInput.value);
  tagSuggestionsEl.innerHTML = "";
  if (!suggestions.length) return (tagSuggestionsEl.style.display = "none");
  tagSuggestionsEl.style.display = "flex";
  suggestions.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "tag-suggestion";
    btn.textContent = s;
    btn.onclick = () => {
      const cur = (tagInput.value || "").split(",").map(t => t.trim()).filter(Boolean);
      if (!cur.includes(s)) cur.push(s);
      tagInput.value = cur.join(", ");
    };
    tagSuggestionsEl.appendChild(btn);
  });
}

/* ---------- Theme ---------- */
function loadTheme() {
  const t = localStorage.getItem("marknotes_theme") || "light";
  if (t === "dark") document.body.classList.add("dark");
}
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("marknotes_theme", document.body.classList.contains("dark") ? "dark" : "light");
}

/* ---------- Init Events ---------- */
function initEvents() {
  editor.addEventListener("input", debounce(() => preview.innerHTML = renderMarkdown(editor.value), 120));
  saveBtn.onclick = saveActiveNote;
  deleteBtn.onclick = () => { if (activeNoteId && confirm("Delete this note?")) deleteNote(activeNoteId); };
  favoriteBtn.onclick = () => { if (activeNoteId) toggleFavorite(activeNoteId); };
  newNoteBtn.onclick = createNote;
  searchInput.addEventListener("input", debounce(filterNotes, 200));
  filters.forEach(btn => btn.onclick = () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    filterNotes();
  });
  exportBtn.onclick = exportNotes;
  importFile.onchange = e => { const f = e.target.files[0]; if (f) importNotesFile(f); importFile.value = ""; };
  toggleThemeBtn.onclick = toggleTheme;
  titleInput.addEventListener("input", debounce(() => { if (activeNoteId) saveActiveNote(); }, 600));
  suggestTagsBtn.onclick = showTagSuggestions;
  window.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveActiveNote(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); wrapSelection("**", "**"); }
  });
}

/* ---------- Markdown Renderer ---------- */
function renderMarkdown(md) {
  try { return marked.parse(md || ""); } catch { return "<pre>Markdown error</pre>"; }
}

/* ---------- App Init ---------- */
function initApp() {
  loadTheme();
  loadFromStorage();
  initEvents();
  if (!notes.length) {
    notes = [{
      id: uid(),
      title: "Welcome to MarkNotes",
      content: "# Welcome!\n\nThis is your first **MarkNotes** note.\n\n- Create notes\n- Add tags\n- Mark favorites\n\nEnjoy ✨",
      tags: ["welcome"],
      favorite: true,
      created: Date.now(),
      updated: Date.now()
    }];
    saveToStorage();
  }
  refreshUI();
  openNote(notes[0].id);
}

/* ---------- Autosave ---------- */
setInterval(() => {
  if (activeNoteId) {
    const n = notes.find(x => x.id === activeNoteId);
    if (n && n.content !== editor.value) {
      n.content = editor.value;
      n.updated = Date.now();
      saveToStorage();
    }
  }
}, 4000);


/* ---------- Loader Duration (M Rotation) ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const app = document.getElementById("app");

  // 🌀 انتظر 3.5 ثواني حتى يكمل حرف M دورانه الكامل
  setTimeout(() => {
    loader.classList.add("fade-out");
    app.classList.remove("hidden");
  }, 100500);
});
