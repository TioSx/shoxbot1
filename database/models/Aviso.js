// database/models/Aviso.js
const mongoose = require('mongoose');

const avisoSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    staffId: { type: String, required: true },
    motivo: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Aviso', avisoSchema);
