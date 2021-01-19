// 'use strict'

const bcrypt = require('bcrypt-nodejs');
const mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

const User = require('../models/user.js');
const Follow = require('../models/follow.js');
const Post = require('../models/post.js');
const jwt = require('../services/jwt.js');

// rutas

// métodos de prueba
function home(req, res) {
    res.status(200).send({
        message: 'Hola mundo'
    })
}

function prueba(req, res) {
    res.status(200).send({
        message: 'prueba del servidor'
    })
}

// registro
function saveUser(req, res) {
    const params = req.body;
    const user = new User();

    if (params.name && params.lastName && params.userName && params.email && params.password) {
        user.name = params.name;
        user.lastName = params.lastName;
        user.userName = params.userName;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        user.password = params.password;

        // controlar usuario duplicados
        User.findOne({
            $or: [
                { email: user.email.toLowerCase() },
                { userName: user.userName.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ message: 'error en la petición del usuario' });

            if (users && users.length >= 1) {
                return res.status(200).send({ message: 'el usuario ya existe' })
            } else {
                // cifrado de la contraseña
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    // guardar los datos
                    user.save((err, userStored) => {
                        if (err) return res.status(500).send({ message: 'error al guardar el usuario' })

                        if (userStored) {
                            res.status(200).send({ user: userStored });
                        } else {
                            res.status(404).send({ message: 'no se ha registrado el usuario' })
                        }
                    })
                })
            }
        })
    } else {
        res.status(200).send({
            message: 'Debes llenar todos los campos requeridos'
        })
    }
}

// login
function loginUser(req, res) {
    const params = req.body;

    const email = params.email;
    const password = params.password;

    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    // devolver datos de usuario

                    if (params.gettoken) {
                        // generar y devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    } else {
                        user.password = undefined;
                        return res.status(200).send({ user })
                    }


                } else {
                    return res.status(404).send({ message: 'el usuario no se ha podido identificar' });
                }
            })
        } else {
            return res.status(404).send({ message: 'usuario no identificado' })
        }
    })
}

// datos de un usuario
const getUser = (req, res) => {
    let userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!user) return res.status(404).send({ message: 'El usuario no existe' })

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;

            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        })
    });
}

async function followThisUser(identity_user_id, user_id) {
    var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec().then((follow) => {
        return follow;
    }).catch((err) => {
        return handleError(err);
    });

    var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id }).exec().then((follow) => {

        return follow;
    }).catch((err) => {
        return handleError(err);
    });


    return {
        following: following,
        followed: followed
    }
}

// listar todos los usuarios
function getUsers(req, res) {
    var user_id = req.user.sub;

    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: "Error en la peticion", err });
        if (!users) return res.status(404).send({ message: "No hay Usuarios" });

        followUserIds(user_id).then((response) => {
            return res.status(200).send({ message: "Resultados", users, users_following: response.following, users_followed: response.followed, total, pages: Math.ceil(total / itemsPerPage) });
        });
    });
}

async function followUserIds(user_id) {

    var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            return handleError(err);
        });
    var followed = await Follow.find({ followed: user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            return handleError(err);
        });

    var following_clean = [];

    following.forEach((follow) => {
        following_clean.push(follow.followed);
    });
    var followed_clean = [];

    followed.forEach((follow) => {
        followed_clean.push(follow.user);
    });
    //console.log(following_clean);
    return { following: following_clean, followed: followed_clean }

}

const getCounters = (req, res) => {
    let userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    })
}

const getCountFollow = async (user_id) => {
    try {
        // Lo hice de dos formas. "following" con callback de countDocuments y "followed" con una promesa
        const following = await Follow.countDocuments({ "user": user_id }).then(count => countDocuments);
        const followed = await Follow.countDocuments({ "followed": user_id }).then(count => countDocuments);
        const posts = await Post.countDocuments({ "user": user_id }).then(count => countDocuments);

        return { following, followed, posts: posts }

    } catch (e) {
        console.log(e);
    }
}

// editar un usuario
function updateUser(req, res) {

    const userId = req.params.id;
    const update = req.body;

    // eliminar password para que se actualice de otra forma
    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'no tienes permiso para actualizar el usuario' })
    }

    User.find({
        $or: [
            { email: update.email.toLowerCase() },
            { userName: update.userName.toLowerCase() }
        ]
    }).exec((err, users) => {

        let user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId) user_isset = true;
        });

        if (user_isset) return res.status(404).send({ message: 'Los datos ya existen. Elige otros.' })

        User.findByIdAndUpdate(userId, update, { new: true }, (err, updatedUser) => {
            if (err) return res.status(500).send({ message: 'error en la petición' });

            if (!updateUser) return res.status(404).send({ message: 'no se ha podido actualizar el usuario' });

            return res.status(200).send({ user: updatedUser });
        })
    })

}

// subir avatar
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
    home,
    prueba,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}