const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema({
  name: { // Ej: "Arroz con Pato"
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: { // URL de la foto del plato
    type: String,
    required: false,
  },
  tags: { // Ej: ["pato", "criollo", "norteño"]
    type: [String],
    default: [],
  },
  // Aquí vinculamos los platos a los lugares (muchos a muchos)
  recommendedPlaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place', // Referencia al modelo 'Place'
  }],
  likes: { // Para el feed de popularidad
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', DishSchema);