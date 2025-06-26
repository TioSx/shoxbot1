const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  reason: { type: String, default: 'Não houve um motivo' },
  mutedAt: { type: Date, default: Date.now },
  guildId: { type: String, required: true }
});

const Block = mongoose.model('Block', blockSchema);

module.exports = Block;
