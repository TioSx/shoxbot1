const { Schema, model } = require('mongoose');

const AnuncioSchema = new Schema({
  autor_id: String,
  tipo: String,
  titulo: String,
  mensagem: String,
  data: { type: Date, default: Date.now },
  canal_id: String,
  embed: Object,
  botoes: Array
});

module.exports = model('Anuncio', AnuncioSchema);
