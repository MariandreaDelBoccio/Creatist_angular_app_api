const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');

const Post = require('../models/post.js');
const User = require('../models/user.js');
const Follow = require('../models/follow.js');

function prueba(req, res) {
    res.status(200).send({ message: 'hola desde post' })
}

function savePost(req, res) {

    // console.log(req);

    const params = req.body;
    // console.log(params);

    if (!req.body.file) return res.status(200).send({ message: 'debes subir una imagen' });

    const post = new Post();

    post.file = req.body.file.replace('C:\\fakepath\\', '');
    post.text = params.text;
    post.user = req.user.sub;
    post.created_at = moment().unix();

    post.save((err, postStored) => {
        if (err) return res.status(500).send({ message: 'error al guardar el post' });

        if (!postStored) return res.status(404).send({ message: 'el post no ha sido guardado' });

        return res.status(200).send({ post: postStored });
    })

}

function getPosts(req, res) {
    // console.log(req);

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    let itemsxPage = 100;

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'error al listar los followers' });

        const follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        follows_clean.push(req.user.sub);

        Post.find({ user: { '$in': follows_clean } }).sort('-created_at').populate('user').paginate(page, itemsxPage, (err, posts, total) => {
            if (err) return res.status(500).send({ message: 'error al listar los posts' });

            if (!posts) return res.status(404).send({ message: 'no hay posts' });

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsxPage),
                page: page,
                itemsx_Page: itemsxPage,
                posts
            })
        });
    })
}

function getPostsUser(req, res) {
    // console.log(req);

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    let user = req.user.sub;
    if (req.params.user) {
        user_id = req.params.user
    }

    let itemsxPage = 100;

    Post.find({ user: user }).sort('-created_at').populate('user').paginate(page, itemsxPage, (err, posts, total) => {
        if (err) return res.status(500).send({ message: 'error al listar los posts' });

        if (!posts) return res.status(404).send({ message: 'no hay posts' });

        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsxPage),
            page: page,
            itemsx_Page: itemsxPage,
            posts
        })
    });
}

function getPost(req, res) {
    const postId = req.params.id;

    Post.findById(postId, (err, post) => {
        if (err) return res.status(500).send({ message: 'error al listar los posts' });

        if (!post) return res.status(404).send({ message: 'no hay posts' });

        return res.status(200).send({ post });
    })
}

function deletePost(req, res) {
    const postId = req.params.id;

    Post.find({ 'user': req.user.sub, '_id': postId }).remove(err => {
        if (err) return res.status(500).send({ message: 'error al borrar los posts' });

        // if (!postRemoved) return res.status(404).send({ message: 'no se ha borrado el post' });

        return res.status(200).send({ message: 'post eliminado' })
    })
}

function uploadImage(req, res) {
    const userId = req.params.id;

    if (req.file) {
        const filename = req.file.originalname;

        const ext = path.parse(filename).ext.toLowerCase();

        if (userId != req.user.sub) {
            return RemoveFilesOfUploads(res, filename, 'no tienes permiso para actualizar la imagen')
        }

        if (ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') {
            User.findByIdAndUpdate(userId, { image: filename }, { new: true }, (err, userUpdated) => {

                if (err) return res.status(500).send({ message: 'error en la petición' })
                if (!userUpdated) res.status(404).send({ message: 'no se ha podido actualizar la imagen' })

                res.status(200).send({ user: userUpdated })
            })

        } else {
            return RemoveFilesOfUploads(res, filename, 'extensión del archivo no válida')
        }

    } else {
        res.status(404).send({ message: 'no has subido ninguna imagen' })
    }
}

function RemoveFilesOfUploads(res, path, message) {
    fs.unlink(path, (err) => {
        return res.status(200).send({ message: message })
    })
}

function getImageFile(req, res) {

    const image_file = req.params.imageFile;

    let path_file = './uploads/users/' + image_file;
    try {
        if (fs.existsSync(path_file)) {
            res.sendFile(image_file, { root: './uploads/users/' });
        }
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    prueba,
    savePost,
    getPosts,
    getPost,
    deletePost,
    uploadImage,
    getImageFile,
    getPostsUser
}