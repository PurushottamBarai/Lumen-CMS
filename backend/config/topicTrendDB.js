
const mongoose = require('mongoose');

let topicTrendConnection;

const connectTopicTrendDB = async () => {
  if (topicTrendConnection?.readyState === 1) {
    return topicTrendConnection;
  }

  const mongoURI = process.env.TOPIC_MONGODB_URI;

  if (!mongoURI) {
    throw new Error(
      'TOPIC_MONGODB_URI is missing from backend/.env'
    );
  }

  topicTrendConnection = mongoose.createConnection(mongoURI, {
    dbName: 'lumen_topic_trends',
    family: 4,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 5,
  });

  try {
    await topicTrendConnection.asPromise();

    console.log(
      '[Topic Trends DB] Connected to separate database:',
      topicTrendConnection.name
    );

    return topicTrendConnection;
  } catch (error) {
    topicTrendConnection = null;
    throw error;
  }
};

module.exports = connectTopicTrendDB;
