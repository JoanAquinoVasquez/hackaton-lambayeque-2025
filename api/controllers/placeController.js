const Place = require('../models/Place'); // Importa el modelo
const User = require('../models/User'); // Importa el modelo de Usuario

// --- Controlador para CREAR un nuevo lugar (para pruebas/admin) ---
exports.createPlace = async (req, res) => {
    try {
        // Obtenemos los datos del body
        const { name, description, category, address, longitude, latitude, tags, photos, rating, numReviews } = req.body;

        // Creamos el objeto GeoJSON para la ubicación
        const location = {
            type: 'Point',
            coordinates: [longitude, latitude] // ¡Importante! [Longitud, Latitud]
        };

        const place = new Place({
            name,
            description,
            category,
            address,
            location,
            tags,
            photos,
            rating,
            numReviews
        });

        const savedPlace = await place.save();
        res.status(201).json(savedPlace);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al crear lugar' });
    }
};

// --- Controlador para OBTENER lugares (¡Con filtros geoespaciales!) ---
exports.getPlaces = async (req, res) => {
    try {
        // --- FILTROS (Query Params) ---
        const { category, tag, lat, lng, radius } = req.query;

        let filter = {}; // Objeto de filtro para MongoDB

        if (category) {
            filter.category = category;
        }

        if (tag) {
            filter.tags = { $in: [tag] }; // Busca si el tag está en el array de tags
        }

        // --- FILTRO GEOESPACIAL (¡La Magia de MongoDB!) ---
        if (lat && lng && radius) {
            // radius está en KM, lo convertimos a metros
            const radiusInMeters = parseFloat(radius) * 1000;
            const longitude = parseFloat(lng);
            const latitude = parseFloat(lat);

            filter.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude] // [Longitud, Latitud]
                    },
                    $maxDistance: radiusInMeters // Distancia máxima en metros
                }
            };
        }

        // Buscamos en la base de datos con los filtros
        const places = await Place.find(filter);

        res.status(200).json(places);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al obtener lugares' });
    }
};


// --- Controlador para OBTENER UN SOLO LUGAR por ID ---
exports.getPlaceById = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (place) {
            res.json(place);
        } else {
            res.status(404).json({ message: 'Lugar no encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};


// --- Controlador para CREAR UNA RESEÑA (y ganar puntos) ---
// Esta ruta estará PROTEGIDA por el middleware
exports.createPlaceReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const placeId = req.params.id;

        // 1. Buscar el lugar
        const place = await Place.findById(placeId);
        if (!place) {
            return res.status(404).json({ message: 'Lugar no encontrado' });
        }

        // 2. Verificar que el usuario no haya hecho una reseña antes
        //    (req.user viene del middleware 'protect')
        const alreadyReviewed = place.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Ya has hecho una reseña de este lugar' });
        }

        // 3. Crear la nueva reseña
        const review = {
            name: req.user.username,
            rating: Number(rating),
            comment: comment || '', // Si no hay comentario, string vacío
            user: req.user._id,
        };

        // 4. Añadir la reseña al lugar
        place.reviews.push(review);
        place.numReviews = place.reviews.length;

        // 5. Calcular el nuevo rating promedio
        place.rating =
            place.reviews.reduce((acc, item) => item.rating + acc, 0) /
            place.reviews.length;

        await place.save();

        // 6. ¡¡DAR PUNTOS AL USUARIO!!
        const user = await User.findById(req.user._id);
        user.points = (user.points || 0) + 10; // Gana 10 puntos por reseña
        await user.save();

        res.status(201).json({
            message: 'Reseña añadida con éxito',
            newPoints: user.points
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};