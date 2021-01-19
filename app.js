const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// CORS
app.use(cors(
    config.application.cors.server
));

const config = {
    application: {
        cors: {
            server: [
                {
                    origin: "localhost:3800",
                    credentials: true
                }
            ]
        }
    }
};

//cargar rutas
const user_routes = require('./routes/user.js');
const follow_routes = require('./routes/follow');
const post_routes = require('./routes/post.js');
const message_routes = require('./routes/message.js');

//middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});

// rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', post_routes);
app.use('/api', message_routes);

// exportar
module.exports = app;