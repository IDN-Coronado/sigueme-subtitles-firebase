/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require('firebase-functions/v2/https');
// const logger = require('firebase-functions/logger');
const {createServer} = require('@lhci/server');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


console.log('Starting server...');
const app = createServer({
  port: process.env.PORT,
  storage: {
    storageMethod: 'sql',
    sqlDialect: 'sqlite',
    sqlDatabasePath: 'https://siguemesubtitles-default-rtdb.firebaseio.com/',
  },
}).then(({port}) => console.log('LHCI listening on port', port));

exports.app = onRequest(app);

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
