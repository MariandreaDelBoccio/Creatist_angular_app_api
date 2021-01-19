// 'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const secret = 'clave_secreta_Creatist';

exports.ensureAuth = function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'la petición no tiene la cabecera de autenticación' });
    }

    const token = req.headers.authorization.replace(/['"]+/g, '');

    const payload = jwt.decode(token, secret);

    try {

        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ message: 'el token ha expirado' });
        }
    } catch (ex) {
        return res.status(404).send({ message: 'el token no es válido' });
    }

    req.user = payload;

    next();
}

