const Place = require('../models/Place');
const Dish = require('../models/Dish');

// --- Controlador para OBTENER Lugares Populares ---
// (Los más reseñados o mejor calificados)
exports.getPopularPlaces = async (req, res) => {
  try {
    // Buscamos los 10 lugares con mejor rating
    const topPlaces = await Place.find({})
                                 .sort({ rating: -1 }) // Ordena por rating (descendente)
                                 .limit(10) // Trae solo los 10 primeros
                                 .select('name category rating numReviews photos'); // Solo datos útiles

    res.status(200).json(topPlaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para OBTENER Platos Populares ---
// (Los que tienen más "likes")
exports.getPopularDishes = async (req, res) => {
  try {
    // Buscamos los 10 platos con más likes
    const topDishes = await Dish.find({})
                                .sort({ likes: -1 }) // Ordena por likes (descendente)
                                .limit(10)
                                .select('name imageUrl likes');

    res.status(200).json(topDishes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};