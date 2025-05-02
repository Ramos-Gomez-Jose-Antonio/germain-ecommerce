create database germainbd;
use germainbd;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: germainbd
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carritos`
--

DROP TABLE IF EXISTS `carritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carritos` (
  `carrito_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`carrito_id`),
  KEY `fk_carritos_usuario1_idx` (`usuario_id`),
  CONSTRAINT `carritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `categoria_id` int NOT NULL,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`categoria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'CECyT 1'),(9,'CECyT 9'),(11,'CECyT 11');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `elementos_carrito`
--

DROP TABLE IF EXISTS `elementos_carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elementos_carrito` (
  `elementos_carrito_id` int NOT NULL,
  `productos_comprados` json DEFAULT NULL,
  `precio_total` decimal(10,2) NOT NULL,
  `cantidad_total` int NOT NULL,
  `estatus` int NOT NULL,
  `historial_compra_id` int NOT NULL,
  `carrito_id` int NOT NULL,
  PRIMARY KEY (`elementos_carrito_id`),
  KEY `fk_elementos_carrito_historial_idx` (`historial_compra_id`),
  KEY `fk_elementos_carrito_carritos1_idx` (`carrito_id`),
  CONSTRAINT `fk_elementos_carrito_carritos1` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`carrito_id`),
  CONSTRAINT `fk_elementos_carrito_historial` FOREIGN KEY (`historial_compra_id`) REFERENCES `historial` (`historial_compra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `elementos_carrito`
--

LOCK TABLES `elementos_carrito` WRITE;
/*!40000 ALTER TABLE `elementos_carrito` DISABLE KEYS */;
/*!40000 ALTER TABLE `elementos_carrito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `historial_compra_id` int NOT NULL,
  `fecha_compra` date NOT NULL,
  PRIMARY KEY (`historial_compra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantel`
--

DROP TABLE IF EXISTS `plantel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantel` (
  `plantel_id` int NOT NULL,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`plantel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantel`
--

LOCK TABLES `plantel` WRITE;
/*!40000 ALTER TABLE `plantel` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantel_categoria`
--

DROP TABLE IF EXISTS `plantel_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantel_categoria` (
  `plantel_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  PRIMARY KEY (`plantel_id`,`categoria_id`),
  KEY `fk_plantel_has_categoria_categoria1_idx` (`categoria_id`),
  KEY `fk_plantel_has_categoria_plantel1_idx` (`plantel_id`),
  CONSTRAINT `fk_plantel_has_categoria_categoria1` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`categoria_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_plantel_has_categoria_plantel1` FOREIGN KEY (`plantel_id`) REFERENCES `plantel` (`plantel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantel_categoria`
--

LOCK TABLES `plantel_categoria` WRITE;
/*!40000 ALTER TABLE `plantel_categoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantel_categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto`
--

DROP TABLE IF EXISTS `producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto` (
  `producto_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `descripcion` varchar(500) NOT NULL,
  `cantidad` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `nombre_imagen` varchar(250) DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  PRIMARY KEY (`producto_id`),
  KEY `fk_producto_usuario1_idx` (`usuario_id`),
  KEY `fk_producto_categoria1_idx` (`categoria_id`),
  CONSTRAINT `fk_producto_categoria1` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`categoria_id`),
  CONSTRAINT `fk_producto_usuario1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto`
--

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (1,'lapiz','lapizxd',1,1.00,'imagen-1744424648930.png',4,1);
/*!40000 ALTER TABLE `producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `usuario_id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(30) NOT NULL,
  `nombres` varchar(30) NOT NULL,
  `apellidopat` varchar(30) NOT NULL,
  `apellidomat` varchar(45) NOT NULL,
  `correo` varchar(45) NOT NULL,
  `telefono` int NOT NULL,
  `contra` varchar(200) DEFAULT NULL,
  `rol` enum('proveedor','comprador','administrador') NOT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `usuario_UNIQUE` (`usuario`),
  UNIQUE KEY `correo_UNIQUE` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'eladminxd','Lol','Nieves','Sandoval','lolsito@gmail.com',1234567890,'$2b$10$BofPB7Cb62ynOQVoTYHVQeX.PhhmGSWR6oM.V77j0bI2PSYZGq8fa','administrador'),(4,'Naruto','Naruto','ApellidoP','ApellidoM','naruto@gmail.com',1234567890,'$2b$10$3hTjW4zEfBwLL0lIiY9pVe43uAhZZRHrZN7zxHzFfmudYADoDg4WK','comprador');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-11 22:17:55
