const mongoose = require('mongoose');
const app = require('./app.js');
const port = process.env.port || 3800;

mongoose.set('useFindAndModify', false);

// conexión a la base de datos

mongoose.connect('mongodb://localhost:27017/Creatist', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('La conexión a la base de datos de Creatist se ha realizado correctamente');
        // crear servidor
        app.listen(port, () => {
            console.log('servidor corriendo en http://localhost:3800');
        })
    })
    .catch(err => console.log(err));

