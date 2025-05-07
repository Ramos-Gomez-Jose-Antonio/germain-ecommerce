-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema germainbd
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema germainbd
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `germainbd` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `germainbd` ;

-- -----------------------------------------------------
-- Table `germainbd`.`pdf`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`pdf` (
  `pdf_id` INT NOT NULL,
  `nombre_pdf` VARCHAR(30) NOT NULL,
  `fecha_compra` DATE NOT NULL,
  `archivo` LONGBLOB NULL,
  PRIMARY KEY (`pdf_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `germainbd`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`usuarios` (
  `usuario_id` INT NOT NULL AUTO_INCREMENT,
  `usuario` VARCHAR(30) NOT NULL,
  `nombres` VARCHAR(30) NOT NULL,
  `apellidopat` VARCHAR(30) NOT NULL,
  `apellidomat` VARCHAR(45) NOT NULL,
  `correo` VARCHAR(45) NOT NULL,
  `telefono` INT NOT NULL,
  `contra` VARCHAR(200) NULL DEFAULT NULL,
  `rol` ENUM('proveedor', 'comprador', 'administrador') NOT NULL,
  `imagen_perfil` VARCHAR(45) NULL,
  `pdf_id` INT NOT NULL,
  `status` ENUM('pendiente', 'logeado') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`usuario_id`),
  UNIQUE INDEX `usuario_UNIQUE` (`usuario`),
  UNIQUE INDEX `correo_UNIQUE` (`correo`),
  INDEX `fk_usuarios_pdf1_idx` (`pdf_id`),
  CONSTRAINT `fk_usuarios_pdf1`
    FOREIGN KEY (`pdf_id`)
    REFERENCES `germainbd`.`pdf` (`pdf_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `germainbd`.`carritos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`carritos` (
  `carrito_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`carrito_id`),
  INDEX `fk_carritos_usuario1_idx` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `carritos_ibfk_1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `germainbd`.`usuarios` (`usuario_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`categoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`categoria` (
  `categoria_id` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`categoria_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`historial`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`historial` (
  `historial_compra_id` INT NOT NULL,
  `fecha_compra` DATE NOT NULL,
  `pdf_id` INT NOT NULL,
  PRIMARY KEY (`historial_compra_id`),
  INDEX `fk_historial_pdf1_idx` (`pdf_id` ASC) VISIBLE,
  CONSTRAINT `fk_historial_pdf1`
    FOREIGN KEY (`pdf_id`)
    REFERENCES `germainbd`.`pdf` (`pdf_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`elementos_carrito`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`elementos_carrito` (
  `elementos_carrito_id` INT NOT NULL,
  `productos_comprados` JSON NULL DEFAULT NULL,
  `precio_total` DECIMAL(10,2) NOT NULL,
  `cantidad_total` INT NOT NULL,
  `estatus` INT NOT NULL,
  `historial_compra_id` INT NOT NULL,
  `carrito_id` INT NOT NULL,
  PRIMARY KEY (`elementos_carrito_id`),
  INDEX `fk_elementos_carrito_historial_idx` (`historial_compra_id` ASC) VISIBLE,
  INDEX `fk_elementos_carrito_carritos1_idx` (`carrito_id` ASC) VISIBLE,
  CONSTRAINT `fk_elementos_carrito_carritos1`
    FOREIGN KEY (`carrito_id`)
    REFERENCES `germainbd`.`carritos` (`carrito_id`),
  CONSTRAINT `fk_elementos_carrito_historial`
    FOREIGN KEY (`historial_compra_id`)
    REFERENCES `germainbd`.`historial` (`historial_compra_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`plantel`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`plantel` (
  `plantel_id` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`plantel_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`plantel_categoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`plantel_categoria` (
  `plantel_id` INT NOT NULL,
  `categoria_id` INT NOT NULL,
  PRIMARY KEY (`plantel_id`, `categoria_id`),
  INDEX `fk_plantel_has_categoria_categoria1_idx` (`categoria_id` ASC) VISIBLE,
  INDEX `fk_plantel_has_categoria_plantel1_idx` (`plantel_id` ASC) VISIBLE,
  CONSTRAINT `fk_plantel_has_categoria_categoria1`
    FOREIGN KEY (`categoria_id`)
    REFERENCES `germainbd`.`categoria` (`categoria_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_plantel_has_categoria_plantel1`
    FOREIGN KEY (`plantel_id`)
    REFERENCES `germainbd`.`plantel` (`plantel_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `germainbd`.`producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `germainbd`.`producto` (
  `producto_id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(500) NOT NULL,
  `cantidad` INT NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `nombre_imagen` VARCHAR(250) NULL DEFAULT NULL,
  `usuario_id` INT NOT NULL,
  `categoria_id` INT NOT NULL,
  `fecha_creacion` DATE NOT NULL,
  PRIMARY KEY (`producto_id`),
  INDEX `fk_producto_categoria1_idx` (`categoria_id` ASC) VISIBLE,
  CONSTRAINT `fk_producto_categoria1`
    FOREIGN KEY (`categoria_id`)
    REFERENCES `germainbd`.`categoria` (`categoria_id`),
  CONSTRAINT `fk_producto_usuario1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `germainbd`.`usuarios` (`usuario_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb3;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
