const mongoose = require("mongoose");

const db = mongoose.connect(process.env.DB, {
 
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
// Add connection event listeners
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
// Export the connection
module.exports = mongoose.connection;
