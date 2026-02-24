const jwt = require("jsonwebtoken");

const SECRET_KEY = "biblioteca_turnos_secret_2025";

const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ mensaje: "Token no proporcionado" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensaje: "Token inválido o expirado" });
        }

        req.usuario = decoded;
        next();
    });
};

module.exports = { verificarToken, SECRET_KEY };
