const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../config/auth");


// ===============================
// 🔹 Obtener turnos de un usuario específico
// ===============================
router.get("/mis-turnos/:usuario_id", verificarToken, (req, res) => {
    const { usuario_id } = req.params;
    const hoy = new Date().toISOString().split("T")[0];

    // Obtener turnos vencidos antes de eliminarlos para restaurar stock
    const getVencidosSql = `SELECT libro_id FROM turnos WHERE estado = 'reservado' AND fecha < ? AND usuario_id = ? AND libro_id IS NOT NULL`;
    db.query(getVencidosSql, [hoy, usuario_id], (err, vencidos) => {
        if (err) console.error(err);
        if (vencidos && vencidos.length > 0) {
            const ids = vencidos.map(v => v.libro_id);
            ids.forEach(lid => {
                db.query("UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id = ? AND stock_disponible < stock_total", [lid]);
            });
        }
        db.query("DELETE FROM turnos WHERE estado = 'reservado' AND fecha < ? AND usuario_id = ?", [hoy, usuario_id], (err) => {
            if (err) console.error(err);
            const sql = `SELECT t.*, l.titulo as libro_titulo, l.autor as libro_autor, l.codigo as libro_codigo
                FROM turnos t LEFT JOIN libros l ON t.libro_id = l.id WHERE t.usuario_id = ?`;
            db.query(sql, [usuario_id], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
        });
    });
});


// ===============================
// 🔹 Ejemplares prestados (admin)
// ===============================
router.get("/prestados", verificarToken, (req, res) => {
    if (req.usuario.rol !== "admin") return res.status(403).json({ mensaje: "Solo admin" });
    const sql = `
        SELECT t.id, t.fecha, t.hora, t.estado,
               u.nombre as usuario_nombre, u.email as usuario_email,
               l.titulo as libro_titulo, l.autor as libro_autor, l.codigo as libro_codigo
        FROM turnos t
        JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN libros l ON t.libro_id = l.id
        WHERE t.estado = 'reservado'
        ORDER BY t.fecha ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ===============================
// 🔹 Obtener todos los turnos
// ===============================
router.get("/", verificarToken, (req, res) => {
    const hoy = new Date().toISOString().split("T")[0];

    const getVencidosSql = `SELECT libro_id FROM turnos WHERE estado = 'reservado' AND fecha < ? AND libro_id IS NOT NULL`;
    db.query(getVencidosSql, [hoy], (err, vencidos) => {
        if (err) console.error(err);
        if (vencidos && vencidos.length > 0) {
            vencidos.forEach(v => {
                db.query("UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id = ? AND stock_disponible < stock_total", [v.libro_id]);
            });
        }
        db.query("DELETE FROM turnos WHERE estado = 'reservado' AND fecha < ?", [hoy], (err) => {
            if (err) console.error(err);
            const sql = `SELECT t.*, l.titulo as libro_titulo, l.autor as libro_autor, l.codigo as libro_codigo
                FROM turnos t LEFT JOIN libros l ON t.libro_id = l.id`;
            db.query(sql, (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
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

    // Verificar disponibilidad del libro
    db.query("SELECT stock_disponible, titulo FROM libros WHERE id = ?", [libro_id], (err, libros) => {
        if (err) return res.status(500).json({ error: err.message });
        if (libros.length === 0) return res.status(404).json({ mensaje: "Libro no encontrado" });
        if (libros[0].stock_disponible <= 0) {
            return res.status(400).json({ mensaje: `No hay ejemplares disponibles de "${libros[0].titulo}"` });
        }

        const checkSql = "SELECT * FROM turnos WHERE usuario_id = ? AND fecha = ? AND hora = ?";
        db.query(checkSql, [usuario_id, fecha, hora], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) {
                return res.status(400).json({ mensaje: "Ya tenés una reserva en esa fecha y hora" });
            }

            db.query("INSERT INTO turnos (usuario_id, fecha, hora, estado, libro_id) VALUES (?, ?, ?, 'pendiente', ?)",
                [usuario_id, fecha, hora, libro_id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    db.query("UPDATE libros SET stock_disponible = stock_disponible - 1 WHERE id = ?", [libro_id]);
                    res.status(201).json({ mensaje: "Reserva creada correctamente" });
                }
            );
        });
    });
});


// ===============================
// 🔹 Modificar turno (estado)
// ===============================
router.put("/:id", verificarToken, (req, res) => {
    const { id } = req.params;
    const { estado, usuario_rol } = req.body;

    if (estado !== undefined && usuario_rol !== "admin") {
        return res.status(403).json({ mensaje: "Solo el admin puede modificar el estado" });
    }
    if (!estado) return res.status(400).json({ mensaje: "No hay campos para actualizar" });

    // Si se cancela, restaurar stock
    db.query("SELECT estado, libro_id FROM turnos WHERE id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ mensaje: "Turno no encontrado" });

        const turno = rows[0];
        const restaurarStock = estado === "cancelado" && turno.estado !== "cancelado" && turno.libro_id;

        db.query("UPDATE turnos SET estado = ? WHERE id = ?", [estado, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Turno no encontrado" });

            if (restaurarStock) {
                db.query("UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id = ? AND stock_disponible < stock_total", [turno.libro_id]);
            }
            res.json({ mensaje: "Turno actualizado correctamente" });
        });
    });
});


// ===============================
// 🔹 Eliminar turno
// ===============================
router.delete("/:id", verificarToken, (req, res) => {
    const { id } = req.params;

    // Restaurar stock si el turno no estaba cancelado
    db.query("SELECT estado, libro_id FROM turnos WHERE id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ mensaje: "Turno no encontrado" });

        const turno = rows[0];
        db.query("DELETE FROM turnos WHERE id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Turno no encontrado" });

            if (turno.estado !== "cancelado" && turno.libro_id) {
                db.query("UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id = ? AND stock_disponible < stock_total", [turno.libro_id]);
            }
            res.json({ mensaje: "Turno eliminado correctamente" });
        });
    });
});


module.exports = router;
