const express = require('express');
const UserController = require('../controllers/user.js');
const fs = require('fs');
const path = require('path');

const api = express.Router();
const md_auth = require('../middlewares/authentication.js');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/users');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const mul_upload = multer({ storage });

api.get('/home', UserController.home);
api.get('/prueba', md_auth.ensureAuth, UserController.prueba);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, mul_upload.single('image')], UserController.uploadImage);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.get('/get-image-user/:imageFile', UserController.getImageFile);

module.exports = api;