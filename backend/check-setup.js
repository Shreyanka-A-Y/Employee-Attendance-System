// Quick setup check script
require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== Backend Setup Check ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   PORT:', process.env.PORT || '5000 (default)');
console.log('   MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-attendance (default)');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not set (will use default)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('');

// Test MongoDB connection
console.log('2. Testing MongoDB Connection...');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-attendance';
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('   ✓ MongoDB connection successful');
    mongoose.connection.close();
    console.log('\n✅ All checks passed! Backend should work correctly.');
    process.exit(0);
  })
  .catch((error) => {
    console.log('   ✗ MongoDB connection failed');
    console.log('   Error:', error.message);
    console.log('\n❌ Setup issue detected!');
    console.log('\nSolutions:');
    console.log('1. Make sure MongoDB is running');
    console.log('   - Windows: Check Services for MongoDB');
    console.log('   - Mac/Linux: Run "sudo systemctl start mongod"');
    console.log('2. Or use MongoDB Atlas and update MONGODB_URI in .env file');
    process.exit(1);
  });

