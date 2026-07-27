const validateNewBook = (req, res, next) => {
  const { title, author } = req.body;
  const errors = [];
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required and must be a non-empty string.');
  }
  if (!author || typeof author !== 'string' || author.trim() === '') {
    errors.push('Author is required and must be a non-empty string.');
  }
  if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  req.body.title = title.trim();
  req.body.author = author.trim();
  next();
};

const validateUpdateBook = (req, res, next) => {
  const { title, author } = req.body;
  const errors = [];
  if (!title && !author) {
    errors.push('At least one field (title or author) must be provided for update.');
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    errors.push('Title must be a non-empty string.');
  }
  if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
    errors.push('Author must be a non-empty string.');
  }
  if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  if (title) req.body.title = title.trim();
  if (author) req.body.author = author.trim();
  next();
};

const validateId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID. ID must be a positive integer.' });
  }
  req.bookId = id;
  next();
};

module.exports = { validateNewBook, validateUpdateBook, validateId };
