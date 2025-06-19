const { recipeSchema, reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Recipe = require('./models/recipe');
const Review = require('./models/review');

// Authentication middleware - checks if user is logged in
// Redirects to login page if user is not authenticated
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl  // Store current URL to redirect back after login
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();  // Continue to next middleware/route handler
}

// Recipe validation middleware - validates recipe data and cleans ingredients array
module.exports.validateRecipe = (req, res, next) => {
    // Clean up ingredients array by removing empty ingredients
    // This prevents sparse array issues and ensures data integrity
    if (req.body.recipe && req.body.recipe.ingredients) {
        req.body.recipe.ingredients = req.body.recipe.ingredients.filter(ingredient => 
            ingredient && 
            ingredient.name && ingredient.name.trim() !== '' &&           // Name must not be empty
            ingredient.unit && ingredient.unit.trim() !== ''             // Unit must not be empty
            // Amount is now optional - removed amount validation
        );
    }
    
    // Validate image upload limit (max 2 images)
    if (req.files && req.files.length > 2) {
        req.flash('error', 'You can only upload a maximum of 2 images per recipe.');
        return res.redirect('back');
    }
    
    // Validate the cleaned recipe data against the Joi schema
    const { error } = recipeSchema.validate(req.body);
    console.log(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')  // Join all validation errors
        throw new ExpressError(msg, 400)  // Throw 400 Bad Request with validation errors
    } else {
        next();  // Continue if validation passes
    }
}

// Authorization middleware - checks if current user is the author of the recipe
// Only recipe authors can edit/delete their own recipes
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;  // Get recipe ID from URL parameters
    const recipe = await Recipe.findById(id);
    if (!recipe.author.equals(req.user._id)) {  // Compare recipe author with current user
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/recipes/${id}`);  // Redirect back to recipe page
    }
    next();  // Continue if user is the author
}

// Review authorization middleware - checks if current user is the author of the review
// Only review authors can delete their own reviews
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;  // Get recipe and review IDs from URL parameters
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {  // Compare review author with current user
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/recipes/${id}`);  // Redirect back to recipe page
    }
    next();  // Continue if user is the review author
}

// Review validation middleware - validates review data before saving
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);  // Validate against review schema
    if (error) {
        const msg = error.details.map(el => el.message).join(',')  // Join all validation errors
        throw new ExpressError(msg, 400)  // Throw 400 Bad Request with validation errors
    } else {
        next();  // Continue if validation passes
    }
}