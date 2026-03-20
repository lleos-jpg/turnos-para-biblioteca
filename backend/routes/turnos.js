const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../config/auth");


// ===============================
// 🔹 Obtener turnos de un usuario específico
// (VA PRIMERO para evitar conflicto con /:id)
// ===============================
router.get("/mis-turnos/:usuario_id", verificarToken, (req, res) => {
    const { usuario_id } = req.params;

    const hoy = new Date().toISOString().split("T")[0];
    const deleteSql = "DELETE FROM turnos WHERE estado = 'reservado' AND fecha < ? AND usuario_id = ?";
    
    db.query(deleteSql, [hoy, usuario_id], (err) => {
        if (err) console.error("Error eliminando turnos pasados:", err);

        const sql = `
            SELECT t.*, l.titulo as libro_titulo, l.autor as libro_autor 
            FROM turnos t 
            LEFT JOIN libros l ON t.libro_id = l.id 
            WHERE t.usuario_id = ?
        `;

        db.query(sql, [usuario_id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});


// ===============================
// 🔹 Obtener todos los turnos
// ===============================
router.get("/", verificarToken, (req, res) => {
    const hoy = new Date().toISOString().split("T")[0];
    const deleteSql = "DELETE FROM turnos WHERE estado = 'reservado' AND fecha < ?";
    
    db.query(deleteSql, [hoy], (err) => {
        if (err) console.error("Error eliminando turnos pasados:", err);

        const sql = `
            SELECT t.*, l.titulo as libro_titulo, l.autor as libro_autor 
            FROM turnos t 
            LEFT JOIN libros l ON t.libro_id = l.id
        `;

        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});


// ===============================
// 🔹 Crear turno
// ===============================
router.post("/", verificarToken, (req, res) => {
    const { usuario_id, fecha, hora, libro_id } = req.body;

    if (!usuario_id || !fecha || !hora || !libro_id) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const checkSql = "SELECT * FROM turnos WHERE fecha = ? AND hora = ?";
    
    db.query(checkSql, [fecha, hora], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            return res.status(400).json({ mensaje: "Ya existe un turno en esa fecha y hora" });
        }

        const sql = "INSERT INTO turnos (usuario_id, fecha, hora, estado, libro_id) VALUES (?, ?, ?, 'pendiente', ?)";

        db.query(sql, [usuario_id, fecha, hora, libro_id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ mensaje: "Turno creado correctamente" });
        });
    });
});


// ===============================
// 🔹 Modificar turno (fecha, hora o estado)
// ===============================
router.put("/:id", verificarToken, (req, res) => {
    const { id } = req.params;
    const { fecha, hora, estado, usuario_rol } = req.body;

    // Solo admin puede cambiar el estado
    if (estado !== undefined && usuario_rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede modificar el estado" });
    }

    let updates = [];
    let values = [];

    if (fecha !== undefined) {
        updates.push("fecha = ?");
        values.push(fecha);
    }
    if (hora !== undefined) {
        updates.push("hora = ?");
        values.push(hora);
    }
    if (estado !== undefined) {
        updates.push("estado = ?");
        values.push(estado);
    }

    if (updates.length === 0) {
        return res.status(400).json({ mensaje: "No hay campos para actualizar" });
    }

    values.push(id);
    const sql = `UPDATE turnos SET ${updates.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Turno no encontrado" });
        }

        res.json({ mensaje: "Turno actualizado correctamente" });
    });
});


// ===============================
// 🔹 Eliminar turno
// ===============================
router.delete("/:id", verificarToken, (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM turnos WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Turno no encontrado" });
        }

        res.json({ mensaje: "Turno eliminado correctamente" });
    });
});


module.exports = router;
