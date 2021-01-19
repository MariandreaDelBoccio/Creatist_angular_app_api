// 'use strict'

// const path = require('path');
// const fs = require('fs');
const mongoosePaginate = require('mongoose-pagination');

const User = require('../models/user.js');
const Follow = require('../models/follow.js');

function prueba(req, res) {
    res.status(200).send({ message: 'Hola, mundo desde follow.js' });
}

function saveFollow(req, res) {
    const params = req.body;

    const follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if (err) return res.status(500).send({ message: 'error al guardar followed' });

        if (!followStored) return res.status(404).send({ message: 'el seguimiento no se ha guardado' });

        return res.status(200).send({ follow: followStored })
    })

}

function deleteFollow(req, res) {
    const userId = req.user.sub;
    const followId = req.params.id;

    Follow.find({ 'user': userId, 'followed': followId }).remove(err => {
        if (err) return res.status(500).send({ message: 'error al dejar de seguir' });

        return res.status(200).send({ message: 'el follow se ha eliminado' });
    })
}

function listFollowingUsers(req, res) {
    let userId = req.user.sub;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    const itemsxPage = 2;

    Follow.find({ user: userId }).populate({ path: 'followed' }).paginate(page, itemsxPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'no sigue a ningún usuario' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsxPage),
            follows
        })
    })

}

function listFollowedUsers(req, res) {
    let userId = req.user.sub;

    if (req.user.sub != req.params.id) {
        return res.status(500).send({ message: 'el usuario debe estar loggeado' });
    }

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    const itemsxPage = 2;

    Follow.find({ followed: userId }).populate('user').paginate(page, itemsxPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'no te sigue ningún usuario' });

        followUserIds(req.user.sub).then((value) => {
            console.log(value);
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total / itemsxPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed
            })
        })
    })
}

async function followUserIds(user_id) {

    var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
        .then((follows) => {
            console.log(follows);

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

// listar los usuarios
function getMyFollows(req, res) {
    const userId = req.user.sub;
    const followed = req.params.followed;

    let find = Follow.find({ user: userId });

    if (followed) {
        find = Follow.find({ followed: userId })
    }

    find.populate('user followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'no sigues a ningún usuario' });

        return res.status(200).send({ follows });
    })

}

module.exports = {
    prueba,
    saveFollow,
    deleteFollow,
    listFollowingUsers,
    listFollowedUsers,
    getMyFollows
}