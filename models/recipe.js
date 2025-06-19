const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

// Image Schema for storing recipe images with Cloudinary URLs
const ImageSchema = new Schema({
    url: String,        // Cloudinary image URL
    filename: String    // Cloudinary filename for deletion
});

// Virtual property to generate thumbnail URLs for images
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

// Ingredient Schema for storing recipe ingredients with structured data
const IngredientSchema = new Schema({
    name: {
        type: String,
        required: true    // Ingredient name is mandatory
    },
    amount: {
        type: Number,
        required: false   // Amount is now optional
    },
    unit: {
        type: String,
        required: true    // Unit of measurement is mandatory
    }
});

// Main Recipe Schema - defines the structure for recipe documents
const RecipeSchema = new Schema({
    title: String,                    // Recipe title
    images: [ImageSchema],            // Array of recipe images
    instruction: String,              // Cooking instructions
    ingredients: [IngredientSchema],  // Array of ingredients with amounts and units
    author: {
        type: Schema.Types.ObjectId,  // Reference to User model
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,  // Reference to Review model
            ref: 'Review'
        }
    ]
});

// Middleware: When a recipe is deleted, also delete all associated reviews
// This prevents orphaned reviews in the database
RecipeSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews  // Delete all reviews whose IDs are in the recipe's reviews array
            }
        })
    }
})

module.exports = mongoose.model('Recipe', RecipeSchema);