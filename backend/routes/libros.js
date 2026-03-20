const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../config/auth");

// Obtener todos los libros
router.get("/", verificarToken, (req, res) => {
    db.query("SELECT * FROM libros ORDER BY titulo ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Agregar libro (solo admin)
router.post("/", verificarToken, (req, res) => {
    const { titulo, autor } = req.body;

    if (req.usuario.rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede agregar libros" });
    }

    if (!titulo || !autor) {
        return res.status(400).json({ mensaje: "Título y autor son obligatorios" });
    }

    db.query("INSERT INTO libros (titulo, autor) VALUES (?, ?)", [titulo, autor], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Libro agregado correctamente" });
    });
});

// Eliminar libro (solo admin)
router.delete("/:id", verificarToken, (req, res) => {
    if (req.usuario.rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede eliminar libros" });
    }

    db.query("DELETE FROM libros WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Libro no encontrado" });
        res.json({ mensaje: "Libro eliminado correctamente" });
    });
});

module.exports = router;
