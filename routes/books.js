const express = require('express');
const router = express.Router();
const { getAllBooks, getBookById, createBook, updateBook, deleteBook } = require('../controllers/booksController');
const { validateNewBook, validateUpdateBook, validateId } = require('../middleware/validation');

router.get('/', getAllBooks);
router.get('/:id', validateId, getBookById);
router.post('/', validateNewBook, createBook);
router.put('/:id', validateId, validateUpdateBook, updateBook);
router.delete('/:id', validateId, deleteBook);

module.exports = router;
