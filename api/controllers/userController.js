const User = require("../models/User"); // Importa el modelo
const jwt = require("jsonwebtoken"); // Importa jsonwebtoken
const Place = require("../models/Place"); // <-- ¡AÑADE ESTA LÍNEA!

// Función para generar un Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // El token expira en 30 días
  });
};

// --- Controlador de Registro ---
exports.registerUser = async (req, res) => {
  try {
    // 1. Obtener datos del body
    const {
      username,
      email,
      password,
      isTourist,
      reasonForVisit,
      tastes,
      stayEndDate,
    } = req.body;

    // 2. Verificar si el usuario (email) ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // 3. Crear el nuevo usuario
    const user = new User({
      username,
      email,
      password, // La contraseña se encriptará automáticamente gracias al .pre('save')
      isTourist,
      reasonForVisit,
      tastes,
      stayEndDate: isTourist && stayEndDate ? new Date(stayEndDate) : null,
    });

    // 4. Guardar el usuario en la DB
    const savedUser = await user.save();

    // 5. Crear y devolver un token (para que inicie sesión automáticamente)
    if (savedUser) {
      res.status(201).json({
        message: "Usuario registrado con éxito",
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        token: generateToken(savedUser._id),
      });
    } else {
      res.status(400).json({ message: "Datos de usuario inválidos" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// --- Controlador de Login ---
exports.loginUser = async (req, res) => {
  try {
    // 1. Obtener email y password del body
    const { email, password } = req.body;

    // 2. Buscar al usuario por email
    const user = await User.findOne({ email });

    // 3. Verificar si el usuario existe Y si la contraseña coincide
    //    Usamos la función que creamos en el modelo: .matchPassword()
    if (user && (await user.matchPassword(password))) {
      // 4. Si todo coincide, generar un token y devolverlo
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        token: generateToken(user._id),
        isTourist: user.isTourist,
        stayEndDate: user.stayEndDate,
      });
    } else {
      // Damos un mensaje genérico por seguridad
      res.status(401).json({ message: "Correo o contraseña inválidos" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // 1. El middleware 'protect' ya nos dio req.user
    const user = req.user;

    // 2. Buscar los lugares que el usuario ha reseñado (visitado)
    // Buscamos en la colección 'Place' por reseñas que coincidan con el ID de usuario
    const visitedPlaces = await Place.find({ "reviews.user": user._id }).select(
      "name category photos"
    ); // Traemos datos útiles

    // 3. Devolver el perfil combinado
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      points: user.points,
      tastes: user.tastes,
      visitedPlaces: visitedPlaces, // Array de lugares recorridos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
