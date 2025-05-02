/* ==================================================
   CONFIGURACIÓN INICIAL Y REQUERIMIENTOS
   ================================================== */
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

// Requerimientos básicos
const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const cors = require('cors');

// Configuración de Passport
const initializePassport = require("./passport-config");
initializePassport(passport);

// Configuración de base de datos
const mysql = require("mysql2");
const mysql_sync = require("sync-mysql");

// Configuración de email
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

// Configuración de subida de archivos
const multer = require("multer");

// Inicialización de la app
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ==================================================
   MIDDLEWARES
   ================================================== */
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'images')));

// Configuración para evitar warning de listeners
process.setMaxListeners(0);

/* ==================================================
   CONFIGURACIÓN DE MULTER (SUBIDA DE ARCHIVOS)
   ================================================== */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

/* ==================================================
   CONEXIÓN A BASE DE DATOS
   ================================================== */
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('Conectado a la base de datos MySQL...');
    }
});

// Conexión síncrona para operaciones específicas
const connectionSync = new mysql_sync({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

/* ==================================================
   CONFIGURACIÓN DE EMAIL
   ================================================== */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* ==================================================
   VARIABLES GLOBALES
   ================================================== */
let currentMail = ""; // Almacena el email del usuario actual

/* ==================================================
   FUNCIONES DE AUTENTICACIÓN
   ================================================== */
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/landingpg");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}

/* ==================================================
   RUTAS DE AUTENTICACIÓN
   ================================================== */

// Página principal
app.get('/', checkAuthenticated, (req, res) => {
    res.render("index.ejs", { name: req.user.name });
});

app.get('/landingpg',checkNotAuthenticated, (req, res) => {
    res.render("landingpg.ejs");
});
// Login
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
});

app.post("/login", checkNotAuthenticated, (req, res, next) => {
    currentMail = req.body.email;
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
            if (err) return next(err);
            return user.rol === "administrador" ? res.redirect("/admin") : res.redirect("/");
        });
    })(req, res, next);
});

// Registro
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register', { error: null, email: '', user: { email: '' } });
});

app.post('/register', checkNotAuthenticated, upload.single('profilePhoto'), async (req, res) => {
    try {
        const { nombre, apellidoPaterno, apellidoMaterno, username, telefono, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('register', { 
                error: 'Las contraseñas no coinciden',
                email: email,
                user: { email: email }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const rol = 'comprador';

        const query = 'INSERT INTO usuarios (usuario, nombres, apellidopat, apellidomat, correo, telefono, contra, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        db.execute(query, [username, nombre, apellidoPaterno, apellidoMaterno, email, telefono, hashedPassword, rol], (err, results) => {
            if (err) {
                console.error('Error en el registro:', err);
                return res.render('register', { 
                    error: err.code === 'ER_DUP_ENTRY' ? 'El correo ya está registrado' : 'Error en el servidor',
                    email: email,
                    user: { email: email }
                });
            }

            // Guarda el usuario en sesión para acceso inmediato
            req.session.userId = results.insertId;
            res.redirect('/dashboard'); // O a la página que desees
        });

    } catch (e) {
        console.error('Error en el registro:', e);
        res.render('register', { 
            error: 'Error en el registro',
            email: req.body.email,
            user: { email: req.body.email }
        });
    }
});

// Logout
app.delete("/logout", (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err);
        res.redirect("/");
    });
});

app.get('/salida', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("No se pudo cerrar la sesión.");
        }
        res.redirect('/login');
    });
});

/* ==================================================
   RUTAS DE PRODUCTOS
   ================================================== */

// Vista para agregar producto
app.get('/agregar-producto', checkAuthenticated, (req, res) => {
    res.render('agregar-producto.ejs');
});

// Agregar producto a la base de datos
app.post('/agregar-producto', upload.single('imagen'), checkAuthenticated, async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoria } = req.body;
    const imagen = req.file;

    if (!nombre || !descripcion || !precio || !cantidad || !categoria || !imagen) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son requeridos' 
        });
    }

    try {
        const userEmail = req.user?.email || currentMail;
        const [userResults] = await db.promise().execute(
            'SELECT usuario_id FROM usuarios WHERE correo = ?', 
            [userEmail]
        );

        if (userResults.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const vendedorId = userResults[0].usuario_id;
        const precioNum = parseFloat(precio);
        const cantidadInt = parseInt(cantidad);
        const categoriaInt = parseInt(categoria);

        const [insertResults] = await db.promise().execute(
            'INSERT INTO producto (nombre, descripcion, precio, cantidad, categoria_id, nombre_imagen, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, descripcion, precioNum, cantidadInt, categoriaInt, imagen.filename, vendedorId]
        );

        return res.status(200).json({ 
            success: true, 
            message: 'Producto agregado correctamente' 
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor al agregar producto',
            error: error.message 
        });
    }
});

// Rutas de categorías
app.get('/cereales', checkAuthenticated, (req, res) => res.render('cereales.ejs'));
app.get('/conocenos', checkAuthenticated, (req, res) => res.render('conocenos.ejs'));
app.get('/almacen', checkAuthenticated, (req, res) => res.render('almacen.ejs'));
app.get('/planteles', checkAuthenticated, (req, res) => res.render('planteles.ejs'));
app.get('/perfil', checkAuthenticated, (req, res) => res.render('perfil.ejs'));
app.get('/detalles', checkAuthenticated, (req, res) => res.render('detallesentrega.ejs'));
app.get('/terycon', checkAuthenticated, (req, res) => res.render('terminoscondiciones.ejs'));
app.get('/pprivacidad', checkAuthenticated, (req, res) => res.render('pprivacidad.ejs'));

/* ==================================================
   ESTADÍSTICAS DE PRODUCTOS
   ================================================== */

// Datos para gráficas
app.get('/data', (req, res) => {
    const queries = [
        { id: 1, nombre: "CECyT 1" },
        { id: 2, nombre: "CECyT 2" },
        { id: 3, nombre: "CECyT 3" },
        { id: 4, nombre: "CECyT 4" },
        { id: 5, nombre: "CECyT 5" },
        { id: 6, nombre: "CECyT 6" },
        { id: 7, nombre: "CECyT 7" },
        { id: 8, nombre: "CECyT 8" },
        { id: 1, nombre: "CECyT 9" },
        { id: 10, nombre: "CECyT 10" },
        { id: 11, nombre: "CECyT 11" },
        { id: 12, nombre: "CECyT 12" },
        { id: 13, nombre: "CECyT 13" },
        { id: 14, nombre: "CECyT 14" },
        { id: 15, nombre: "CECyT 15" },
        { id: 16, nombre: "CECyT 16" },
        { id: 17, nombre: "CECyT 17" },
        { id: 18, nombre: "CECyT 18" },
        { id: 19, nombre: "CECyT 19" },
        { id: 20, nombre: "CECyT 20" },
        { id: 11, nombre: "CET 1" }
    ];

    const results = [];

    queries.forEach((categoria, index) => {
        const query = `SELECT COUNT(*) AS count FROM producto WHERE categoria_id = ${categoria.id}`;
        
        db.query(query, (error, result) => {
            if (error) {
                console.error('Error ejecutando la consulta:', error);
                res.status(500).send('Error en el servidor');
                return;
            }
            
            results[index] = {
                nombre: categoria.nombre,
                count: result[0].count
            };

            if (results.length === queries.length) {
                res.json(results);
            }
        });
    });
});

// Obtener todos los productos
app.get('/productos', (req, res) => {
    const query = 'SELECT producto_id, nombre, precio, cantidad, usuario_id AS vendedor_id FROM producto';
    
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener los productos:', error);
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }
        res.json(results);
    });
});

// Productos por categoría
app.get('/productos-categoria', checkAuthenticated, (req, res) => {
    if (Object.keys(req.query).length === 0) return res.json({});
    const categoria = req.query.categoria;
    const categorias = ["CECyT 1", "CECyT 9", "CECyT 11"];

    if (!categorias.includes(categoria)) return res.json({});

    const queryForIdCategoria = 'SELECT categoria_id FROM categorias WHERE nombre = ?;';
    const resultsOfCategoria = connectionSync.query(queryForIdCategoria, [categoria]);
    const idCategoria = resultsOfCategoria[0].categoria_id;

    const queryForProducts = 'SELECT * FROM productos WHERE categoria_id = ?;';
    const resultOfProducts = connectionSync.query(queryForProducts, [idCategoria]);

    res.json(resultOfProducts);
});

// Mostrar imágenes
app.get('/showImage/:nombre', checkAuthenticated, (req, res) => {
    const nombreImagen = req.params.nombre;
    const files = fs.readdirSync('./uploads/');
    const imageExists = files.includes(nombreImagen);

    if (imageExists) {
        res.sendFile(path.join(__dirname, 'uploads', nombreImagen));
    } else {
        res.sendFile(path.join(__dirname, 'uploads', 'noImageFound.jpg'));
    }
});

/* ==================================================
   FUNCIONALIDAD DEL CARRITO
   ================================================== */

// Vista del carrito
app.get('/carrito-compra', checkAuthenticated, (req, res) => {
    res.render('carrito-compra.ejs');
});

// Obtener productos del carrito
app.get('/productos-carrito-compra', checkAuthenticated, (req, res) => {
    const queryToCheckUserID = 'SELECT usuario_id FROM usuarios WHERE correo = ?';
    const id_usuario_db = connectionSync.query(queryToCheckUserID, [currentMail]);
    const id_usuario = id_usuario_db[0].usuario_id;

    const queryCheckCarrito = 'SELECT * FROM carritos WHERE usuario_id = ?';
    const id_carrito_db = connectionSync.query(queryCheckCarrito, [id_usuario]);
    const id_carrito = id_carrito_db[0].carrito_id;

    const queryTraerDatosCarrito = 'SELECT * FROM elementos_carrito WHERE carrito_id = ?;';
    const elementosCarrito = connectionSync.query(queryTraerDatosCarrito, [id_carrito]);

    res.send(elementosCarrito);
});

// Agregar producto al carrito
app.post('/carrito-compra', checkAuthenticated, (req, res) => {
    const id_producto = req.body.producto_id;
    const queryForIdProducto = 'SELECT * FROM productos WHERE producto_id = ?;';
    const resultsOfProduct = connectionSync.query(queryForIdProducto, [id_producto]);
    const nuevoProducto = resultsOfProduct[0];

    const queryToCheckUserID = 'SELECT usuario_id FROM usuarios WHERE correo = ?';
    const id_usuario_db = connectionSync.query(queryToCheckUserID, [currentMail]);
    const id_usuario = id_usuario_db[0].usuario_id;

    const queryCheckCarrito = 'SELECT * FROM carritos WHERE usuario_id = ?';
    const existeCarrito = connectionSync.query(queryCheckCarrito, [id_usuario]);

    if (existeCarrito.length === 0) {
        const queryCreateCarrito = 'INSERT INTO carritos (usuario_id) VALUES (?);';
        connectionSync.query(queryCreateCarrito, [id_usuario]);

        const queryCheckIdCarrito = 'SELECT carrito_id FROM carritos WHERE usuario_id = ?;';
        const id_carrito_db = connectionSync.query(queryCheckIdCarrito, [id_usuario]);
        const carrito_id = id_carrito_db[0].carrito_id;

        const queryCreateElementosCarrito = 'INSERT INTO elementos_carrito(carrito_id, productos_comprados, precio_total) VALUES(?, \'[]\', 0);';
        connectionSync.query(queryCreateElementosCarrito, [carrito_id]);
    }

    const queryCheckIdCarrito = 'SELECT carrito_id FROM carritos WHERE usuario_id = ?;';
    const id_carrito_db = connectionSync.query(queryCheckIdCarrito, [id_usuario]);
    const carrito_id = id_carrito_db[0].carrito_id;

    const queryTraerDatosCarrito = 'SELECT * FROM elementos_carrito WHERE carrito_id = ?;';
    const elementosCarrito = connectionSync.query(queryTraerDatosCarrito, [carrito_id]);

    const elementoCarritoNuevo = elementosCarrito[0];
    const json_elemento_carrito = JSON.parse(elementoCarritoNuevo.productos_comprados);

    const sizeArray = json_elemento_carrito.length;
    json_elemento_carrito[sizeArray] = nuevoProducto;

    const nuevoPrecioTotal = elementoCarritoNuevo.precio_total + (nuevoProducto.precio * nuevoProducto.cantidad);

    const queryToUpdateCarrito = 'UPDATE elementos_carrito SET productos_comprados = ?, precio_total = ? WHERE carrito_id = ?;';
    connectionSync.query(queryToUpdateCarrito, [JSON.stringify(json_elemento_carrito), nuevoPrecioTotal, carrito_id]);

    res.redirect('/');
});

// Eliminar producto del carrito
app.delete('/carrito-compra/:id_producto', checkAuthenticated, (req, res) => {
    const id_producto_a_eliminar = parseInt(req.params.id_producto);
    const correo_usuario = currentMail;

    try {
        const queryUserId = 'SELECT usuario_id FROM usuarios WHERE correo = ?';
        const userResult = connectionSync.query(queryUserId, [correo_usuario]);

        if (userResult.length === 0) return res.status(404).send("Usuario no encontrado.");

        const id_usuario = userResult[0].usuario_id;

        const queryCarrito = `
            SELECT ec.carrito_id, ec.productos_comprados, ec.precio_total
            FROM carritos c
            INNER JOIN elementos_carrito ec ON c.carrito_id = ec.carrito_id
            WHERE c.usuario_id = ?`;
        const carritoResult = connectionSync.query(queryCarrito, [id_usuario]);

        if (carritoResult.length === 0) return res.status(404).send("Carrito no encontrado.");

        const carrito_id = carritoResult[0].carrito_id;
        let productos_comprados = JSON.parse(carritoResult[0].productos_comprados);
        let precio_total_actual = carritoResult[0].precio_total;

        const nuevosProductos = productos_comprados.filter(producto => {
            return producto.producto_id && producto.producto_id !== id_producto_a_eliminar;
        });

        if (nuevosProductos.length === productos_comprados.length) {
            return res.status(400).send("El producto no existe en el carrito.");
        }

        const nuevoPrecioTotal = nuevosProductos.reduce((total, producto) => {
            return total + (producto.precio * producto.cantidad);
        }, 0);

        const queryUpdateCarrito = `
            UPDATE elementos_carrito 
            SET productos_comprados = ?, precio_total = ? 
            WHERE carrito_id = ?`;
        connectionSync.query(queryUpdateCarrito, [JSON.stringify(nuevosProductos), nuevoPrecioTotal, carrito_id]);

        res.status(200).json({
            mensaje: "Producto eliminado correctamente.",
            nuevosProductos,
            nuevoPrecioTotal
        });

    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Vaciar carrito
app.delete('/vaciar-carrito', checkAuthenticated, (req, res) => {
    const queryToCheckUserID = 'SELECT usuario_id FROM usuarios WHERE correo = ?';
    const id_usuario_db = connectionSync.query(queryToCheckUserID, [currentMail]);
    const id_usuario = id_usuario_db[0].usuario_id;

    const queryCheckIdCarrito = 'SELECT carrito_id FROM carritos WHERE usuario_id = ?;';
    const id_carrito_db = connectionSync.query(queryCheckIdCarrito, [id_usuario]);
    const carrito_id = id_carrito_db[0].carrito_id;

    const queryVaciarCarrito = 'UPDATE elementos_carrito SET productos_comprados = ?, precio_total = ? WHERE carrito_id = ?;';
    connectionSync.query(queryVaciarCarrito, ['[]', 0, carrito_id]);

    res.json({ success: true, message: 'Carrito vaciado correctamente' });
});

/* ==================================================
   ENVÍO DE CORREOS ELECTRÓNICOS
   ================================================== */

app.post('/enviar-correo', (req, res) => {
    const { productos, total } = req.body;
    const correoUsuario = currentMail;

    let contenidoCorreo = '<h2>Resumen de tu compra</h2><ul>';
    productos.forEach(producto => {
        contenidoCorreo += `<li>${producto.nombre} - Cantidad: ${producto.cantidad}, Precio: $${producto.precio}</li>`;
    });
    contenidoCorreo += `</ul><p><strong>Total a pagar: $${total}</strong></p>`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correoUsuario,
        subject: 'Confirmación de compra',
        html: contenidoCorreo
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
            res.status(500).json({ success: false, message: 'Error al enviar el correo.' });
        } else {
            console.log('Correo enviado:', info.response);
            res.json({ success: true, message: 'Correo enviado exitosamente.' });
        }
    });
});

/* ==================================================
   RUTAS ADICIONALES
   ================================================== */

app.get("/graficas", checkAuthenticated, (req, res) => {
    res.render("graficas.ejs"); 
});

app.get("/admin", checkAuthenticated, (req, res) => {
    res.render("admin.ejs"); 
});

/* ==================================================
   INICIO DEL SERVIDOR
   ================================================== */
app.listen(3001, () => {
    console.log('Servidor corriendo en http://localhost:3001');
});