const mongoose = require('mongoose');

// Function to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb+srv://shop_ease_user:2005@cluster0.6hhoa.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

// Define the Product schema

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { 
    type: String, 
    default: 'https://plus.unsplash.com/premium_photo-1717972598410-6a47fc079a16?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, // Stores a reference to the User model
    ref: 'User', // Points to the User model
  }
});


// Create the Product model based on the schema
const Product = mongoose.model('Product', productSchema);

// Function to delete old products and insert new ones
async function resetAndCreateProducts() {
  try {
    await Product.deleteMany({}); // Delete all products first
    console.log("Old products deleted");

    // Define the owner ID you want to assign to all products (this should be a valid ObjectId of a user)
    const ownerId = '673644103b83ac02c905adaa'; // Example User ID

    const products = [
      { name: 'Product 1', image: 'https://plus.unsplash.com/premium_photo-1679913792906-13ccc5c84d44?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 100, owner: ownerId },
      { name: 'Product 2', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 200, owner: ownerId },
      { name: 'Product 3', image: 'https://plus.unsplash.com/premium_photo-1676822252274-f81d2d6aab23?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 300, owner: ownerId },
      { name: 'Product 4', image: 'https://plus.unsplash.com/premium_photo-1677526496597-aa0f49053ce2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 400, owner: ownerId },
      { name: 'Product 5', image: 'https://images.unsplash.com/photo-1525904097878-94fb15835963?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 500, owner: ownerId },
      { name: 'Product 6', image: 'https://images.unsplash.com/photo-1542219550-37153d387c27?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 600, owner: ownerId },
      { name: 'Product 7', image: 'https://plus.unsplash.com/premium_photo-1679513691641-9aedddc94f96?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwb2JqZWN0c3xlbnwwfHwwfHx8MA%3D%3D', price: 700, owner: ownerId },
      { name: 'Product 8', image: 'https://plus.unsplash.com/premium_photo-1678037611091-20678098a609?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 800, owner: ownerId },
      { name: 'Product 9', image: 'https://images.unsplash.com/photo-1494253109108-2e30c049369b?q=80&w=2070&auto=format&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 900, owner: ownerId },
      { name: 'Product 10', image: 'https://plus.unsplash.com/premium_photo-1681400285322-048eeaa7f1c1?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', price: 1000, owner: ownerId },
    ];

    // Insert products with the owner field set to the desired owner ID
    await Product.insertMany(products);

    console.log("Products created successfully");
  } catch (error) {
    console.error("Error during product reset and creation:", error);
  }
}

// Export the model, database connection, and reset function
module.exports = { Product, connectDB, resetAndCreateProducts };
