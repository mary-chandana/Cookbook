// Load environment variables from .env file (only in development)
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

// Import route modules
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');
const reviewRoutes = require('./routes/reviews');

// Database connection configuration
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

// Connect to MongoDB database
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// Database connection event handlers
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// Initialize Express application
const app = express();

// Template engine configuration
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

// Middleware configuration
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(methodOverride('_method'));               // Enable HTTP method override
app.use(express.static(path.join(__dirname, 'public')))  // Serve static files

// Session configuration
const sessionConfig = {
    name: 'session',                              // Session cookie name
    secret: 'thisshouldbeabettersecret!',        // Session secret (should be in env vars)
    resave: false,                                // Don't save session if unmodified
    saveUninitialized: true,                      // Save new sessions
    cookie: {
        httpOnly: true,                           // Prevent XSS attacks
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,  // 1 week expiration
        maxAge: 1000 * 60 * 60 * 24 * 7          // 1 week max age
    }
}

// Apply session and flash middleware
app.use(session(sessionConfig))
app.use(flash());

// Passport authentication configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global middleware to make user and flash messages available to all views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;            // Make current user available in views
    res.locals.success = req.flash('success');    // Make success messages available
    res.locals.error = req.flash('error');        // Make error messages available
    next();
})

// Route configuration
app.use('/', userRoutes);                         // User authentication routes
app.use('/recipes', recipeRoutes);                // Recipe CRUD routes
app.use('/recipes/:id/reviews', reviewRoutes);    // Review routes (nested under recipes)

// Home page route
app.get('/', (req, res) => {
    res.render('home');
});

// 404 handler - catch all unmatched routes
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// Global error handler middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;             // Default to 500 if no status code
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'  // Default error message
    res.status(statusCode).render('error', { err })  // Render error page
})

// Start server
app.listen(3000, () => {
    console.log('Serving on port 3000')
})


