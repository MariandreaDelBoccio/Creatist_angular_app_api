const express = require('express');
const messageController = require('../controllers/message.js');
const api = express.Router();
const md_auth = require('../middlewares/authentication.js');

api.get('/prueba-message', messageController.prueba);
api.post('/message', md_auth.ensureAuth, messageController.saveMessage);
api.get('/messages/:page?', md_auth.ensureAuth, messageController.getReceivedMessages);
api.get('/messages-received/:page?', md_auth.ensureAuth, messageController.getEmmitedMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, messageController.getUnviewedMessages);
api.get('/set-viewed-messages', md_auth.ensureAuth, messageController.setViewedMessages);


module.exports = api;