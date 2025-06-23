require("dotenv").config();
const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    connect() {
        const mongo_url = 'mongodb+srv://shoxtio:shoxtio3266@cluster0.ffihedm.mongodb.net/db?retryWrites=true&w=majority';
        mongoose.connect(mongo_url).then(() => {
            console.log(`[ 🌿 ] Conectado à database: MongoDB`);
            this.connect = mongoose.connection;
        }).catch(err => { console.log(err) });
    }
}

module.exports = Database;