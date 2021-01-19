const express = require('express');
const followController = require('../controllers/follow.js');
const api = express.Router();
const md_auth = require('../middlewares/authentication.js');

api.get('/prueba-follow', md_auth.ensureAuth, followController.prueba);
api.post('/follow', md_auth.ensureAuth, followController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, followController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, followController.listFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, followController.listFollowedUsers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, followController.getMyFollows);

module.exports = api;