const Reward = require('../models/Reward');
const User = require('../models/User'); // Necesitamos al Usuario

// --- Controlador para CREAR una recompensa (para admin) ---
exports.createReward = async (req, res) => {
  try {
    const { name, description, pointsCost, partnerId, stock } = req.body;
    
    // (Aquí faltaría verificar que 'partnerId' sea válido, pero por ahora lo omitimos)
    
    const reward = new Reward({
      name,
      description,
      pointsCost,
      partner: partnerId,
      stock
    });

    const savedReward = await reward.save();
    res.status(201).json(savedReward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para OBTENER recompensas (filtradas por aliado) ---
exports.getRewards = async (req, res) => {
  try {
    let filter = {};
    if (req.query.partnerId) {
      filter.partner = req.query.partnerId;
    }

    const rewards = await Reward.find(filter).populate('partner', 'name category');
    res.status(200).json(rewards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- Controlador para CANJEAR una recompensa (¡PROTEGIDO!) ---
exports.redeemReward = async (req, res) => {
  try {
    const rewardId = req.params.id;
    const userId = req.user._id; // Viene del middleware 'protect'

    // 1. Buscar la recompensa y el usuario
    const reward = await Reward.findById(rewardId);
    const user = await User.findById(userId);

    if (!reward) {
      return res.status(404).json({ message: 'Recompensa no encontrada' });
    }

    // 2. Verificar si el usuario tiene suficientes puntos
    if (user.points < reward.pointsCost) {
      return res.status(400).json({ message: 'Puntos insuficientes' });
    }
    
    // 3. Verificar si hay stock (opcional, pero buena práctica)
    if (reward.stock <= 0) {
      return res.status(400).json({ message: 'Recompensa agotada' });
    }

    // 4. ¡Hacer el canje!
    user.points -= reward.pointsCost; // Restar puntos
    reward.stock -= 1; // Reducir stock

    await user.save();
    await reward.save();

    res.status(200).json({
      message: 'Recompensa canjeada con éxito',
      newPoints: user.points,
      confirmationCode: `C-${Date.now()}-${user._id.toString().slice(-4)}` // Código de canje
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};