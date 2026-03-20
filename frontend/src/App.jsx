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

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const temaGuardado = localStorage.getItem("darkMode");
    if (usuarioGuardado) setUsuario(JSON.parse(usuarioGuardado));
    if (temaGuardado) setDarkMode(temaGuardado === "true");
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMensaje("✅ Usuario creado correctamente");
        setModo("login");
        setNombre(""); setEmail(""); setPassword("");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/login`, {
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
        <div className="auth-logo">
          <span className="auth-logo-icon">📚</span>
          <h1>BiblioWait</h1>
          <p className="auth-subtitle">Sistema de reserva de libros</p>
        </div>
        <div className="tab-buttons">
          <button className={modo === "login" ? "tab active" : "tab"} onClick={() => setModo("login")}>
            Iniciar sesión
          </button>
          <button className={modo === "registro" ? "tab active" : "tab"} onClick={() => setModo("registro")}>
            Registrarse
          </button>
        </div>

        <form onSubmit={modo === "registro" ? handleRegistro : handleLogin}>
          {modo === "registro" && (
            <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          )}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">
            {modo === "registro" ? "Crear cuenta" : "Ingresar"}
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
  const [libroId, setLibroId] = useState("");
  const [turnos, setTurnos] = useState([]);
  const [libros, setLibros] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [notificacion, setNotificacion] = useState("");
  const [vistaAdmin, setVistaAdmin] = useState("turnos");
  const [nuevoLibroTitulo, setNuevoLibroTitulo] = useState("");
  const [nuevoLibroAutor, setNuevoLibroAutor] = useState("");

  const token = localStorage.getItem("token");
  const authHeader = { "Authorization": `Bearer ${token}` };

  const mostrarNotificacion = (msg) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(""), 4000);
  };

  const obtenerTurnos = async () => {
    const url = usuario.rol === "admin"
      ? `${import.meta.env.VITE_API_URL}/turnos`
      : `${import.meta.env.VITE_API_URL}/turnos/mis-turnos/${usuario.id}`;
    try {
      const response = await fetch(url, { headers: authHeader });
      const data = await response.json();
      setTurnos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error obteniendo turnos:", error);
    }
  };

  const obtenerLibros = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/libros`, { headers: authHeader });
      const data = await response.json();
      setLibros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error obteniendo libros:", error);
    }
  };

  useEffect(() => {
    obtenerTurnos();
    obtenerLibros();
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    setTurnos(turnos.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/turnos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ estado: nuevoEstado, usuario_rol: usuario.rol }),
      });
    } catch (error) {
      obtenerTurnos();
    }
  };

  const crearTurno = async (e) => {
    e.preventDefault();
    if (!fecha || !hora || !libroId) {
      mostrarNotificacion("❌ Completa todos los campos");
      return;
    }
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha < hoy) {
      mostrarNotificacion("❌ No puedes reservar en fechas pasadas");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ usuario_id: usuario.id, fecha, hora, libro_id: libroId }),
      });
      const data = await response.json();
      if (!response.ok) {
        mostrarNotificacion("❌ " + (data.mensaje || "Error al crear reserva"));
        return;
      }
      mostrarNotificacion("✅ Reserva creada correctamente");
      setFecha(""); setHora(""); setLibroId("");
      obtenerTurnos();
    } catch {
      mostrarNotificacion("❌ Error conectando con el servidor");
    }
  };

  const eliminarTurno = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/turnos/${id}`, {
      method: "DELETE",
      headers: authHeader
    });
    obtenerTurnos();
  };

  const agregarLibro = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/libros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ titulo: nuevoLibroTitulo, autor: nuevoLibroAutor }),
      });
      const data = await response.json();
      if (!response.ok) {
        mostrarNotificacion("❌ " + data.mensaje);
        return;
      }
      mostrarNotificacion("✅ Libro agregado correctamente");
      setNuevoLibroTitulo(""); setNuevoLibroAutor("");
      obtenerLibros();
    } catch {
      mostrarNotificacion("❌ Error conectando con el servidor");
    }
  };

  const eliminarLibro = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/libros/${id}`, {
      method: "DELETE",
      headers: authHeader
    });
    obtenerLibros();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const soloFecha = fecha.toString().split('T')[0];
    const [year, month, day] = soloFecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const turnosFiltrados = filtro === "todos" ? turnos : turnos.filter(t => t.estado === filtro);

  return (
    <div className="panel-container">
      {notificacion && <div className="notificacion">{notificacion}</div>}

      <header className="header">
        <div className="header-brand">
          <span className="header-icon">📚</span>
          <div>
            <h1>BiblioWait</h1>
            <p className="user-info">{usuario.nombre} · {usuario.rol}</p>
          </div>
        </div>
        <div className="header-actions">
          {usuario.rol === "admin" && (
            <div className="admin-tabs">
              <button className={vistaAdmin === "turnos" ? "admin-tab active" : "admin-tab"} onClick={() => setVistaAdmin("turnos")}>
                Reservas
              </button>
              <button className={vistaAdmin === "libros" ? "admin-tab active" : "admin-tab"} onClick={() => setVistaAdmin("libros")}>
                Catálogo
              </button>
            </div>
          )}
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
        </div>
      </header>

      <div className="content">

        {/* VISTA USUARIO: CREAR RESERVA */}
        {usuario.rol !== "admin" && (
          <section className="crear-turno">
            <h2>Reservar un libro</h2>
            <form onSubmit={crearTurno}>
              <select value={libroId} onChange={(e) => setLibroId(e.target.value)} required className="select-libro">
                <option value="">— Seleccionar libro —</option>
                {libros.map(libro => (
                  <option key={libro.id} value={libro.id}>
                    {libro.titulo} — {libro.autor}
                  </option>
                ))}
              </select>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
              <button type="submit" className="btn-primary">Reservar</button>
            </form>
          </section>
        )}

        {/* VISTA ADMIN: GESTIÓN DE LIBROS */}
        {usuario.rol === "admin" && vistaAdmin === "libros" && (
          <section className="libros-section">
            <div className="section-header">
              <h2>Catálogo de libros</h2>
            </div>
            <form onSubmit={agregarLibro} className="form-libro">
              <input
                type="text"
                placeholder="Título del libro"
                value={nuevoLibroTitulo}
                onChange={(e) => setNuevoLibroTitulo(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Autor"
                value={nuevoLibroAutor}
                onChange={(e) => setNuevoLibroAutor(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Agregar libro</button>
            </form>
            <div className="libros-lista">
              {libros.map(libro => (
                <div key={libro.id} className="libro-item">
                  <div className="libro-info">
                    <span className="libro-icono">📖</span>
                    <div>
                      <p className="libro-titulo">{libro.titulo}</p>
                      <p className="libro-autor">{libro.autor}</p>
                    </div>
                  </div>
                  <button onClick={() => eliminarLibro(libro.id)} className="btn-delete">Eliminar</button>
                </div>
              ))}
              {libros.length === 0 && <p className="empty-msg">No hay libros en el catálogo.</p>}
            </div>
          </section>
        )}

        {/* TURNOS */}
        {(usuario.rol !== "admin" || vistaAdmin === "turnos") && (
          <section className="turnos-section">
            <div className="section-header">
              <h2>{usuario.rol === "admin" ? "Todas las reservas" : "Mis reservas"}</h2>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="filtro">
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="reservado">Reservado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="turnos-grid">
              {turnosFiltrados.map((turno) => (
                <div key={turno.id} className={`card estado-${turno.estado}`}>
                  <div className="card-libro">
                    <span className="card-libro-icon">📖</span>
                    <div>
                      <p className="card-libro-titulo">{turno.libro_titulo || "Sin libro asignado"}</p>
                      <p className="card-libro-autor">{turno.libro_autor || ""}</p>
                    </div>
                  </div>
                  <div className="card-header">
                    <span className="fecha">📅 {formatearFecha(turno.fecha)}</span>
                    <span className="hora">🕐 {turno.hora} hs</span>
                  </div>
                  <div className="card-body">
                    {usuario.rol === "admin" ? (
                      <select value={turno.estado} onChange={(e) => actualizarEstado(turno.id, e.target.value)} className="estado-select">
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="reservado">✅ Reservado</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    ) : (
                      <div className="estado-badge">
                        {turno.estado === "pendiente" && "⏳ Pendiente de aprobación"}
                        {turno.estado === "reservado" && "✅ Reserva confirmada"}
                        {turno.estado === "cancelado" && "❌ Cancelado"}
                      </div>
                    )}
                  </div>
                  <button onClick={() => eliminarTurno(turno.id)} className="btn-delete">🗑️ Eliminar</button>
                </div>
              ))}
              {turnosFiltrados.length === 0 && <p className="empty-msg">No hay reservas para mostrar.</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
