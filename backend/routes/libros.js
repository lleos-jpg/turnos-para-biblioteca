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
    const { titulo, autor, stock_total } = req.body;

    if (req.usuario.rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede agregar libros" });
    }

    if (!titulo || !autor) {
        return res.status(400).json({ mensaje: "Título y autor son obligatorios" });
    }

    const stock = parseInt(stock_total) || 1;

    db.query(
        "INSERT INTO libros (titulo, autor, stock_total, stock_disponible) VALUES (?, ?, ?, ?)",
        [titulo, autor, stock, stock],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ mensaje: "Libro agregado correctamente" });
        }
    );
});

// Actualizar stock (solo admin)
router.put("/:id/stock", verificarToken, (req, res) => {
    if (req.usuario.rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede modificar el stock" });
    }
    const { stock_total } = req.body;
    const stock = parseInt(stock_total);
    if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ mensaje: "Stock inválido" });
    }
    // Ajustar stock_disponible proporcionalmente
    db.query("SELECT stock_total, stock_disponible FROM libros WHERE id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ mensaje: "Libro no encontrado" });
        const prestados = rows[0].stock_total - rows[0].stock_disponible;
        const nuevo_disponible = Math.max(0, stock - prestados);
        db.query(
            "UPDATE libros SET stock_total = ?, stock_disponible = ? WHERE id = ?",
            [stock, nuevo_disponible, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ mensaje: "Stock actualizado" });
            }
        );
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
