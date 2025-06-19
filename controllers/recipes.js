const Recipe = require('../models/recipe');
const { cloudinary } = require("../cloudinary");

// Controller function to display all recipes
// Populates author information for each recipe
module.exports.index = async (req, res) => {
    const recipes = await Recipe.find({}).populate('author');  // Get all recipes with author details
    res.render('recipes/index', { recipes })
}

// Controller function to render the new recipe form
module.exports.renderNewForm = (req, res) => {
    res.render('recipes/new');
}

// Controller function to create a new recipe
// Handles image uploads and ingredient data
module.exports.createRecipe = async (req, res, next) => {
    const recipe = new Recipe(req.body.recipe);  // Create new recipe from form data
    
    // Process uploaded images and store Cloudinary URLs
    recipe.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    
    // Set the current user as the recipe author
    recipe.author = req.user._id;
    
    await recipe.save();  // Save recipe to database
    console.log(recipe);
    
    req.flash('success', 'Successfully made a new recipe!');
    res.redirect(`/recipes/${recipe._id}`)  // Redirect to the new recipe page
}

// Controller function to display a single recipe
// Populates reviews with author information and recipe author
module.exports.showRecipe = async (req, res,) => {
    const recipe = await Recipe.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'  // Populate review authors
        }
    }).populate('author');  // Populate recipe author
    
    if (!recipe) {
        req.flash('error', 'Cannot find that recipe!');
        return res.redirect('/recipes');
    }
    res.render('recipes/show', { recipe });
}

// Controller function to render the edit recipe form
// Pre-fills form with existing recipe data
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id)
    if (!recipe) {
        req.flash('error', 'Cannot find that recipe!');
        return res.redirect('/recipes');
    }
    res.render('recipes/edit', { recipe });
}

// Controller function to update an existing recipe
// Handles image uploads, deletions, and ingredient updates
module.exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    
    // Update recipe with new form data (including ingredients)
    const recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    
    // Process new uploaded images
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    recipe.images.push(...imgs);
    await recipe.save();
    
    // Handle image deletions if any images are marked for deletion
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);  // Delete from Cloudinary
        }
        // Remove deleted images from recipe document
        await recipe.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    
    req.flash('success', 'Successfully updated recipe!');
    res.redirect(`/recipes/${recipe._id}`)
}

// Controller function to delete a recipe
// Also deletes associated reviews (handled by mongoose middleware)
module.exports.deleteRecipe = async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);  // This triggers the post middleware to delete reviews
    req.flash('success', 'Successfully deleted recipe')
    res.redirect('/recipes');
}