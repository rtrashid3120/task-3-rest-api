'use strict';
const API_BASE = window.location.origin;
const BOOKS_API = `${API_BASE}/books`;

const state = { books: [], currentSort: '', searchQuery: '', editingBookId: null, deletingBook: null };

document.addEventListener('DOMContentLoaded', async () => {
  attachEventListeners();
  await loadBooks();
  setTimeout(() => document.getElementById('loading-screen')?.classList.add('hidden'), 1000);
});

async function fetchBooks() {
  const res = await fetch(BOOKS_API);
  const data = await res.json();
  return data.data || [];
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
  document.getElementById('stat-api-status-text').textContent = 'Online ✓';
  document.getElementById('stat-date-text').textContent = new Date().toLocaleDateString();
}

function renderBooksTable() {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
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

async function deleteBookApi(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  await fetch(`${BOOKS_API}/${id}`, { method: 'DELETE' });
  await loadBooks();
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
    await fetch(BOOKS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author })
    });
    document.getElementById('add-book-form').reset();
    await loadBooks();
    navigateTo('books');
  });

  document.getElementById('edit-save-btn')?.addEventListener('click', async () => {
    const id = state.editingBookId;
    const title = document.getElementById('edit-title').value.trim();
    const author = document.getElementById('edit-author').value.trim();
    await fetch(`${BOOKS_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author })
    });
    document.getElementById('edit-modal').classList.remove('active');
    await loadBooks();
  });

  document.getElementById('edit-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('edit-modal').classList.remove('active');
  });
}

function esc(s) { return s.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
