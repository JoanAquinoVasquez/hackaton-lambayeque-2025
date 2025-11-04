const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Inicializa el cliente de Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Función para generar nuestro token local (puedes copiarla de userController)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.googleLogin = async (req, res) => {
  try {
    // 1. Recibir el idToken de Google desde el frontend
    const { idToken } = req.body;

    // 2. Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // Info del usuario de Google
    const { email, name, picture } = payload;

    // 3. Buscar al usuario en NUESTRA base de datos
    let user = await User.findOne({ email });

    // 4. Si el usuario NO existe, lo registramos
    if (!user) {
      user = new User({
        username: name, // Usamos el nombre de Google como username
        email: email,
        // No hay contraseña, ya que es login social
        isTourist: true, // Puedes poner un valor por defecto
        tastes: [],
      });
      await user.save();
    }

    // 5. Si el usuario SÍ existe (o lo acabamos de crear), generamos NUESTRO token
    const token = generateToken(user._id);

    // 6. Devolvemos la info del usuario y NUESTRO token al frontend
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      points: user.points,
      token: token,
    });
  } catch (error) {
    console.error('Error en Google Login:', error);
    res.status(401).json({ message: 'Login de Google fallido. Token inválido.' });
  }
};