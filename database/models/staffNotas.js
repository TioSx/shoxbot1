const mongoose = require('mongoose');
const path = require('path');
const modelName = path.basename(__filename, '.js'); 

const Schema = new mongoose.Schema({
    GuildID: String,
    StaffID: String,
    Nota: [{
        Who: String,
        When: Date,
        From: String,
        Channel: String,
        Nota: Number,
        Comentario: String,
        Servidor: Number,
    }],
});

module.exports = mongoose.model(modelName, Schema);