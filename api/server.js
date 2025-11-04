const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Importa la conexión a la DB

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar Express
const app = express();

// Middlewares (funciones que se ejecutan en cada petición)
app.use(cors()); // Permite peticiones de otros dominios (tu app móvil)
app.use(express.json()); // Permite a express entender JSON

// --- RUTAS ---
// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API de Hackaton lista!');
});

// (Aquí pondremos nuestras rutas de /api/users, /api/places, etc.)


// --- Iniciar Servidor ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});