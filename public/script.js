/**
 * script.js — Book Management System Frontend
 * Author: Mohamed Rashid | Internship Project 2026
 */

'use strict';

const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = window.location.origin;
const BOOKS_API = `${API_BASE}/books`;
const STATUS_API = `${API_BASE}/api/status`;

let mockBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { id: 3, title: '1984', author: 'George Orwell' },
  { id: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  { id: 5, title: 'Brave New World', author: 'Aldous Huxley' },
];
let mockNextId = 6;

const state = {
  books: [],
  currentSort: '',
  searchQuery: '',
  editingBookId: null,
  deletingBook: null,
  apiOnline: false,
};

const dom = {
  loadingScreen: () => document.getElementById('loading-screen'),
  toastContainer: () => document.getElementById('toast-container'),
  sidebar: () => document.getElementById('sidebar'),
  menuToggleBtn: () => document.getElementById('menu-toggle-btn'),
  sidebarCloseBtn: () => document.getElementById('sidebar-close-btn'),
  breadcrumbCurrent: () => document.getElementById('breadcrumb-current'),
  topbarClock: () => document.getElementById('topbar-clock'),
  themeToggleBtn: () => document.getElementById('theme-toggle-btn'),
  themeIcon: () => document.getElementById('theme-icon'),
  appBody: () => document.getElementById('app-body'),
  sidebarStatusDot: () => document.getElementById('sidebar-status-dot'),
  sidebarStatusText: () => document.getElementById('sidebar-status-text'),

  statTotalCount: () => document.getElementById('stat-total-count'),
  statLatestTitle: () => document.getElementById('stat-latest-title'),
  statApiStatusText: () => document.getElementById('stat-api-status-text'),
  statDateText: () => document.getElementById('stat-date-text'),

  recentBooksGrid: () => document.getElementById('recent-books-grid'),
  booksTbody: () => document.getElementById('books-tbody'),
  bookTable: () => document.getElementById('books-table'),
  emptyState: () => document.getElementById('empty-state'),
  tableSkeleton: () => document.getElementById('table-skeleton'),
  searchInput: () => document.getElementById('search-input'),
  searchClearBtn: () => document.getElementById('search-clear-btn'),
  bookCountLabel: () => document.getElementById('book-count-label'),

  addBookForm: () => document.getElementById('add-book-form'),
  addTitle: () => document.getElementById('add-title'),
  addAuthor: () => document.getElementById('add-author'),
  addTitleCount: () => document.getElementById('add-title-count'),
  addAuthorCount: () => document.getElementById('add-author-count'),
  addTitleError: () => document.getElementById('add-title-error'),
  addAuthorError: () => document.getElementById('add-author-error'),
  addBookBtn: () => document.getElementById('add-book-btn'),
  clearFormBtn: () => document.getElementById('clear-form-btn'),
  addSuccessPanel: () => document.getElementById('add-success-panel'),
  addSuccessMsg: () => document.getElementById('add-success-msg'),
  successAddAnotherBtn: () => document.getElementById('success-add-another-btn'),

  editModal: () => document.getElementById('edit-modal'),
  editBookId: () => document.getElementById('edit-book-id'),
  editTitle: () => document.getElementById('edit-title'),
  editAuthor: () => document.getElementById('edit-author'),
  editTitleError: () => document.getElementById('edit-title-error'),
  editAuthorError: () => document.getElementById('edit-author-error'),
  editSaveBtn: () => document.getElementById('edit-save-btn'),
  editCancelBtn: () => document.getElementById('edit-cancel-btn'),
  editModalClose: () => document.getElementById('edit-modal-close'),

  deleteModal: () => document.getElementById('delete-modal'),
  deleteBookName: () => document.getElementById('delete-book-name'),
  deleteConfirmBtn: () => document.getElementById('delete-confirm-btn'),
  deleteCancelBtn: () => document.getElementById('delete-cancel-btn'),
  deleteModalClose: () => document.getElementById('delete-modal-close'),
  modalBackdrop: () => document.getElementById('modal-backdrop'),
};

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  startClock();
  attachEventListeners();
  await initApp();
  setTimeout(() => { dom.loadingScreen()?.classList.add('hidden'); }, 1200);
});

async function initApp() {
  await checkApiStatus();
  await loadBooks();
  renderDashboard();
}

function startClock() {
  const updateClock = () => {
    const now = new Date();
    if (dom.topbarClock()) {
      dom.topbarClock().textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

function initTheme() {
  const saved = localStorage.getItem('bms-theme') || 'dark-mode';
  applyTheme(saved);
}

function applyTheme(theme) {
  const body = dom.appBody();
  const icon = dom.themeIcon();
  if (body) {
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(theme);
  }
  if (icon) icon.className = theme === 'dark-mode' ? 'ri-sun-line' : 'ri-moon-line';
  localStorage.setItem('bms-theme', theme);
}

function toggleTheme() {
  const isDark = dom.appBody().classList.contains('dark-mode');
  applyTheme(isDark ? 'light-mode' : 'dark-mode');
  showToast(isDark ? 'Light mode activated' : 'Dark mode activated', '', 'info');
}

const SECTIONS = {
  'dashboard': { id: 'section-dashboard', label: 'Dashboard', nav: 'nav-dashboard' },
  'books':     { id: 'section-books',     label: 'Book Library', nav: 'nav-books' },
  'add-book':  { id: 'section-add-book',  label: 'Add Book', nav: 'nav-add' },
  'api-docs':  { id: 'section-api-docs',  label: 'API Docs', nav: 'nav-api' },
};

function navigateTo(sectionKey) {
  const section = SECTIONS[sectionKey];
  if (!section) return;

  Object.values(SECTIONS).forEach(s => {
    document.getElementById(s.id)?.classList.remove('active');
    document.getElementById(s.nav)?.classList.remove('active');
  });

  document.getElementById(section.id)?.classList.add('active');
  document.getElementById(section.nav)?.classList.add('active');

  if (dom.breadcrumbCurrent()) dom.breadcrumbCurrent().textContent = section.label;
  dom.sidebar()?.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (sectionKey === 'books') renderBooksTable();
  if (sectionKey === 'add-book') resetAddForm();
  if (sectionKey === 'dashboard') renderDashboard();
}

window.navigateTo = navigateTo;

async function checkApiStatus() {
  if (isGitHubPages) {
    state.apiOnline = false;
    updateApiStatusUI(false, 'Demo Mode');
    return;
  }
  try {
    const res = await fetch(STATUS_API, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      state.apiOnline = true;
      updateApiStatusUI(true, 'API Online');
    } else {
      state.apiOnline = false;
      updateApiStatusUI(false, 'API Offline');
    }
  } catch {
    state.apiOnline = false;
    updateApiStatusUI(false, 'API Offline');
  }
}

async function fetchBooks() {
  if (isGitHubPages || !state.apiOnline) {
    let result = [...mockBooks];
    if (state.searchQuery) {
      const term = state.searchQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
    }
    if (state.currentSort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.currentSort === 'author') result.sort((a, b) => a.author.localeCompare(b.author));
    return result;
  }

  const params = new URLSearchParams();
  if (state.searchQuery) params.set('search', state.searchQuery);
  if (state.currentSort) params.set('sort', state.currentSort);
  const url = params.toString() ? `${BOOKS_API}?${params}` : BOOKS_API;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

async function createBookApi(bookData) {
  if (isGitHubPages || !state.apiOnline) {
    const newBook = { id: mockNextId++, ...bookData };
    mockBooks.push(newBook);
    return newBook;
  }
  const res = await fetch(BOOKS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.join(', ') || data.message);
  return data.data;
}

async function updateBookApi(id, updates) {
  if (isGitHubPages || !state.apiOnline) {
    const idx = mockBooks.findIndex(b => b.id === id);
    if (idx !== -1) {
      if (updates.title) mockBooks[idx].title = updates.title;
      if (updates.author) mockBooks[idx].author = updates.author;
      return mockBooks[idx];
    }
  }
  const res = await fetch(`${BOOKS_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.join(', ') || data.message);
  return data.data;
}

async function deleteBookApi(id) {
  if (isGitHubPages || !state.apiOnline) {
    const deleted = mockBooks.find(b => b.id === id);
    mockBooks = mockBooks.filter(b => b.id !== id);
    return deleted;
  }
  const res = await fetch(`${BOOKS_API}/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.data;
}

async function loadBooks() {
  showTableSkeleton();
  try {
    state.books = await fetchBooks();
  } catch (err) {
    console.error(err);
    state.books = [];
  } finally {
    hideTableSkeleton();
  }
}

function renderDashboard() {
  if (dom.statTotalCount()) dom.statTotalCount().textContent = state.books.length;
  const latest = state.books[state.books.length - 1];
  if (dom.statLatestTitle()) dom.statLatestTitle().textContent = latest ? latest.title : 'No books yet';
  if (dom.statApiStatusText()) dom.statApiStatusText().textContent = state.apiOnline ? 'Online ✓' : (isGitHubPages ? 'Demo Mode ✓' : 'Offline ✗');
  if (dom.statDateText()) dom.statDateText().textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const recentGrid = dom.recentBooksGrid();
  if (!recentGrid) return;
  const recent = [...state.books].slice(-6).reverse();

  if (recent.length === 0) {
    recentGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--txt-muted);">No books yet.</div>`;
    return;
  }

  recentGrid.innerHTML = recent.map(book => `
    <div class="recent-book-card">
      <div class="recent-book-id"><i class="ri-hashtag"></i>${book.id}</div>
      <div class="recent-book-title">${escHtml(book.title)}</div>
      <div class="recent-book-author"><i class="ri-user-line"></i>${escHtml(book.author)}</div>
    </div>
  `).join('');
}

function renderBooksTable() {
  const tbody = dom.booksTbody();
  if (!tbody) return;
  const books = state.books;

  if (dom.bookCountLabel()) dom.bookCountLabel().textContent = `${books.length} book${books.length !== 1 ? 's' : ''}`;

  if (books.length === 0) {
    tbody.innerHTML = '';
    if (dom.emptyState()) dom.emptyState().style.display = 'block';
    if (dom.bookTable()) dom.bookTable().style.display = 'none';
    return;
  }

  if (dom.emptyState()) dom.emptyState().style.display = 'none';
  if (dom.bookTable()) dom.bookTable().style.display = 'table';

  tbody.innerHTML = books.map((book, idx) => `
    <tr id="row-${book.id}">
      <td class="table-row-num">${idx + 1}</td>
      <td><span class="table-id-badge">${book.id}</span></td>
      <td class="table-title">${escHtml(book.title)}</td>
      <td class="table-author">${escHtml(book.author)}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn action-btn-edit" onclick="openEditModal(${book.id})"><i class="ri-edit-2-line"></i></button>
          <button class="action-btn action-btn-delete" onclick="openDeleteModal(${book.id}, '${escHtml(book.title).replace(/'/g, "\\'")}')"><i class="ri-delete-bin-6-line"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showTableSkeleton() {
  if (dom.tableSkeleton()) dom.tableSkeleton().classList.add('visible');
  if (dom.emptyState()) dom.emptyState().style.display = 'none';
  if (dom.bookTable()) dom.bookTable().style.display = 'none';
}

function hideTableSkeleton() {
  if (dom.tableSkeleton()) dom.tableSkeleton().classList.remove('visible');
}

async function handleSearch(term) {
  state.searchQuery = term;
  if (dom.searchClearBtn()) dom.searchClearBtn().style.display = term ? 'flex' : 'none';
  await loadBooks();
  renderBooksTable();
}

async function handleSort(sort) {
  state.currentSort = sort;
  document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.sort === sort));
  await loadBooks();
  renderBooksTable();
}

async function handleAddBook(e) {
  e.preventDefault();
  const title = dom.addTitle().value.trim();
  const author = dom.addAuthor().value.trim();
  if (!title || !author) return;

  setButtonLoading(dom.addBookBtn(), true);
  try {
    const newBook = await createBookApi({ title, author });
    state.books.push(newBook);
    dom.addSuccessMsg().textContent = `"${newBook.title}" by ${newBook.author} has been added with ID #${newBook.id}.`;
    dom.addBookForm().style.display = 'none';
    dom.addSuccessPanel().style.display = 'block';
    showToast('Book Added!', `"${newBook.title}" added successfully.`, 'success');
  } catch (err) {
    showToast('Failed to Add', err.message, 'error');
  } finally {
    setButtonLoading(dom.addBookBtn(), false);
  }
}

function resetAddForm() {
  dom.addBookForm()?.reset();
  if (dom.addBookForm()) dom.addBookForm().style.display = 'flex';
  if (dom.addSuccessPanel()) dom.addSuccessPanel().style.display = 'none';
  if (dom.addTitleCount()) dom.addTitleCount().textContent = '0 / 200';
  if (dom.addAuthorCount()) dom.addAuthorCount().textContent = '0 / 100';
}

function openEditModal(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;
  state.editingBookId = id;
  dom.editBookId().value = id;
  dom.editTitle().value = book.title;
  dom.editAuthor().value = book.author;
  openModal(dom.editModal());
}

window.openEditModal = openEditModal;

async function handleSaveEdit() {
  const id = state.editingBookId;
  const title = dom.editTitle().value.trim();
  const author = dom.editAuthor().value.trim();
  if (!title || !author) return;

  setButtonLoading(dom.editSaveBtn(), true);
  try {
    const updated = await updateBookApi(id, { title, author });
    const idx = state.books.findIndex(b => b.id === id);
    if (idx !== -1) state.books[idx] = updated;
    closeAllModals();
    renderBooksTable();
    renderDashboard();
    showToast('Book Updated!', `"${updated.title}" updated successfully.`, 'success');
  } catch (err) {
    showToast('Update Failed', err.message, 'error');
  } finally {
    setButtonLoading(dom.editSaveBtn(), false);
  }
}

function openDeleteModal(id, title) {
  state.deletingBook = { id, title };
  if (dom.deleteBookName()) dom.deleteBookName().textContent = `"${title}"`;
  openModal(dom.deleteModal());
}

window.openDeleteModal = openDeleteModal;

async function handleConfirmDelete() {
  if (!state.deletingBook) return;
  const { id, title } = state.deletingBook;
  setButtonLoading(dom.deleteConfirmBtn(), true);
  try {
    await deleteBookApi(id);
    state.books = state.books.filter(b => b.id !== id);
    renderBooksTable();
    renderDashboard();
    closeAllModals();
    showToast('Book Deleted!', `"${title}" deleted.`, 'success');
  } catch (err) {
    showToast('Delete Failed', err.message, 'error');
  } finally {
    setButtonLoading(dom.deleteConfirmBtn(), false);
  }
}

function openModal(modalEl) {
  modalEl?.classList.add('active');
  dom.modalBackdrop()?.classList.add('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  dom.modalBackdrop()?.classList.remove('active');
}

function updateApiStatusUI(online, label) {
  const dot = dom.sidebarStatusDot();
  const text = dom.sidebarStatusText();
  if (dot) dot.className = `status-dot ${online ? 'online' : ''}`;
  if (text) text.textContent = label;
}

function showToast(title, message, type = 'info') {
  const container = dom.toastContainer();
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div><strong>${escHtml(title)}</strong> ${escHtml(message)}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  const txt = btn.querySelector('.btn-text');
  const ldn = btn.querySelector('.btn-loading');
  if (txt) txt.style.display = loading ? 'none' : 'inline-flex';
  if (ldn) ldn.style.display = loading ? 'inline-flex' : 'none';
  btn.disabled = loading;
}

function escHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attachEventListeners() {
  dom.themeToggleBtn()?.addEventListener('click', toggleTheme);
  dom.menuToggleBtn()?.addEventListener('click', () => dom.sidebar()?.classList.toggle('open'));
  dom.sidebarCloseBtn()?.addEventListener('click', () => dom.sidebar()?.classList.remove('open'));

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  dom.addBookForm()?.addEventListener('submit', handleAddBook);
  dom.clearFormBtn()?.addEventListener('click', resetAddForm);
  dom.successAddAnotherBtn()?.addEventListener('click', resetAddForm);

  dom.addTitle()?.addEventListener('input', () => {
    const len = dom.addTitle().value.length;
    if (dom.addTitleCount()) dom.addTitleCount().textContent = `${len} / 200`;
  });
  dom.addAuthor()?.addEventListener('input', () => {
    const len = dom.addAuthor().value.length;
    if (dom.addAuthorCount()) dom.addAuthorCount().textContent = `${len} / 100`;
  });

  let searchDebounce;
  dom.searchInput()?.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => handleSearch(e.target.value.trim()), 300);
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => handleSort(btn.dataset.sort));
  });

  dom.editSaveBtn()?.addEventListener('click', handleSaveEdit);
  dom.editCancelBtn()?.addEventListener('click', closeAllModals);
  dom.editModalClose()?.addEventListener('click', closeAllModals);

  dom.deleteConfirmBtn()?.addEventListener('click', handleConfirmDelete);
  dom.deleteCancelBtn()?.addEventListener('click', closeAllModals);
  dom.deleteModalClose()?.addEventListener('click', closeAllModals);
  dom.modalBackdrop()?.addEventListener('click', closeAllModals);
}
