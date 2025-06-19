const Joi = require('joi');
const { number } = require('joi');

// Recipe validation schema - validates recipe data before saving to database
module.exports.recipeSchema = Joi.object({
    recipe: Joi.object({
        title: Joi.string().required(),                    // Recipe title is mandatory
        // image: Joi.string().required(),                 // Image validation (commented out - handled by multer)
        instruction: Joi.string().required(),              // Cooking instructions are mandatory
        ingredients: Joi.array().items(                    // Ingredients array validation
            Joi.object({
                name: Joi.string().required().min(1),      // Ingredient name must be non-empty string
                amount: Joi.number().optional().min(0),    // Amount is now optional, non-negative number if provided
                unit: Joi.string().required().min(1)       // Unit must be non-empty string
            })
        ).optional()                                       // Ingredients array is optional (for backward compatibility)
    }).required(),
    deleteImages: Joi.array()                             // Array of image filenames to delete
});

// Review validation schema - validates review data before saving
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        body: Joi.string().required()                      // Review text is mandatory
    }).required()
})

