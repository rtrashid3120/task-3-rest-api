let books = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { id: 3, title: '1984', author: 'George Orwell' },
  { id: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  { id: 5, title: 'Brave New World', author: 'Aldous Huxley' },
];
let nextId = 6;

const getAllBooks = (req, res) => {
  try {
    let result = [...books];
    const { search, sort } = req.query;
    if (search) {
      const term = search.toLowerCase().trim();
      result = result.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
    }
    if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'author') result.sort((a, b) => a.author.localeCompare(b.author));
    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error while fetching books.' });
  }
};

const getBookById = (req, res) => {
  try {
    const id = req.bookId;
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    return res.status(200).json({ success: true, data: book });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error while fetching book.' });
  }
};

const createBook = (req, res) => {
  try {
    const { title, author } = req.body;
    const newBook = { id: nextId++, title, author };
    books.push(newBook);
    return res.status(201).json({ success: true, message: 'Book created successfully.', data: newBook });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error while creating book.' });
  }
};

const updateBook = (req, res) => {
  try {
    const id = req.bookId;
    const bookIndex = books.findIndex(b => b.id === id);
    if (bookIndex === -1) return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    const { title, author } = req.body;
    if (title) books[bookIndex].title = title;
    if (author) books[bookIndex].author = author;
    return res.status(200).json({ success: true, message: 'Book updated successfully.', data: books[bookIndex] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error while updating book.' });
  }
};

const deleteBook = (req, res) => {
  try {
    const id = req.bookId;
    const bookIndex = books.findIndex(b => b.id === id);
    if (bookIndex === -1) return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    const deleted = books.splice(bookIndex, 1)[0];
    return res.status(200).json({ success: true, message: 'Book deleted successfully.', data: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error while deleting book.' });
  }
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };
