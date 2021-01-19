const moment = require('moment');
const paginate = require('mongoose-pagination');

const Message = require('../models/message.js');

function prueba(req, res) {
    return res.status(200).send({ message: 'hola desde message' });
}

function saveMessage(req, res) {
    const params = req.body;

    if (!params.text || !params.receiver) return res.status(200).send({ message: 'rellena todos los campos' });

    const message = new Message();

    message.emmiter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = false;

    message.save((err, messageStored) => {
        if (err) return res.status(500).send({ message: 'error en la petición' });

        if (!messageStored) return res.status(404).send({ message: 'error al enviar el mensaje' });

        return res.status(200).send({ messageStored });
    })
}

function getReceivedMessages(req, res) {
    const userId = req.user.sub;

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    const itemsxPage = 4;

    Message.find({ receiver: userId }).populate('emmiter', 'name lastName _id userName image').paginate(page, itemsxPage, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'error en la petición' });

        if (!messages) return res.status(404).send({ message: 'no hay mensajes' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsxPage),
            messages
        })

    });
}

function getEmmitedMessages(req, res) {
    const userId = req.user.sub;

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    const itemsxPage = 4;

    Message.find({ emmiter: userId }).populate('emmiter receiver', 'name lastName _id userName image').paginate(page, itemsxPage, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'error en la petición' });

        if (!messages) return res.status(404).send({ message: 'no hay mensajes' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsxPage),
            messages
        })

    });
}

function getUnviewedMessages(req, res) {
    const userId = req.user.sub;

    Message.estimatedDocumentCount({ receiver: userId, viewed: false }).exec((err, count) => {
        if (err) return res.status(500).send({ message: 'error en la petición' });

        return res.status(200).send({
            "unviewed": count
        });
    })

}

function setViewedMessages(req, res) {
    const userId = req.user.sub;

    Message.update({ receiver: userId, viewed: false }, { viewed: true }, { "multi": true }, (err, updatedMessage) => {
        if (err) return res.status(500).send({ message: 'error en la petición' });

        return res.status(200).send({ messages: updatedMessage })
    })
}

module.exports = {
    prueba,
    saveMessage,
    getReceivedMessages,
    getEmmitedMessages,
    getUnviewedMessages,
    setViewedMessages
}