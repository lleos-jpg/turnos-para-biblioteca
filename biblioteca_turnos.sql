-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-02-2026 a las 22:14:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `biblioteca_turnos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado` enum('pendiente','reservado','cancelado') NOT NULL DEFAULT 'pendiente',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id`, `usuario_id`, `fecha`, `hora`, `estado`, `creado_en`) VALUES
(3, 6, '2234-11-11', '11:11:00', 'reservado', '2026-02-22 02:08:45'),
(14, 6, '0000-00-00', '03:33:00', 'pendiente', '2026-02-22 19:21:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('usuario','admin') DEFAULT 'usuario',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `creado_en`) VALUES
(1, 'Leonel', 'leo@gmail.com', '1234', 'usuario', '2026-02-19 16:42:27'),
(2, 'Leonel', 'leo@test.com', '$2b$10$M03s6eK0NStLQv4ucUGd5efv9qtYEZLHSkQx9HUtbnjS4Svp.lkki', 'admin', '2026-02-19 17:52:07'),
(6, 'leo', 'leonelsechuk2@gmail.com', '$2b$10$Uwcm9XJrkyM6CbUTiZ5WIu.G1A4FZ9U5bjy6KsXknrGUvOaSlS/AC', 'usuario', '2026-02-20 16:50:25'),
(7, 'a', 'admin@gmail.com', '$2b$10$IE9ylonIIA5rdXUsvjFeduESm8NqMkCisVExgsUohtOWyb3FgxoUm', 'usuario', '2026-02-22 18:56:44');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
