const express = require('express');
const PostController = require('../controllers/post.js');
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

api.get('/prueba-post', md_auth.ensureAuth, PostController.prueba);
api.post('/post', [md_auth.ensureAuth, mul_upload.single('image')], PostController.savePost);
api.get('/posts/:page?', md_auth.ensureAuth, PostController.getPosts);
api.get('/posts-user/:user/:page?', md_auth.ensureAuth, PostController.getPostsUser);
api.get('/post/:id', md_auth.ensureAuth, PostController.getPost);
api.delete('/post/:id', md_auth.ensureAuth, PostController.deletePost);
api.post('/upload-image-post/:id', [md_auth.ensureAuth, mul_upload.single('image')], PostController.uploadImage);
api.get('/get-image-post/:imageFile', PostController.getImageFile);

module.exports = api;