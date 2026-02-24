import { useState, useEffect } from "react";
import './App.css'

function App() {
  const [modo, setModo] = useState("login");
  const [usuario, setUsuario] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Restaurar sesión y tema
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const temaGuardado = localStorage.getItem("darkMode");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    if (temaGuardado) {
      setDarkMode(temaGuardado === "true");
    }
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleRegistro = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Usuario creado correctamente");
        setModo("login");
        setNombre("");
        setEmail("");
        setPassword("");
      } else {
        setMensaje(data.mensaje || "❌ Error");
      }
    } catch {
      setMensaje("❌ Error conectando con el servidor");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        setUsuario(data.usuario);
        setMensaje("");
      } else {
        setMensaje(data.mensaje || "❌ Credenciales incorrectas");
      }
    } catch {
      setMensaje("❌ Error conectando con el servidor");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
    setModo("login");
  };

  if (usuario) {
    return <Panel usuario={usuario} cerrarSesion={cerrarSesion} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div className="auth-container">
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀️" : "🌙"}
      </button>
      <div className="auth-card">
        <h1>📚 BiblioWait</h1>
        <div className="tab-buttons">
          <button 
            className={modo === "login" ? "tab active" : "tab"}
            onClick={() => setModo("login")}
          >
            Login
          </button>
          <button 
            className={modo === "registro" ? "tab active" : "tab"}
            onClick={() => setModo("registro")}
          >
            Registro
          </button>
        </div>

        <form onSubmit={modo === "registro" ? handleRegistro : handleLogin}>
          {modo === "registro" && (
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary">
            {modo === "registro" ? "Crear Usuario" : "Iniciar Sesión"}
          </button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </div>
  );
}

function Panel({ usuario, cerrarSesion, darkMode, setDarkMode }) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [notificacion, setNotificacion] = useState("");


  const actualizarEstado = async (id, nuevoEstado) => {
    setTurnos(turnos.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
  
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/turnos/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado, usuario_rol: usuario.rol }),
      });
    } catch (error) {
      console.error("Error:", error);
      obtenerTurnos();
    }
  };  

  const obtenerTurnos = async () => {
    let url;
  
    if (usuario.rol === "admin") {
      url = "http://localhost:3001/turnos";
    } else {
      url = `http://localhost:3001/turnos/mis-turnos/${usuario.id}`;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
  
      if (Array.isArray(data)) {
        setTurnos(data);
      } else {
        setTurnos([]);
      }
    } catch (error) {
      console.error("Error obteniendo turnos:", error);
    }
  };

  const mostrarNotificacion = (mensaje) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(""), 4000);
  };

  const crearTurno = async (e) => {
    e.preventDefault();
  
    if (!fecha || !hora) {
      mostrarNotificacion("❌ Completa fecha y hora");
      return;
    }
  
    const hoy = new Date().toISOString().split("T")[0];
  
    if (fecha < hoy) {
      mostrarNotificacion("❌ No puedes crear turnos en fechas pasadas");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/turnos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          fecha,
          hora,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarNotificacion("❌ " + (data.mensaje || "Error al crear turno"));
        return;
      }

      mostrarNotificacion("✅ Turno creado correctamente");
      setFecha("");
      setHora("");
      obtenerTurnos();
    } catch (error) {
      mostrarNotificacion("❌ Error conectando con el servidor");
    }
  };
  

  const eliminarTurno = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/turnos/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    obtenerTurnos();
  };

  useEffect(() => {
    obtenerTurnos();
  }, []);
  
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toString();
    const soloFecha = fechaStr.split('T')[0];
    const [year, month, day] = soloFecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const turnosFiltrados =
    filtro === "todos"
      ? turnos
      : turnos.filter((turno) => turno.estado === filtro);

    return (
      <div className="panel-container">
        {notificacion && <div className="notificacion">{notificacion}</div>}
        <header className="header">
          <div>
            <h1>Bienvenido {usuario.nombre} 👋</h1>
            <p className="user-info">{usuario.email} • {usuario.rol}</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
          </div>
        </header>
    
        <div className="content">
          {usuario.rol !== "admin" && (
            <section className="crear-turno">
              <h2>📅 Crear Turno</h2>
              <form onSubmit={crearTurno}>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Crear Turno</button>
              </form>
            </section>
          )}
    
          <section className="turnos-section">
            <div className="section-header">
              <h2>{usuario.rol === "admin" ? "Todos los Turnos" : "Mis Turnos"}</h2>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="filtro">
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="reservado">Reservado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
    
            <div className="turnos-grid">
              {turnosFiltrados.map((turno) => (
                <div key={turno.id} className={`card estado-${turno.estado}`}>
                  <div className="card-header">
                    <span className="fecha">📅 {formatearFecha(turno.fecha)}</span>
                    <span className="hora">🕐 {turno.hora} hs</span>
                  </div>
                  <div className="card-body">
                    {usuario.rol === "admin" ? (
                      <select
                        value={turno.estado}
                        onChange={(e) => actualizarEstado(turno.id, e.target.value)}
                        className="estado-select"
                      >
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="reservado">✅ Reservado</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    ) : (
                      <div className="estado-badge">
                        {turno.estado === "pendiente" && "⏳ Pendiente"}
                        {turno.estado === "reservado" && "✅ Reservado"}
                        {turno.estado === "cancelado" && "❌ Cancelado"}
                      </div>
                    )}
                  </div>
                  <button onClick={() => eliminarTurno(turno.id)} className="btn-delete">
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
    
}

export default App;
