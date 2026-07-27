'use strict';

const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = window.location.origin;
const BOOKS_API = `${API_BASE}/books`;

let mockBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { id: 3, title: '1984', author: 'George Orwell' },
  { id: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  { id: 5, title: 'Brave New World', author: 'Aldous Huxley' },
];
let mockNextId = 6;

const state = { books: [], currentSort: '', searchQuery: '', editingBookId: null, deletingBook: null };

document.addEventListener('DOMContentLoaded', async () => {
  attachEventListeners();
  await loadBooks();
  setTimeout(() => document.getElementById('loading-screen')?.classList.add('hidden'), 800);
});

async function fetchBooks() {
  if (isGitHubPages) {
    let res = [...mockBooks];
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      res = res.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (state.currentSort === 'title') res.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.currentSort === 'author') res.sort((a, b) => a.author.localeCompare(b.author));
    return res;
  }

  const params = new URLSearchParams();
  if (state.searchQuery) params.set('search', state.searchQuery);
  if (state.currentSort) params.set('sort', state.currentSort);
  const url = params.toString() ? `${BOOKS_API}?${params}` : BOOKS_API;

  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

async function createBookApi(title, author) {
  if (isGitHubPages) {
    const newBook = { id: mockNextId++, title, author };
    mockBooks.push(newBook);
    return newBook;
  }
  const res = await fetch(BOOKS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author })
  });
  const data = await res.json();
  return data.data;
}

async function updateBookApi(id, title, author) {
  if (isGitHubPages) {
    const b = mockBooks.find(x => x.id === id);
    if (b) {
      if (title) b.title = title;
      if (author) b.author = author;
    }
    return b;
  }
  const res = await fetch(`${BOOKS_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author })
  });
  const data = await res.json();
  return data.data;
}

async function deleteBookApi(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  if (isGitHubPages) {
    mockBooks = mockBooks.filter(x => x.id !== id);
  } else {
    await fetch(`${BOOKS_API}/${id}`, { method: 'DELETE' });
  }
  await loadBooks();
}

async function loadBooks() {
  try {
    state.books = await fetchBooks();
    renderDashboard();
    renderBooksTable();
  } catch (e) {
    console.error(e);
  }
}

function renderDashboard() {
  document.getElementById('stat-total-count').textContent = state.books.length;
  const latest = state.books[state.books.length - 1];
  document.getElementById('stat-latest-title').textContent = latest ? latest.title : 'None';
  document.getElementById('stat-api-status-text').textContent = isGitHubPages ? 'Demo Mode ✓' : 'Online ✓';
  document.getElementById('stat-date-text').textContent = new Date().toLocaleDateString();
}

function renderBooksTable() {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  if (state.books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--txt-muted)">No books found</td></tr>`;
    return;
  }
  tbody.innerHTML = state.books.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>#${b.id}</td>
      <td><strong>${esc(b.title)}</strong></td>
      <td>${esc(b.author)}</td>
      <td>
        <button class="btn btn-ghost" onclick="openEditModal(${b.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteBookApi(${b.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openEditModal(id) {
  const b = state.books.find(x => x.id === id);
  if (!b) return;
  state.editingBookId = id;
  document.getElementById('edit-book-id').value = id;
  document.getElementById('edit-title').value = b.title;
  document.getElementById('edit-author').value = b.author;
  document.getElementById('edit-modal').classList.add('active');
}

function navigateTo(key) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${key}`)?.classList.add('active');
  document.getElementById(`nav-${key}`)?.classList.add('active');
}

window.navigateTo = navigateTo;
window.openEditModal = openEditModal;
window.deleteBookApi = deleteBookApi;

function attachEventListeners() {
  document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(l.dataset.section);
  }));

  document.getElementById('add-book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('add-title').value.trim();
    const author = document.getElementById('add-author').value.trim();
    if (!title || !author) return;
    await createBookApi(title, author);
    document.getElementById('add-book-form').reset();
    await loadBooks();
    navigateTo('books');
  });

  document.getElementById('edit-save-btn')?.addEventListener('click', async () => {
    const id = state.editingBookId;
    const title = document.getElementById('edit-title').value.trim();
    const author = document.getElementById('edit-author').value.trim();
    await updateBookApi(id, title, author);
    document.getElementById('edit-modal').classList.remove('active');
    await loadBooks();
  });

  document.getElementById('edit-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('edit-modal').classList.remove('active');
  });

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    loadBooks();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentSort = btn.dataset.sort;
      loadBooks();
    });
  });
}

function esc(s) { return s.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
