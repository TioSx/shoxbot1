const mongoose = require('mongoose');

const cargoTempSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('CargoTemp', cargoTempSchema);