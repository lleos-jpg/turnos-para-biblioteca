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
app.use("/libros", require("./routes/libros"));



// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});

// Levantar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
