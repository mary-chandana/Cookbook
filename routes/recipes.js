const express = require('express');
const router = express.Router();
const recipes = require('../controllers/recipes');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateRecipe } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const Recipe = require('../models/recipe');

router.route('/')
    .get(catchAsync(recipes.index))
    .post(isLoggedIn, upload.array('image'), validateRecipe, catchAsync(recipes.createRecipe))


router.get('/new', isLoggedIn, recipes.renderNewForm)

router.route('/:id')
    .get(catchAsync(recipes.showRecipe))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateRecipe, catchAsync(recipes.updateRecipe))
    .delete(isLoggedIn, isAuthor, catchAsync(recipes.deleteRecipe));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(recipes.renderEditForm))



module.exports = router;