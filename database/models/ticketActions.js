const mongoose = require('mongoose');
const path = require('path');
const modelName = path.basename(__filename, '.js');

const Schema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    server: String,
    department: String,
    channel_id: String,
    transcriptUrl: String,
    staff: {
        type: [String],
        default: []
    },
    members: [{ type: String }],
    opened: {          
        type: Boolean,
        default: true
    },
    locked: {          
        type: Boolean,
        default: false
    },
    createdAt: String,
    closedBy: {        // NOVO CAMPO
        type: String,
        default: null
    },
    closedAt: {        // NOVO CAMPO - AQUI NÃO PODE TER VÍRGULA DEPOIS!
        type: Date,
        default: null
    }
});

Schema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        this.id = count + 1;
    }
    next();
});

module.exports = mongoose.model(modelName, Schema);
