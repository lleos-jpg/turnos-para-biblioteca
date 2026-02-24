const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const usuariosRoutes = require("./routes/usuarios");
const turnosRoutes = require("./routes/turnos");


const app = express();

// Permite que el frontend pueda conectarse
app.use(cors());

// Permite recibir datos en formato JSON
app.use(express.json());
app.use("/usuarios", usuariosRoutes);
app.use("/turnos", turnosRoutes);



// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});

// Levantar servidor
app.listen(3001, () => {
    console.log("Servidor corriendo en puerto 3001");
});
