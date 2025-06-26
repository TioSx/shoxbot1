const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: String, // ID do Discord do staff
  cargos: [String], // IDs dos cargos do staff (use para checar o servidor que ele trabalha)
  tickets: {
    s1: { type: Number, default: 0 },
    s2: { type: Number, default: 0 },
    s3: { type: Number, default: 0 },
    s4: { type: Number, default: 0 }
  },
  avaliacoes: {
    s1: [Number],
    s2: [Number],
    s3: [Number],
    s4: [Number]
  }
});

module.exports = mongoose.model('Staff', staffSchema);
