const Dish = require('../models/Dish');
const Place = require('../models/Place'); // Para vincular lugares

// --- Controlador para CREAR un plato (para admin) ---
exports.createDish = async (req, res) => {
  try {
    const { name, description, imageUrl, tags, recommendedPlaces } = req.body;
    
    // (Opcional: verificar que los IDs de recommendedPlaces existan)
    
    const dish = new Dish({
      name,
      description,
      imageUrl,
      tags,
      recommendedPlaces // Array de IDs de lugares
    });

    const savedDish = await dish.save();
    res.status(201).json(savedDish);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para OBTENER todos los platos ---
exports.getDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({});
    res.status(200).json(dishes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para OBTENER UN PLATO por ID (con lugares) ---
exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
                           .populate('recommendedPlaces', 'name address rating'); // ¡Populamos!

    if (dish) {
      res.json(dish);
    } else {
      res.status(404).json({ message: 'Plato no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para DAR LIKE a un plato (¡PROTEGIDO!) ---
exports.likeDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ message: 'Plato no encontrado' });
    }

    // Aquí faltaría lógica para evitar doble like, pero para la hackathon
    // un simple incremento funciona.
    dish.likes += 1;
    await dish.save();

    res.status(200).json({ message: 'Like añadido', likes: dish.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};