-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: localhost    Database: germainbd
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.22.04.1

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
  `carrito_id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`carrito_id`),
  KEY `fk_carritos_usuario1_idx` (`usuario_id`),
  CONSTRAINT `carritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
INSERT INTO `carritos` VALUES (1,9);
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `categoria_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `plantel_id` int NOT NULL,
  PRIMARY KEY (`categoria_id`),
  KEY `fk_categoria_plantel1_idx` (`plantel_id`),
  CONSTRAINT `fk_categoria_plantel1` FOREIGN KEY (`plantel_id`) REFERENCES `plantel` (`plantel_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'Técnico en Construcción',1),(2,'Técnico en Procesos Industriales',1),(3,'Técnico en Sistemas de Control Eléctrico',1),(4,'Técnico en Sistemas Digitales',1),(5,'Técnico en Mecatrónica',1),(6,'Técnico en Aeronáutica',2),(7,'Técnico en Dibujo Asistido por Computadora',2),(8,'Técnico en Diseño Gráfico Digital',2),(9,'Técnico en Máquinas con Sistemas Automatizados',2),(10,'Técnico en Mecatrónica',2),(11,'Técnico en Metalurgia',2),(12,'Técnico en Sistemas Automotrices',2),(13,'Técnico en Aeronáutica',3),(14,'Técnico en Computación',3),(15,'Técnico en Manufactura Asistida por Computadora',3),(16,'Técnico en Sistemas Automotrices',3),(17,'Técnico en Sistemas de Control Eléctrico',3),(18,'Técnico en Sistemas Digitales',3),(19,'Técnico en Aeronáutica',4),(20,'Técnico en Construcción',4),(21,'Técnico en Instalaciones y Mantenimiento Eléctrico',4),(22,'Técnico en Procesos Industriales',4),(23,'Técnico en Sistemas Automotrices',4),(24,'Técnico en Comercio Internacional',5),(25,'Técnico en Contaduría',5),(26,'Técnico en Informática',5),(27,'Técnico en Procesos Ecología',6),(28,'Técnico en Sistemas Enfermería',6),(29,'Técnico en Sistemas Laboratorista Clínico',6),(30,'Técnico en Sistemas Laboratorista Químico',6),(31,'Técnico en Aeronáutica',7),(32,'Técnico en Construcción',7),(33,'Técnico en Energía Sustentable',7),(34,'Técnico en Instalaciones y Mantenimiento Eléctrico',7),(35,'Técnico en Mantenimiento Industrial',7),(36,'Técnico en Sistemas Automotrices',7),(37,'Técnico en Soldadura Industrial',7),(38,'Técnico en Computación',8),(39,'Técnico en Mantenimiento Industrial',8),(40,'Técnico en Plásticos',8),(41,'Técnico en Sistemas Automotrices',8),(42,'Técnico en Mecatrónica',9),(43,'Técnico en Programación',9),(44,'Técnico en Sistemas Digitales',9),(45,'Técnico en Diagnóstico y Mejoramiento Ambiental',10),(46,'Técnico en Mecatrónica',10),(47,'Técnico en Metrología y Control de Calidad',10),(48,'Técnico en Telecomunicaciones',10),(49,'Técnico en Construcción',11),(50,'Técnico en Energía Sustentable',11),(51,'Técnico en Instalaciones y Mantenimiento Eléctrico',11),(52,'Técnico en Procesos Industriales',11),(53,'Técnico en Telecomunicaciones',11),(54,'Técnico en Administración',12),(55,'Técnico en Contaduría',12),(56,'Técnico en Informática',12),(57,'Técnico en Mercadotecnia Digital',12),(59,'Técnico en Administración',13),(60,'Técnico en Administración de Empresas Turísticas',13),(61,'Técnico en Contaduría',13),(62,'Técnico en Gastronomía',13),(63,'Técnico en Gestión de la Ciberseguridad',13),(64,'Técnico en Informática',13),(65,'Técnico en Contaduría',14),(66,'Técnico en Informática',14),(67,'Técnico en Mercadotecnia',14),(68,'Técnico en Mercadotecnia Digital',14),(69,'Técnico en Alimentos',15),(70,'Técnico en Laboratorista Clínico',15),(71,'Técnico en Sustentabilidad',15),(72,'Técnico en Enfermería',16),(73,'Técnico en Laboratorista Clínico',16),(74,'Técnico en Mantenimiento Industrial',16),(75,'Técnico en Procesos Industriales',16),(76,'Técnico en Aeronáutica',17),(77,'Técnico en Alimentos',17),(78,'Técnico en Comercio Internacional',17),(79,'Técnico en Metrología y Control de Calidad',17),(80,'Técnico en Sistemas Automotrices',17),(81,'Técnico en Laboratorista Químico',18),(82,'Técnico en Mantenimiento Industrial',18),(83,'Técnico en Técnico en Sistemas Digitales',18),(84,'Técnico en Aeronáutica',19),(85,'Técnico en Alimentos',19),(86,'Técnico en Construcción',19),(118,'Técnico en Automatización y Control Eléctrico Industrial',23),(119,'Técnico en Redes de Cómputo',23),(120,'Técnico en Sistemas Automotrices',23),(121,'Técnico en Sistemas Constructivos Asistidos por Computadora',23),(122,'Técnico en Sistemas Mecánicos Industriales',23);
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `elementos_carrito`
--

DROP TABLE IF EXISTS `elementos_carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elementos_carrito` (
  `elementos_carrito_id` int NOT NULL AUTO_INCREMENT,
  `productos_comprados` json DEFAULT NULL,
  `precio_total` decimal(10,2) NOT NULL,
  `cantidad_total` int NOT NULL,
  `historial_compra_id` int DEFAULT NULL,
  `carrito_id` int NOT NULL,
  PRIMARY KEY (`elementos_carrito_id`),
  KEY `fk_elementos_carrito_historial_idx` (`historial_compra_id`),
  KEY `fk_elementos_carrito_carritos1_idx` (`carrito_id`),
  CONSTRAINT `fk_elementos_carrito_carritos1` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`carrito_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_elementos_carrito_historial` FOREIGN KEY (`historial_compra_id`) REFERENCES `historial` (`historial_compra_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `elementos_carrito`
--

LOCK TABLES `elementos_carrito` WRITE;
/*!40000 ALTER TABLE `elementos_carrito` DISABLE KEYS */;
INSERT INTO `elementos_carrito` VALUES (1,'[{\"nombre\": \"los chavos\", \"precio\": \"1.00\", \"cantidad\": 1, \"plantel_id\": 9, \"usuario_id\": 9, \"descripcion\": \"        los chavos\", \"producto_id\": 4, \"categoria_id\": 42, \"nombre_imagen\": \"temp-1749786819060-987815867.png\", \"fecha_creacion\": \"2025-06-09T06:00:00.000Z\", \"nombre_imagen2\": \"temp-1749450386733-137792616.png\", \"nombre_imagen3\": \"temp-1749450386738-48401563.jpg\"}]',1.00,1,NULL,1);
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
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`token_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,9,'5ba12e203c8a8e90605ac532e78fc8b8f1f43cb7d9351891970de39d4913a4c9','2025-05-12 00:54:54',1),(2,9,'56bfa3c94333ac01a2947f6176182d3c6def6f23eb1b18384bef249e10e61c93','2025-06-03 15:05:06',0),(3,9,'e8a5aea9075015427f3a72ce7b5dad38801899c1e812378145cda7fc95e35b7c','2025-06-03 15:05:14',0),(4,9,'ce7752f39217b299de3dd2d35bd6b0e9fc6f46caff880b68de5c522d136dbefd','2025-06-03 17:28:36',0),(5,9,'da3bf76728a1e6898173ccbad3ae8dddc23e9bdf5d17496f902527ecacac3d80','2025-06-03 17:51:07',0),(6,9,'a3cc3554b80d691c17d6d08895cc58b2f09597340ddedf4ab3405d4e4e6ab073','2025-06-03 17:51:12',0),(7,9,'fd6b60f4dfd3d99162acf2f34d7d857f67042d9fb8bbdf93fcc60ddbc71840ef','2025-06-03 18:04:03',0),(8,9,'bfcd1560de5c984981537e2fa7df684a2075cf55955dd0edfd84b6b966ef53d7','2025-06-03 20:19:56',0),(9,9,'eadd004768448cad104fe7305013d48b66ec5351b1cefe178bd3d97c7603fa05','2025-06-03 20:22:20',1),(10,9,'50f5badf13cce005eb7286825416eec8285fe00020ee2356beee412b150de2ea','2025-06-05 15:20:16',1),(11,9,'f6f9aebf0bef2b8e4d9c04d89ae5d89cb8b72ca966fe0a9bd75420ee6b03588b','2025-06-05 15:42:40',1),(12,10,'ce73609150887b9196093b5485e2121d801e3326853443cf8041d5c25db42bbf','2025-06-05 15:43:37',0),(13,9,'9374ff9c64aa0fd7870156d117a63027a854607c634cdd97debbf905d4da6c46','2025-06-09 00:02:55',1),(14,9,'f219771a752bb9995269aa9fa4ada791da0ae2e2dec01bd64583692c9fd4a6c4','2025-06-11 00:17:18',1);
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pdf`
--

DROP TABLE IF EXISTS `pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pdf` (
  `pdf_id` int NOT NULL,
  `nombre_pdf` varchar(30) NOT NULL,
  `fecha_compra` date NOT NULL,
  `archivo` longblob,
  `usuario_id` int NOT NULL,
  `historial_compra_id` int NOT NULL,
  PRIMARY KEY (`pdf_id`),
  KEY `fk_pdf_usuarios1_idx` (`usuario_id`),
  KEY `fk_pdf_historial1_idx` (`historial_compra_id`),
  CONSTRAINT `fk_pdf_historial1` FOREIGN KEY (`historial_compra_id`) REFERENCES `historial` (`historial_compra_id`),
  CONSTRAINT `fk_pdf_usuarios1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pdf`
--

LOCK TABLES `pdf` WRITE;
/*!40000 ALTER TABLE `pdf` DISABLE KEYS */;
/*!40000 ALTER TABLE `pdf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantel`
--

DROP TABLE IF EXISTS `plantel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantel` (
  `plantel_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `imagen` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`plantel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantel`
--

LOCK TABLES `plantel` WRITE;
/*!40000 ALTER TABLE `plantel` DISABLE KEYS */;
INSERT INTO `plantel` VALUES (1,'CECyT 1','c1.png'),(2,'CECyT 2','c2.png'),(3,'CECyT 3','c3.png'),(4,'CECyT 4','c4.png'),(5,'CECyT 5','c5.png'),(6,'CECyT 6','c6.png'),(7,'CECyT 7','c7.png'),(8,'CECyT 8','c8.png'),(9,'CECyT 9','c9.png'),(10,'CECyT 10','c10.png'),(11,'CECyT 11','c11.png'),(12,'CECyT 12','c12.png'),(13,'CECyT 13','c13.png'),(14,'CECyT 14','c14.png'),(15,'CECyT 15','c15.png'),(16,'CECyT 16','c16.png'),(17,'CECyT 17','c17.png'),(18,'CECyT 18','c18.png'),(19,'CECyT 19','c19.png'),(23,'CET 1','cet1.png');
/*!40000 ALTER TABLE `plantel` ENABLE KEYS */;
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
  `nombre_imagen2` varchar(250) DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  `fecha_creacion` date NOT NULL,
  `nombre_imagen3` varchar(250) NOT NULL,
  `plantel_id` int DEFAULT NULL,
  PRIMARY KEY (`producto_id`),
  KEY `fk_producto_categoria1_idx` (`categoria_id`),
  KEY `fk_producto_usuario1` (`usuario_id`),
  KEY `fk_producto_plantel` (`plantel_id`),
  CONSTRAINT `fk_producto_categoria1` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`categoria_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_plantel` FOREIGN KEY (`plantel_id`) REFERENCES `plantel` (`plantel_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_usuario1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto`
--

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (2,'lapiz','  lapizote',1,2.00,'temp_1749191043718.png','temp_1749191043719.png',2,43,'2025-06-06','temp_1749191043719.png',9),(4,'los chavos','        los chavos',3,1.00,'temp-1749786819060-987815867.png','temp-1749450386733-137792616.png',9,42,'2025-06-09','temp-1749450386738-48401563.jpg',9);
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
  `telefono` varchar(15) NOT NULL,
  `contra` varchar(200) DEFAULT NULL,
  `rol` enum('proveedor','comprador','administrador') NOT NULL,
  `imagen_perfil` varchar(200) DEFAULT NULL,
  `verificado` tinyint NOT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `usuario_UNIQUE` (`usuario`),
  UNIQUE KEY `correo_UNIQUE` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'eladminxd','Lol','Nieves','Sandoval','lolsito@gmail.com','1234567890','$2b$10$BofPB7Cb62ynOQVoTYHVQeX.PhhmGSWR6oM.V77j0bI2PSYZGq8fa','administrador','default-profile.png',1),(2,'Naruto','Naruto','Uzumaki','Shipudden','naruto@gmail.com','1234567890','$2b$10$MFFwJyx0/nX7VgwQPgVGt.GXDLfijDg2mCFHjmLgLyfWMixtrTT1i','comprador','user-2.jpg',1),(7,'idcas','a','l','o','idcas404@gmail.com','1234567890','$2b$10$8uHZW36VdENysDnBJi05S.lWqwg16Nhmk9TKLP1GRR47D4XU0CXp.','comprador','idcas.png',1),(8,'cesar ','hola','hola','hola','idcsa07@gmail.com','5589','$2b$10$shEGZ.ebBVIYNJ5G1CSU3OfRvq4YBwwYLADMehyDNX0yaIo5WRy2e','comprador','cesar .png',1),(9,'rambloxzzx','Jose Antonio','Ramos','Gomez','ramosgmz.07@gmail.com','5634728008','$2b$10$LhZ02e53up4/h1KSav9Sw.FnmZRVKoahMYi8FVacz6yT4215zISqO','comprador','user-9.png',1),(10,'ggs','hola','hola','hola','gg@gmail.com','1234567890','$2b$10$0fqyNWNpcFPbYWwWmT7O9.F1XZXBTA13ZQ14E6wgzqLDELFUhRWBe','comprador','opt-default-1747197106511-800315425.png',1),(11,'MK14','Miguel','Cruces','Pelaez','pelaezcruces990@gmail.com','5518569693','$2b$10$CH5U14rz6fNIW6SelphwieoKX7e87ya5Bb0yw2O6ls7aOFwEIjg5S','comprador',NULL,1),(12,'world','leonel','olvera','gil','olvera.gil.leonel@gmail.com','5530714728','$2b$10$6Jncq3v/czL.ZkZZeclCIe4.phLsdwlwHWMPStH.O8HGUYxRUmaE2','comprador',NULL,1),(13,'holaxd','g','g','s','sss@gmail.com','1234567890','$2b$10$PJ3q6jcR/ttjNFAkp39sDeynzKAZRFjEjmuGijmhgRkNfWR.bra6y','comprador',NULL,1),(14,'hola','f','f','f','ss@gmail.com','1234567890','$2b$10$Tmg13oqbbiy52ODdY7u9BuIgO2MQDy/UAVQt/RZroSYetpAP7bGNe','comprador',NULL,1),(15,'holaxddx','r','r','r','s@gmail.com','1234567890','$2b$10$/bhiB5PcVYDaRccSxMWmLeaoRWyRGHWo3GkpTBgGTUPNei6.esNqC','comprador',NULL,0),(16,'cooking','hola','hola','hola','aaaa@gmail.com','1234567890','$2b$10$5/567QLJcsYklvFn1MAB8.raTWWYT8MR6b638IXlrvYihD59RvzVK','comprador',NULL,1),(17,'holandapapu123@gmail.com','hola','gol','mateo','aaa@gmail.com','1234567890','$2b$10$wxqmiLfF4sYfNYOabMWW2u5jQWynlXz1H/oNbxdEs2J2fNE8n/Y3m','comprador',NULL,1),(18,'diosmio','leo','hola','hola','aa@gmail.com','55123456','$2b$10$rBkxwZCOIpKrVlYYPNfvSu/BsgV327Axm9gX0co3R4ELrDm3iKq4O','comprador',NULL,0),(19,'yaporfavor','da','vd','navas','a@gmail.com','1234567890','$2b$10$GZH2yVFhFaL9CZzffwiDuOHZVAcBr.1YT2VA5ZQB6ukTroC9C9yRu','comprador',NULL,1),(20,'asda','a','a','a','ba@gmail.com','1234567890','$2b$10$GAFTSCPzN.1vGGjBUC8/yeQkf8/kPTBu/yMBILJjDSHInsaETRrOu','comprador','user-20.png',1),(22,'holanda','hola','s','s','aaaaaa@gmail.com','1234567890','$2b$10$jEaR.yzMD88m3J0a2OqHAuDWcJklBvVwaLbzhYs1G.ADB4nov.KEG','comprador',NULL,1),(24,'qwert','dfasdf','adsfasd','adfa','bbbg@gmail.com','1234567890','$2b$10$CqbtYCIH0WPXrfCfPgEXF.kAdixK45JiCmBclZUGHezYbDiVxfbra','comprador','default-profile.png',1),(25,'por favor','adfadf','adfadsf','adfadsfasd','bbdg@gmail.com','1234567890','$2b$10$lPzvPZ2uwvean3xrPRSMIua4Nah7WPf1Nk/QOc6VHAs0wQL8CTfSS','comprador','default-profile.png',0),(26,'ostiaporfavor','xd','xd','xd','bbddd@gmail.com','1234567890','$2b$10$XlQWRVPahOwrjl5yZsjxP.mu/KLt6IGci1wPc8LjKm.uKjwGji6ya','comprador','default-profile.png',1),(28,'holasssss','es','esf','asdfas','bdd@gmail.com','1234567890','$2b$10$k2GMWTN770X7HzRyVRWUpuvVoDrJUsLgMunPhSvZ9yBfCZpCmxEhS','comprador','default-profile.png',1),(29,'holandaaaaaaaaaa','ya por favor','hlaaa','por favor','dbdd@gmail.com','1234567890','$2b$10$buViT2bjLWratGYL3sLV7.tW3Cvn8lMRox4YTChWRQu/FMZDKy52a','comprador','default-profile.png',1),(30,'ghfdg','hola','adfsd','asfasd','dbded@gmail.com','1234567890','$2b$10$m5kAcWVmQ3QKQCwSF1/fWOvv.oFcUI2Npuogcn4k4yVFMlzwy7opu','comprador','default-profile.png',0),(31,'dadfadsf','adfads','adsfads','adsf','dbddd@gmail.com','1234567890','$2b$10$ZetW/x3aEkNYgHL4urETsekv6wX7PBuNfVzFAKUt9Iu6lm3AYHUTu','comprador','user-1749535797057.png',1),(32,'ragtrahgaera','fadsfads','asdfadsfad','asdfasdfasd','dddbddd@gmail.com','123456780','$2b$10$wuufgdybz66qncJaV1VsIuXi54AMNq93aKcKhqcSfy2PiPkirrmpS','comprador','user-1749538018877.png',1),(33,'mk25','miguel','cruces','Pelaez','ddddfddd@gmail.com','1234567890','$2b$10$shxZxVNBNpuB6Wjg239HU.XiQX8c4jrtdqq7AEX3n36lrYPiuLHGi','comprador','user-33.png',1),(34,'sdfghjsdfgh','adfgh','dfg','fadsg','ddddfdfddd@gmail.com','1234567890','$2b$10$RnJBmBkXUFyipwOyYjpWR.2bQzt2lE6QBoT1CjsPk3YSbz5Etpf0u','administrador','default-profile.png',1),(35,'noma','ti','ling','asdf','holandapapu123@gmail.com','1234567890','$2b$10$V/b8Gg7jwL14dcW94/xvzuWl0wip7y7cOGmlo4pKufuDAJVZL52rC','proveedor','user-35.png',1);
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

-- Dump completed on 2025-06-13  0:11:36
