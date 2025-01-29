const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const { Product, connectDB } = require('./mongo');
const User = require('./User'); 
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

const app = express();
const port = 3000;

// Middleware setup 
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to parse the incoming request body
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // For JSON data



// Set up session middleware with MongoDB store
app.use(
  session({
    secret: 'yourSecretKey', // Replace with a strong, unique secret
    resave: false,
    saveUninitialized: false, // Avoid creating sessions for unauthenticated users
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://shop_ease_user:2005@cluster0.6hhoa.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0', // Replace with your DB URL
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session valid for 1 day
      httpOnly: true,
      secure: false, // Set to `true` if using HTTPS
    },
  })
); 

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());
// Passport Local Strategy
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Initialize flash middleware
app.use(flash());
// Make flash messages accessible in views
app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  res.locals.messages = req.flash();
  next();
});


// Connect to MongoDB
connectDB()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.log("Database connection error:", err));

  app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated(); // Make `isAuthenticated` available globally in EJS
    next();
  });
  

  const isProductOwner = async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product.owner.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to perform this action.');
      return res.redirect(`/show/${id}`);
    }
    next(); 
  };

// Home Route
app.get('/', (req, res) => {
  res.send("<h1>I trust in myself</h1>");
});

// Products Listing Route
app.get('/home', async (req, res) => {
  try {
    // Fetch all products and populate the 'owner' field with the corresponding user's data (only username in this case)
    const products = await Product.find()
      .populate('owner', 'username') // Populates the owner's username
      .exec();

    // Render the home page with the populated products
    res.render('home.ejs', { Products: products }); 
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/show/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const products = await Product.findById(id).populate('owner', 'username'); // Populate the owner field with only the username
    if (products) {
      // Check if the logged-in user is the owner
      const isOwner = req.user && products.owner && products.owner._id.equals(req.user._id);

      // Pass isOwner to the view
      res.render('show.ejs', { products, isOwner });
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Product Delete Route
app.delete('/delete/:id', isProductOwner, async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to delete a product!');
    return res.redirect('/login'); // Redirect to login page if not authenticated
  }

  try {
    const id = req.params.id;
    await Product.findByIdAndDelete(id); // Delete product by ID
    req.flash('error', 'Product deleted successfully.');
    res.redirect('/home'); // Redirect to products listing after deletion
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Failed to delete product");
  }
});


//Create Product
// Create Product
app.get('/create', (req, res) => {
  if (!(req.isAuthenticated())) {
    req.flash('error', 'You must be logged in to add product');
    return res.redirect('/login'); // Redirect to login if not authenticated
  }
  res.render('create.ejs');
});


app.post('/products', async (req, res) => {
  const { name, price, image } = req.body;

  if (!name || !price || !image) {
    // Redirect back to the create page with an error message
    return res.status(400).send("All fields are required!");
  }

  // Get the logged-in user's ID from req.user (if using passport.js)
  const owner = req.user._id;

  try {
    // Create the new product with the owner field set to the logged-in user's ID
    await Product.create({ name, price, image, owner });
    req.flash('success', 'Product created successfully!');
    res.redirect('/home'); // Redirect to home page after successful creation
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Failed to create product"); // Send error message
  }
});



//Edit / Update
app.get('/edit/:id', isProductOwner, async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to edit a product!');
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  try {
    const id = req.params.id;
    const product = await Product.findById(id); // Find product by ID
    if (!product) {
      req.flash('error', 'Product not found!');
      return res.redirect('/home'); // Redirect to home if product not found
    }
    res.render('edit.ejs', { product }); // Render edit page
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.put('/update/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to update a product!');
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  const { id } = req.params;
  const { name, price, image } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(id, { name, price, image }); // Update product
    if (!product) {
      req.flash('error', 'Product not found!');
      return res.redirect('/home'); // Redirect if product not found
    }
    req.flash('success', 'Product updated successfully!');
    res.redirect(`/show/${id}`); // Redirect to product's show page
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
});


//For user

// 1 . Signup route


app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'User already exists. Please try again with a different email or username.');
      return res.render('signup', { 
        messages: { error: req.flash('error') },
        username,
        email
      });
    }

    // Register the new user
    const newUser = new User({ email, username });
    await User.register(newUser, password);

    // Automatically log the user in after signup
    req.login(newUser, (err) => {
      if (err) {
        return next(err); // Pass errors to the next middleware
      }
      req.flash('success', 'Welcome! You are now logged in.');
      return res.redirect('/home'); // Redirect to home or desired page
    });
  } catch (error) {
    req.flash('error', error.message);
    res.render('signup', { 
      messages: { error: req.flash('error') },
      username: req.body.username,
      email: req.body.email
    });
  }
});


// Log in 
// GET login page
app.get("/login", (req, res) => {
  res.render("login");
});

// POST login logic
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Handle general error
      if (req.xhr) return res.json({ success: false, message: "An error occurred." });
      req.flash("error", "An error occurred.");
      return res.redirect("/login");
    }
    if (!user) {
      // Handle invalid credentials
      if (req.xhr) return res.json({ success: false, message: "Invalid username or password." });
      req.flash("error", "Invalid username or password.");
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        // Handle login error
        if (req.xhr) return res.json({ success: false, message: "Failed to log in." });
        req.flash("error", "Failed to log in.");
        return res.redirect("/login");
      }
      // If login is successful and request is AJAX
      if (req.xhr) {
        req.flash("success", "User logged in successfully!"); // Flash for home.ejs
        return res.json({ success: true, message: "User logged in successfully!" });
      }
      // For normal form submission, set flash and redirect to /home
      req.flash("success", "User logged in successfully!");
      return res.redirect("/home");
    });
  })(req, res, next);
});



app.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "User logged out successfully!");
    res.redirect("/home");
  });
});






//Universal Route
app.get('*', (req, res) => {
  res.render("Universal.ejs");
});


// Start Server
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
