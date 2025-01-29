const { connectDB, resetAndCreateProducts } = require('./mongo');

async function initializeDatabase() {
  await connectDB();  // Establish the connection to the database
  await resetAndCreateProducts();  // Reset and insert new products
  process.exit();  // Exit the process once done
}

initializeDatabase();
