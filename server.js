const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env if present
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Delegates server entry to backend/server.js for root deployment compatibility
require('./backend/server.js');
