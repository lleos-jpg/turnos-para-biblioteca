const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/auth");

// Crear usuario
router.post("/", (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: "Error encriptando contraseña" });
        }

        const sql = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";

        db.query(sql, [nombre, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({ mensaje: "Usuario creado correctamente" });
        });
    });
});

// Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ mensaje: "Email y password son obligatorios" });
    }

    const sql = "SELECT * FROM usuarios WHERE email = ?";

    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ mensaje: "Credenciales incorrectas" });
        }

        const usuario = results[0];

        bcrypt.compare(password, usuario.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: "Error comparando contraseña" });
            }

            if (!isMatch) {
                return res.status(401).json({ mensaje: "Credenciales incorrectas" });
            }

            // Generar token JWT
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email, rol: usuario.rol },
                SECRET_KEY,
                { expiresIn: "24h" }
            );

            res.json({
                mensaje: "Login exitoso",
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                }
            });
        });
    });
});

module.exports = router;
