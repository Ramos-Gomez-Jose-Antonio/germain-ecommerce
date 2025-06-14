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
const crypto = require('crypto');
const sharp = require('sharp');

// Configuración de Passport
const passportConfig = require("./passport-config");
passportConfig.initialize(passport);

// Configuración de base de datos
const mysql = require("mysql2/promise");
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
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'images')));
app.use('/images/planteles', express.static(path.join(__dirname, 'images', 'planteles')));

// Configuración para evitar warning de listeners
process.setMaxListeners(0);

// Verificar/crear directorios necesarios
const requiredDirs = ['uploads', 'images'];
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directorio creado: ${dirPath}`);
        // Establecer permisos (Linux/Unix)
        fs.chmodSync(dirPath, 0o777);
    }
});

// Verificar imagen por defecto
const defaultAvatarPath = path.join(__dirname, 'images', 'default-avatar.png');
if (!fs.existsSync(defaultAvatarPath)) {
    console.error('Advertencia: No se encontró default-avatar.png en', defaultAvatarPath);
}

/* ==================================================
   CONFIGURACIÓN DE MULTER (SUBIDA DE ARCHIVOS)
   ================================================== */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            fs.chmodSync(uploadPath, 0o777); // Asegurar permisos
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log('Archivo recibido:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        // Validar tipos MIME específicos - CORREGIDO
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            console.error('Tipo de archivo no permitido:', file.mimetype);
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: JPG, JPEG, PNG, GIF, WEBP`), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Agregar esto en tu configuración de Multer (app.js)
const plantelesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'images', 'planteles');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            fs.chmodSync(uploadPath, 0o777);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Extraer número del nombre del plantel
        const nombrePlantel = req.body.nombre || '';
        const numeroPlantel = extraerNumeroPlantel(nombrePlantel);
        const extension = path.extname(file.originalname);
        
        // Si se puede extraer número, usar patrón cX.ext, sino nombre generado
        const fileName = numeroPlantel ? 
            `c${numeroPlantel}${extension}` : 
            `plantel-${Date.now()}${extension}`;
        
        cb(null, fileName);
    }
});

const uploadPlanteles = multer({
    storage: plantelesStorage,
    fileFilter: function (req, file, cb) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/* ==================================================
   FUNCIÓN AUXILIAR PARA PROCESAR IMÁGENES
   ================================================== */

async function processImage(inputPath, outputPath) {
    try {
        console.log('Procesando imagen:', { inputPath, outputPath });
        
        // Verificar que el archivo de entrada existe
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Archivo de entrada no existe: ${inputPath}`);
        }
        
        // Asegurar que el directorio de salida existe
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            fs.chmodSync(outputDir, 0o777); // Añadir permisos
            console.log('Directorio de salida creado:', outputDir);
        }

        // Procesar con Sharp
        await sharp(inputPath)
            .resize(500, 500, { 
                fit: 'cover',
                position: 'center'
            })
            .toFormat('png')
            .toFile(outputPath);
        
        console.log('Imagen procesada exitosamente con Sharp');
        
        return true;
    } catch (error) {
        console.error('Error procesando imagen:', error);
        throw error;
    }
}

/* ==================================================
   CONEXIÓN A BASE DE DATOS
   ================================================== */
// Conexión principal (con promesas)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'germainbd'
});

// Verificación de conexión
db.getConnection()
    .then(connection => {
        console.log('Conectado a la base de datos MySQL...');
        connection.release();
    })
    .catch(err => {
        console.error('Error conectando a la base de datos:', err.message);
        process.exit(1);
    });

// Conexión síncrona para operaciones específicas (si realmente la necesitas)
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
let currentMail = ""; // Almacena el email del usuario actual

/* ==================================================
   FUNCIONES DE AUTENTICACIÓN
   ================================================== */
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        // Almacenar el correo del usuario para uso en otras partes
        if (req.user && req.user.email) {
            currentMail = req.user.email;
        }
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

function checkAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.rol && req.user.rol.toLowerCase() === "administrador") {
        return next();
    }
    res.status(403).send("Acceso no autorizado");
}
app.use(express.static('public'));  
//añadido xq si 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ==================================================
   RUTAS DE AUTENTICACIÓN
   ================================================== */

// Ruta principal - Página de inicio con productos desde BD
app.get('/', checkAuthenticated, async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const limit       = 12;
  const offset      = (currentPage - 1) * limit;

  // Nuevo: capturamos el término de búsqueda
  const search = req.query.search ? req.query.search.trim() : '';

  try {
    let totalQuery, rowsQuery, paramsCount, paramsRows;

    if (search) {
      // Cuando hay búsqueda, filtramos por nombre, categoría o plantel
      const like = `%${search}%`;
      paramsCount = [like, like, like];
      paramsRows  = [like, like, like, limit, offset];

      totalQuery = `
        SELECT COUNT(*) AS total
        FROM producto p
        JOIN categoria c ON p.categoria_id = c.categoria_id
        JOIN plantel   pl ON p.plantel_id   = pl.plantel_id
        WHERE p.nombre       LIKE ?
           OR c.nombre       LIKE ?
           OR pl.nombre      LIKE ?
      `;

      rowsQuery = `
        SELECT
          p.*,
          c.nombre    AS categoria_nombre,
          pl.nombre   AS plantel_nombre
        FROM producto p
        JOIN categoria c ON p.categoria_id = c.categoria_id
        JOIN plantel   pl ON p.plantel_id   = pl.plantel_id
        WHERE p.nombre       LIKE ?
           OR c.nombre       LIKE ?
           OR pl.nombre      LIKE ?
        ORDER BY p.fecha_creacion DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      // Sin búsqueda, igual que antes
      paramsCount = [];
      paramsRows  = [limit, offset];

      totalQuery = `SELECT COUNT(*) AS total FROM producto`;
      rowsQuery  = `
        SELECT
          p.*,
          c.nombre    AS categoria_nombre,
          pl.nombre   AS plantel_nombre
        FROM producto p
        JOIN categoria c ON p.categoria_id = c.categoria_id
        JOIN plantel   pl ON p.plantel_id   = pl.plantel_id
        ORDER BY p.fecha_creacion DESC
        LIMIT ? OFFSET ?
      `;
    }

    // Ejecutamos conteo
    const [[{ total }]] = await db.query(totalQuery, paramsCount);
    const totalPages    = Math.ceil(total / limit);

    // Ejecutamos consulta de filas
    const [productos]   = await db.query(rowsQuery, paramsRows);

    res.render('index.ejs', {
      name:        req.user.name,
      productos,
      currentPage,
      totalPages,
      search      // pasamos también la búsqueda a la vista
    });
  } catch (err) {
    console.error(err);
    res.render('index.ejs', {
      name: req.user.name,
      productos: [],
      currentPage: 1,
      totalPages: 1,
      search: ''
    });
  }
});

app.get('/landingpg', async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
        const [productos] = await db.query('SELECT COUNT(*) AS total FROM producto');
        const [planteles] = await db.query('SELECT COUNT(*) AS total FROM plantel');

        res.render('landingpg', {
            usuarios: usuarios[0].total,
            productos: productos[0].total,
            planteles: planteles[0].total
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.render('landingpg', {
            usuarios: 0,
            productos: 0,
            planteles: 0
        });
    }
});

// Login
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
});

 app.post("/login", checkNotAuthenticated, (req, res, next) => {
     passport.authenticate("local", (err, user, info) => {
         if (err) return next(err);
         if (!user) {
             req.flash('error', info.message || 'Credenciales inválidas');
             return res.redirect("/login");
         }

         if (user.verificado !== 1) {
             req.flash('error', 'Por favor verifica tu cuenta de correo antes de iniciar sesión');
             return res.redirect("/login");
         }

         req.logIn(user, (err) => {
             if (err) return next(err);
             
            console.log("Usuario conectado:", user.correo);
            currentMail = user.correo;
            console.log("Usuario conectado:", user.correo);
            // Guarda todo el objeto user en la sesión para poder leerlo luego
               req.session.user = user;

             if (user.rol && user.rol.toLowerCase() === "administrador") {
                 return res.redirect("/admin");
             } else {
                 return res.redirect("/");
             }
         });
     })(req, res, next);
 });

// Registro
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register', { error: null, email: '', user: { email: '' } });
});

app.post('/register', checkNotAuthenticated, upload.single('profilePhoto'), async (req, res) => {
    try {
        const { nombre, apellidoPaterno, apellidoMaterno, username, telefono, email, password, confirmPassword, rol, adminPassword } = req.body;

        console.log('Datos de registro recibidos:', {
            email,
            hasFile: !!req.file,
            fileDetails: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            } : null
        });

        // Validar contraseñas
        if (password !== confirmPassword) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.render('register', { 
                error: 'Las contraseñas no coinciden',
                email: email,
                user: { nombre, apellidoPaterno, apellidoMaterno, email, telefono, username }
            });
        }

        // Normalizar rol
        let normalizedRol = 'comprador';
        if (rol && ['proveedor', 'comprador', 'administrador'].includes(rol.toLowerCase())) {
            normalizedRol = rol.toLowerCase();
        }

        // Validar contraseña de administrador
        if (normalizedRol === 'administrador' && adminPassword !== 'GeRmAiN404$') {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.render('register', { 
                error: 'Contraseña de administrador incorrecta',
                email: email,
                user: { nombre, apellidoPaterno, apellidoMaterno, email, telefono, username }
            });
        }


        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generar nombre final de la imagen antes del INSERT
            let imagen_perfil = 'default-profile.png';
            if (req.file) {
                imagen_perfil = `user-${Date.now()}${path.extname(req.file.originalname)}`;
            }

            // Insertar usuario con imagen_perfil
            const [result] = await connection.execute(
                'INSERT INTO usuarios (usuario, nombres, apellidopat, apellidomat, correo, telefono, contra, rol, verificado, imagen_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [username, nombre, apellidoPaterno, apellidoMaterno, email, telefono, hashedPassword, normalizedRol, 0, imagen_perfil]
            );

            const userId = result.insertId;

            // Si se subió imagen, moverla a la carpeta final con el nombre final
            if (req.file) {
                const tempPath = req.file.path;
                const finalPath = path.join(__dirname, 'uploads', imagen_perfil);
                try {
                    await fs.promises.rename(tempPath, finalPath);
                } catch (imageError) {
                    console.error('Error moviendo imagen de perfil:', imageError);
                    imagen_perfil = 'default-profile.png'; // En caso de error, usar default
                    await connection.execute(
                        'UPDATE usuarios SET imagen_perfil = ? WHERE usuario_id = ?',
                        [imagen_perfil, userId]
                    );
                }
            }

            // Enviar correo de verificación
            const token = crypto.randomBytes(20).toString('hex');
            const verificationURL = `http://${req.headers.host}/verify-email?email=${encodeURIComponent(email)}&token=${token}`;

            await transporter.sendMail({
                from: `"idcas404@gmail.com" <${process.env.EMAIL_USER}>`, 
                to: email, 
                subject: 'Verifica tu cuenta en Germain', 
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #FFFFFF;">
                        <div style="background-color: #4A1F43; padding: 20px; text-align: center;">
                            <img src="http://${req.headers.host}/germainsitio.png" alt="Germain Logo" style="height: 50px;">
                        </div>
                        <div style="padding: 30px; background-color: #FFFFFF;">
                            <h2 style="color: #4A1F43; margin-top: 0; text-align: center;">¡Gracias por registrarte!</h2>
                            <p style="color: #333; line-height: 1.6; text-align: center;">Por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationURL}" style="background-color: #4A1F43; color: #FFFFFF; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Verificar mi cuenta</a>
                            </div>
                            <p style="color: #666; font-size: 14px; text-align: center;">Si no solicitaste este registro, por favor ignora este mensaje.</p>
                        </div>
                    </div>
                `
            });

            await connection.commit();
            console.log('Usuario registrado exitosamente:', { userId, email, imagen: imagen_perfil });
            res.redirect('/urlToken');

        } catch (err) {
            await connection.rollback();
            console.error('Error durante el registro:', err);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            let errorMessage = 'Error en el servidor';
            if (err.code === 'ER_DUP_ENTRY') {
                errorMessage = 'El correo o nombre de usuario ya está registrado';
            }

            return res.render('register', { 
                error: errorMessage,
                email: email,
                user: { nombre, apellidoPaterno, apellidoMaterno, email, telefono, username }
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error en el registro:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.render('register', { 
            error: 'Error en el servidor',
            email: req.body.email,
            user: { 
                nombre: req.body.nombre,
                apellidoPaterno: req.body.apellidoPaterno,
                apellidoMaterno: req.body.apellidoMaterno,
                email: req.body.email,
                telefono: req.body.telefono,
                username: req.body.username
            }
        });
    }
});

app.get('/urlToken', checkNotAuthenticated, (req, res) => {
    res.render("urlToken.ejs", {
        message: "Se ha enviado un correo de verificación a tu dirección de email. Por favor verifica tu cuenta para poder iniciar sesión."
    });
});

// Verificación de email
app.get('/verify-email', async (req, res) => {
    try {
        const { email, token } = req.query;
        
        if (!email || !token) {
            console.error('Enlace de verificación incompleto');
            req.flash('error', 'Enlace de verificación incompleto. Por favor utiliza el enlace completo que te enviamos por correo.');
            return res.redirect('/register');
        }

        // Verificación simple - solo actualizamos el campo verificado
        const [result] = await db.execute(
            'UPDATE usuarios SET verificado = 1 WHERE correo = ? AND verificado = 0',
            [email]
        );

        if (result.affectedRows === 0) {
            console.error('Correo ya verificado o no existe:', email);
            req.flash('error', 'El correo ya fue verificado anteriormente o no existe.');
            return res.redirect('/register');
        }

        // CAMBIO: Redirigir a verification en lugar de login
        req.flash('success', '¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.');
        res.redirect('/verification');

    } catch (err) {
        console.error('Error en la verificación:', err);
        req.flash('error', 'Error en el servidor al verificar tu cuenta. Por favor intenta nuevamente más tarde.');
        res.redirect('/register');
    }
});

// Logout
app.delete("/logout", (req, res) => {
    currentMail = "";
    req.logout(req.user, err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("No se pudo cerrar la sesión.");
        }
        res.redirect("/");
    });
});

app.get('/salida', (req, res) => {
    currentMail = "";
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("No se pudo cerrar la sesión.");
        }
        res.redirect('/login');
    });
});

/* ==================================================
   RUTAS DE USUARIO MEJORADAS
   ================================================== */

// Ruta para editar perfil (actualizada)
app.get('/editar-perfil', checkAuthenticated, async (req, res) => {
   try {
       const [rows] = await db.execute(
           'SELECT usuario_id, usuario, nombres, apellidopat, apellidomat, correo, telefono, rol, imagen_perfil FROM usuarios WHERE correo = ?',
           [currentMail]
       );
      
       if (rows.length === 0) {
           console.error('Usuario no encontrado al intentar editar perfil');
           req.flash('error', 'No se pudo cargar la información del perfil');
           return res.redirect('/perfil');
       }
      
       res.render('editar-perfil.ejs', {
           user: rows[0],
           messages: req.flash()
       });
   } catch (err) {
       console.error('Error al cargar edición de perfil:', err);
       req.flash('error', 'Error al cargar el formulario de edición');
       res.redirect('/perfil');
   }
});

app.post('/editar-perfil', checkAuthenticated, upload.single('imagen_perfil'), async (req, res) => {
    const { usuario, nombres, apellidopat, apellidomat, telefono, correo, newPassword, confirmPassword, eliminarImagen } = req.body;
    const imagen = req.file;
    
    console.log('Datos de edición recibidos:', {
        usuario,
        eliminarImagen,
        hasFile: !!imagen,
        fileDetails: imagen ? {
            originalname: imagen.originalname,
            mimetype: imagen.mimetype,
            size: imagen.size,
            path: imagen.path
        } : null
    });

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Obtener usuario actual
            const [rows] = await connection.execute(
                'SELECT usuario_id, usuario, nombres, apellidopat, apellidomat, correo, telefono, contra, imagen_perfil FROM usuarios WHERE correo = ?',
                [currentMail]
            );

            if (rows.length === 0) {
                console.error('Usuario no encontrado al editar perfil');
                req.flash('error', 'Usuario no encontrado');
                return res.redirect('/editar-perfil');
            }

            const usuarioActual = rows[0];
            const updates = [];
            const params = [];

            // Validar contraseñas
            if (newPassword || confirmPassword) {
                if (!newPassword || !confirmPassword) {
                    if (imagen && fs.existsSync(imagen.path)) {
                        fs.unlinkSync(imagen.path);
                    }
                    req.flash('error', 'Debes completar ambos campos de contraseña si deseas cambiarla');
                    return res.redirect('/editar-perfil');
                }

                if (newPassword !== confirmPassword) {
                    if (imagen && fs.existsSync(imagen.path)) {
                        fs.unlinkSync(imagen.path);
                    }
                    req.flash('error', 'Las nuevas contraseñas no coinciden');
                    return res.redirect('/editar-perfil');
                }

                if (newPassword.length < 6) {
                    if (imagen && fs.existsSync(imagen.path)) {
                        fs.unlinkSync(imagen.path);
                    }
                    req.flash('error', 'La nueva contraseña debe tener al menos 6 caracteres');
                    return res.redirect('/editar-perfil');
                }
            }

            // Manejar eliminación de imagen
            if (eliminarImagen === 'true') {
                console.log('Eliminando imagen actual:', usuarioActual.imagen_perfil);
                
                if (usuarioActual.imagen_perfil && !usuarioActual.imagen_perfil.includes('default-avatar')) {
                    try {
                        const oldImagePath = path.join(__dirname, 'uploads', usuarioActual.imagen_perfil);
                        
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                            console.log('Imagen eliminada:', oldImagePath);
                        }
                    } catch (unlinkErr) {
                        console.error('Error eliminando imagen anterior:', unlinkErr);
                    }
                }
                
                updates.push('imagen_perfil = ?');
                params.push(null);
            }
            // Manejar imagen nueva - CORREGIDO
            else if (imagen) {
                try {
                    console.log('Procesando nueva imagen...');
                    
                    // SIEMPRE GUARDAR COMO PNG EN UPLOADS
                    const imageFilename = `user-${usuarioActual.usuario_id}.png`;
                    const imagePath = path.join(__dirname, 'uploads', imageFilename);
                    
                    console.log('Detalles de procesamiento:', {
                        tempPath: imagen.path,
                        finalPath: imagePath,
                        tempExists: fs.existsSync(imagen.path)
                    });

                    // Usar la función mejorada de procesamiento
                    await processImage(imagen.path, imagePath);
                    
                    // Eliminar archivo temporal
                    if (fs.existsSync(imagen.path)) {
                        fs.unlinkSync(imagen.path);
                    }
                    
                    updates.push('imagen_perfil = ?');
                    params.push(imageFilename);
                    
                    console.log('Nueva imagen procesada:', imageFilename);
                    
                    // Eliminar imagen anterior si existe y es diferente
                    if (usuarioActual.imagen_perfil && 
                        !usuarioActual.imagen_perfil.includes('default-avatar') && 
                        usuarioActual.imagen_perfil !== imageFilename) {
                        try {
                            const oldImagePath = path.join(__dirname, 'uploads', usuarioActual.imagen_perfil);
                            
                            if (fs.existsSync(oldImagePath)) {
                                fs.unlinkSync(oldImagePath);
                                console.log('Imagen anterior eliminada:', oldImagePath);
                            }
                        } catch (unlinkErr) {
                            console.error('Error eliminando imagen anterior:', unlinkErr);
                        }
                    }
                    
                } catch (imageError) {
                    console.error('Error procesando imagen en edición:', imageError);
                    
                    // Limpiar archivo temporal
                    if (imagen && fs.existsSync(imagen.path)) {
                        try {
                            fs.unlinkSync(imagen.path);
                        } catch (unlinkErr) {
                            console.error('Error eliminando archivo temporal:', unlinkErr);
                        }
                    }
                    
                    throw new Error('Error al procesar la imagen. Verifica que el archivo sea una imagen válida.');
                }
            }

            // Actualizar otros campos
            if (usuario && usuario !== usuarioActual.usuario) {
                updates.push('usuario = ?');
                params.push(usuario);
            }

            if (nombres && nombres !== usuarioActual.nombres) {
                updates.push('nombres = ?');
                params.push(nombres);
            }

            if (apellidopat && apellidopat !== usuarioActual.apellidopat) {
                updates.push('apellidopat = ?');
                params.push(apellidopat);
            }

            if (apellidomat && apellidomat !== usuarioActual.apellidomat) {
                updates.push('apellidomat = ?');
                params.push(apellidomat);
            }

            if (telefono && telefono !== usuarioActual.telefono) {
                updates.push('telefono = ?');
                params.push(telefono);
            }

            // Manejar cambio de contraseña
            if (newPassword && newPassword.trim() !== '') {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                updates.push('contra = ?');
                params.push(hashedPassword);
            }

            // Ejecutar actualización
            if (updates.length > 0) {
                const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE usuario_id = ?`;
                params.push(usuarioActual.usuario_id);
                
                console.log('Ejecutando actualización:', { query, paramsCount: params.length });
                await connection.execute(query, params);
            }

            await connection.commit();
            console.log('Perfil actualizado correctamente');

            req.flash('success', 'Perfil actualizado correctamente');
            return res.redirect('/perfil');

        } catch (err) {
            await connection.rollback();
            console.error('Error en transacción de edición:', err);
            
            // Limpiar archivo temporal si existe
            if (imagen && fs.existsSync(imagen.path)) {
                try {
                    fs.unlinkSync(imagen.path);
                } catch (unlinkErr) {
                    console.error('Error eliminando archivo temporal:', unlinkErr);
                }
            }

            let errorMessage = 'Error al actualizar el perfil';
            if (err.code === 'ER_DUP_ENTRY') {
                if (err.sqlMessage && err.sqlMessage.includes('usuario')) {
                    errorMessage = 'El nombre de usuario ya está en uso';
                }
            } else if (err.message && err.message.includes('imagen')) {
                errorMessage = err.message;
            }

            req.flash('error', errorMessage);
            return res.redirect('/editar-perfil');
            
        } finally {
            connection.release();
        }
        
    } catch (err) {
        console.error('Error general en edición de perfil:', err);
        
        // Limpiar archivo temporal
        if (imagen && fs.existsSync(imagen.path)) {
            try {
                fs.unlinkSync(imagen.path);
            } catch (unlinkErr) {
                console.error('Error eliminando archivo temporal:', unlinkErr);
            }
        }
        
        req.flash('error', 'Error en el servidor');
        return res.redirect('/editar-perfil');
    }
});

// Mostrar imágenes (versión mejorada)
app.get('/showImage/:nombre', (req, res) => {
    const nombreImagen = req.params.nombre;
    
    if (!nombreImagen || nombreImagen === 'undefined' || nombreImagen === 'null') {
        return servirImagenPorDefecto(res);
    }
    
    // Buscar en uploads primero
    const uploadsPath = path.join(__dirname, 'uploads', nombreImagen);
    if (fs.existsSync(uploadsPath)) {
        return res.sendFile(uploadsPath);
    }
    
    // Buscar en images si no se encuentra en uploads
    const imagesPath = path.join(__dirname, 'images', nombreImagen);
    if (fs.existsSync(imagesPath)) {
        return res.sendFile(imagesPath);
    }
    
    // Servir imagen por defecto si no se encuentra
    return servirImagenPorDefecto(res);
});

// Función auxiliar para servir imagen por defecto
function servirImagenPorDefecto(res) {
    const defaultImagePath = path.join(__dirname, 'images', 'default-avatar.png');
    
    if (fs.existsSync(defaultImagePath)) {
        console.log('Sirviendo imagen por defecto desde:', defaultImagePath);
        return res.sendFile(defaultImagePath);
    } else {
        console.log('Imagen por defecto no encontrada, generando SVG placeholder');
        // Si no existe la imagen por defecto, servir un placeholder SVG
        const placeholderSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <rect width="200" height="200" fill="#EAEAEA"/>
                <circle cx="100" cy="75" r="30" fill="#4A1F43"/>
                <path d="M50 150 Q100 120 150 150 L150 200 L50 200 Z" fill="#4A1F43"/>
                <text x="50%" y="185" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">Sin imagen</text>
            </svg>
        `;
        return res.type('svg').send(placeholderSvg);
    }
}

/* ==================================================
   RUTAS PARA RESTABLECIMIENTO DE CONTRASEÑA
   ================================================== */

// Generar token y enviar correo
app.post('/forgot-password', checkNotAuthenticated, async (req, res) => {
    const { email } = req.body;
    
    try {
        // Verificar si el correo existe
        const [user] = await db.execute('SELECT * FROM usuarios WHERE correo = ?', [email]);
        
        if (user.length === 0) {
            req.flash('error', 'No existe una cuenta asociada a este correo electrónico');
            return res.redirect('/forgot-password');
        }
        
        const userId = user[0].usuario_id;
        
        // Generar token único
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora de expiración
        
        // Guardar token en la base de datos
        await db.execute(
            'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
        
        // Crear enlace de restablecimiento
        const resetLink = `http://${req.headers.host}/reset-password?token=${token}`;
        
        // Configurar correo electrónico con colores corregidos
        const mailOptions = {
            from: `"Soporte Germain" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Restablecimiento de contraseña - Germain',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #FFFFFF;">
                    <div style="background-color: #4A1F43; padding: 20px; text-align: center;">
                        <img src="http://${req.headers.host}/germainsitio.png" alt="Germain Logo" style="height: 50px;">
                    </div>
                    <div style="padding: 30px; background-color: #FFFFFF;">
                        <h2 style="color: #4A1F43; margin-top: 0;">Restablecer contraseña</h2>
                        <p style="color: #555; line-height: 1.6;">Hemos recibido una solicitud para restablecer tu contraseña.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #4A1F43; color: #FFFFFF; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                                Restablecer contraseña
                            </a>
                        </div>
                        
                        <p style="color: #555; line-height: 1.6;">Si no solicitaste este correo, por favor ignóralo. El enlace expirará en 1 hora.</p>
                    </div>
                </div>
            `
        };

        // Enviar el correo
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar correo de restablecimiento:', error);
                req.flash('error', 'Error al enviar el correo. Por favor intenta nuevamente.');
                return res.redirect('/forgot-password');
            }
            
            req.flash('success', 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
            res.redirect('/forgot-password');
        });
        
    } catch (err) {
        console.error('Error en el restablecimiento de contraseña:', err);
        req.flash('error', 'Error en el servidor. Por favor intenta nuevamente.');
        res.redirect('/forgot-password');
    }
});
   

// Mostrar formulario para nueva contraseña
app.get('/reset-password', checkNotAuthenticated, async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        req.flash('error', 'Token de restablecimiento no proporcionado');
        return res.redirect('/forgot-password');
    }
    
    try {
        // Verificar token
        const [tokenData] = await db.execute(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        
        if (tokenData.length === 0) {
            req.flash('error', 'El enlace de restablecimiento es inválido o ha expirado');
            return res.redirect('/forgot-password');
        }
        
        res.render('reset-password.ejs', { token, messages: req.flash() });
        
    } catch (err) {
        console.error('Error al verificar token:', err);
        req.flash('error', 'Error al procesar la solicitud');
        res.redirect('/forgot-password');
    }
});

// Procesar nueva contraseña
app.post('/reset-password', checkNotAuthenticated, async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    
    try {
        // Validar contraseñas
        if (password !== confirmPassword) {
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect(`/reset-password?token=${token}`);
        }
        
        // Verificar token
        const [tokenData] = await db.execute(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        
        if (tokenData.length === 0) {
            req.flash('error', 'El enlace de restablecimiento es inválido o ha expirado');
            return res.redirect('/forgot-password');
        }
        
        const userId = tokenData[0].usuario_id;
        
        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Actualizar contraseña del usuario
        await db.execute(
            'UPDATE usuarios SET contra = ? WHERE usuario_id = ?',
            [hashedPassword, userId]
        );
        
        // Marcar token como usado
        await db.execute(
            'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
            [token]
        );
        
        req.flash('success', 'Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión.');
        res.redirect('/login');
        
    } catch (err) {
        console.error('Error al restablecer contraseña:', err);
        req.flash('error', 'Error al restablecer la contraseña');
        res.redirect(`/reset-password?token=${token}`);
    }
});

// Obtener datos del usuario para el perfil
app.get('/api/usuario', checkAuthenticated, async (req, res) => {
    try {
        const [user] = await db.execute(
            'SELECT usuario_id, usuario, nombres, apellidopat, apellidomat, correo, telefono, rol, imagen_perfil FROM usuarios WHERE correo = ?',
            [currentMail]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(user[0]);
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
});

// Ruta para obtener el ID del usuario logueado
app.get('/api/usuario/actual', checkAuthenticated, async (req, res) => {
    try {
        if (!req.user || !req.user.correo) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const [user] = await db.execute(
            'SELECT usuario_id FROM usuarios WHERE correo = ?',
            [req.user.correo]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ usuarioId: user[0].usuario_id }); // Devuelve el ID
    } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        res.status(500).json({ error: 'Error al obtener ID de usuario' });
    }
}); 

//api detalles
app.get('/api/usuario/detalle', checkAuthenticated, async (req, res) => {
    try {

        console.log('Usuario en sesión:', req.user); 
        if (!req.user || !req.user.correo) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const [rows] = await db.execute(
            'SELECT usuario_id, nombres, apellidopat, apellidomat, correo, imagen_perfil FROM usuarios WHERE correo = ?',
            [req.user.correo]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o no activo' });
        }

        res.json(rows[0]); // Devuelve todos los datos del usuario
    } catch (error) {
        console.error('Error al obtener detalles del usuario:', error);
        res.status(500).json({ error: 'Error al obtener detalles del usuario' });
    }
});

/* ==================================================
   RUTAS DE PRODUCTOS
   ================================================== */
// Vista para agregar producto
app.get('/agregar-producto', checkAuthenticated, async (req, res) => {
    try {
        const [planteles] = await db.execute('SELECT DISTINCT plantel_id, nombre FROM plantel');
        res.render('agregar-producto.ejs', { planteles });
    } catch (err) {
        console.error('Error al obtener planteles:', err);
        res.status(500).send('Error al cargar la página');
    }
});

// API para cargar categorías según plantel
app.get('/api/planteles', async (req, res) => {
    const [planteles] = await db.execute('SELECT DISTINCT plantel_id, nombre FROM plantel');
    res.json(planteles);
});

app.get('/api/catalogos/:plantelId', async (req, res) => {
    const { plantelId } = req.params;

    try {
        const [rows] = await db.query(
            'SELECT categoria_id AS catalogo_id, nombre FROM categoria WHERE plantel_id = ?',
            [plantelId]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

app.post('/agregar-producto', checkAuthenticated, upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'imagen2', maxCount: 1 },
    { name: 'imagen3', maxCount: 1 }
]), async (req, res) => {
    try {
        const { nombre, descripcion, cantidad, precio, catalogo, plantel } = req.body;
        const usuario_id = req.user.usuario_id;
        const fecha = new Date();
        const fecha_creacion = fecha.getFullYear() + '-' +
        String(fecha.getMonth() + 1).padStart(2, '0') + '-' +
        String(fecha.getDate()).padStart(2, '0');


        
        const imagen1 = req.files['imagen'] ? req.files['imagen'][0].filename : null;
        const imagen2 = req.files['imagen2'] ? req.files['imagen2'][0].filename : null;
        const imagen3 = req.files['imagen3'] ? req.files['imagen3'][0].filename : null;

        if (!imagen1) {
            return res.status(400).send("Falta la imagen principal");
        }

        
        const categoriaId = parseInt(catalogo);
        const plantelId = parseInt(plantel);

        if (isNaN(categoriaId)) {
            return res.status(400).send("Catálogo inválido");
        }

        if (isNaN(plantelId)) {
            return res.status(400).send("Plantel inválido");
        }

        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        console.log("Fecha de creación:", fecha_creacion);

        
        const [result] = await db.query(`
            INSERT INTO producto (
                nombre, descripcion, cantidad, precio,
                nombre_imagen, nombre_imagen2, nombre_imagen3,
                usuario_id, categoria_id, plantel_id, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre, descripcion, parseInt(cantidad), parseFloat(precio),
            imagen1, imagen2, imagen3,
            usuario_id, categoriaId, plantelId, fecha_creacion
        ]);

        console.log("Producto insertado con ID:", result.insertId);
        res.redirect('/productos');
    } catch (error) {
        console.error("Error al guardar producto:", error);
        res.status(500).send("Error al guardar producto.");
    }
});


//vista de editar producto
app.get('/editar-producto', checkAuthenticated, async (req, res) => {
    try {
        const productoId = req.query.id;
        if (!productoId) {
            return res.status(400).send("ID de producto no proporcionado.");
        }

        const [[producto]] = await db.query('SELECT * FROM producto WHERE producto_id = ?', [productoId]);
        if (!producto) {
            return res.status(404).send("Producto no encontrado.");
        }

        const [categorias] = await db.execute('SELECT categoria_id, nombre FROM categoria');

        // Eliminar planteles duplicados
        const [plantelesRaw] = await db.query('SELECT plantel_id, nombre FROM plantel');
        const planteles = Array.from(new Map(plantelesRaw.map(p => [p.plantel_id, p])).values());

        res.render('editar-producto.ejs', {
            producto,
            categorias,
            planteles
        });
    } catch (err) {
        console.error('Error al cargar el producto:', err);
        res.status(500).send('Error al cargar la página');
    }
});

app.post('/actualizar-producto', upload.fields([
    { name: 'imagen' },
    { name: 'imagen2' },
    { name: 'imagen3' }
]), async (req, res) => {
    const productoId = req.query.id;
    const {
        nombre, descripcion, precio, cantidad,
        catalogo, plantel
    } = req.body;

    try {
        
        const [[productoActual]] = await db.query('SELECT * FROM producto WHERE producto_id = ?', [productoId]);

        const nombre_imagen = req.files['imagen'] ? req.files['imagen'][0].filename : productoActual.nombre_imagen;
        const nombre_imagen2 = req.files['imagen2'] ? req.files['imagen2'][0].filename : productoActual.nombre_imagen2;
        const nombre_imagen3 = req.files['imagen3'] ? req.files['imagen3'][0].filename : productoActual.nombre_imagen3;

        await db.query(`
            UPDATE producto
            SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?, 
                categoria_id = ?, plantel_id = ?, 
                nombre_imagen = ?, nombre_imagen2 = ?, nombre_imagen3 = ?
            WHERE producto_id = ?
        `, [nombre, descripcion, precio, cantidad, catalogo, plantel, nombre_imagen, nombre_imagen2, nombre_imagen3, productoId]);

        
        console.log(`Producto ${productoId} actualizado correctamente con los siguientes datos:`, {
            nombre,
            descripcion,
            precio,
            cantidad,
            categoria_id: catalogo,
            plantel_id: plantel,
            nombre_imagen,
            nombre_imagen2,
            nombre_imagen3
        });
        
        console.log('🧾 Archivos subidos:', req.files);


        res.redirect('/productos'); 
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).send('Error actualizando producto');
    }
});

// Ruta para obtener publicaciones del usuario (con filtros)
app.get('/api/publicaciones/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { fechaInicio, fechaFin, plantelId, categoriaId } = req.query;


        let query = `
            SELECT 
                p.producto_id AS id,
                p.nombre AS producto,
                pl.nombre AS plantel,
                c.nombre AS catalogo,
                p.cantidad,
                p.precio AS costo,
                DATE(p.fecha_creacion) AS fecha
            FROM producto p
            JOIN categoria c ON p.categoria_id = c.categoria_id
            JOIN plantel pl ON c.plantel_id = pl.plantel_id
            WHERE p.usuario_id = ?
        `;
        const params = [usuarioId];

        if (fechaInicio) {
            query += ' AND p.fecha_creacion >= ?';
            params.push(fechaInicio);
        }
        if (fechaFin) {
            query += ' AND p.fecha_creacion <= ?';
            params.push(fechaFin);
        }
        if (plantelId) {
            query += ' AND pl.plantel_id = ?';
            params.push(plantelId);
        }
        if (categoriaId) {
            query += ' AND c.categoria_id = ?'; 
            params.push(categoriaId);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/publicaciones/:id', checkAuthenticated, async (req, res) => {
    try {
        const productoId = req.params.id;
        const usuarioId = req.user.usuario_id;

        // Verificar que el producto pertenece al usuario
        const [producto] = await db.execute(
            'SELECT usuario_id FROM producto WHERE producto_id = ?',
            [productoId]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (producto[0].usuario_id !== usuarioId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' });
        }

        // Eliminar el producto
        await db.execute(
            'DELETE FROM producto WHERE producto_id = ?',
            [productoId]
        );

        res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Obtener todos los planteles
app.get('/api/planteles', async (req, res) => {
    const [rows] = await pool.query('SELECT id, nombre FROM plantel');
    res.json(rows);
});

// Obtener categorías por plantel
app.get('/api/categorias', async (req, res) => {
    const { plantelId } = req.query;
    if (!plantelId) return res.status(400).json({ error: 'plantelId es requerido' });

    const [rows] = await pool.query('SELECT categoria_id, nombre FROM categoria WHERE plantel_id = ?', [plantelId]);
    res.json(rows);
});

// Rutas de categorías y páginas
app.get('/cereales', checkAuthenticated, (req, res) => res.render('cereales.ejs'));
app.get('/conocenos', checkAuthenticated, (req, res) => res.render('conocenos.ejs'));
app.get('/almacen', checkAuthenticated, (req, res) => res.render('almacen.ejs'));
app.get('/planteles', checkAuthenticated, (req, res) => res.render('planteles.ejs'));
app.get('/detalles', checkAuthenticated, (req, res) => res.render('detallesentrega.ejs'));
app.get('/terycon', checkAuthenticated, (req, res) => res.render('terminoscondiciones.ejs'));
app.get('/pprivacidad', checkAuthenticated, (req, res) => res.render('pprivacidad.ejs'));
app.get('/pagos', checkAuthenticated, (req, res) => res.render('pagos.ejs'));
app.get('/historial-compras', checkAuthenticated, (req, res) => res.render('historialcompras.ejs'));
app.get('/dashboard', checkAuthenticated, (req, res) => res.render('dashboard.ejs'));
app.get('/productos', checkAuthenticated, (req, res) => res.render('productos.ejs'));
app.get('/producto', checkAuthenticated, (req, res) => res.render('producto.ejs'));
app.get('/hp-admin', checkAuthenticated, (req, res) => res.render('hp-admin.ejs'));
app.get('/verification', (req, res) => {res.render('verification.ejs', {messages: req.flash() });
});
app.get('/forgot-password', checkNotAuthenticated, (req, res) => res.render('forgot-password.ejs', { messages: req.flash() }));
app.get('/perfil', checkAuthenticated, async (req, res) => {
    try {
        const [user] = await db.execute(
            'SELECT usuario_id, usuario, nombres, apellidopat, apellidomat, correo, telefono, rol, imagen_perfil FROM usuarios WHERE correo = ?',
            [currentMail]
        );
        
        if (user.length === 0) {
            console.error('Usuario no encontrado al acceder al perfil:', currentMail);
            req.flash('error', 'No se pudo cargar tu información de perfil');
            return res.redirect('/');
        }
        
        // Agregar logging para depuración
        console.log('Datos de usuario en perfil:', {
            userId: user[0].usuario_id,
            imagen_perfil: user[0].imagen_perfil,
            exists: user[0].imagen_perfil ? fs.existsSync(path.join(__dirname, 'images', user[0].imagen_perfil)) : false
        });
        
        res.render('perfil.ejs', { 
            user: user[0],
            messages: req.flash() 
        });
    } catch (err) {
        console.error('Error al cargar perfil:', err);
        req.flash('error', 'Error al cargar tu perfil');
        res.redirect('/');
    }
});

// Detalle de producto
app.get('/producto/:id', checkAuthenticated, async (req, res) => {
  const id = req.params.id;
  try {
    // Traemos el producto con categoría, plantel y (opcional) vendedor
    const [[producto]] = await db.query(`
      SELECT 
        p.*,
        c.nombre AS categoria_nombre,
        pl.nombre AS plantel_nombre,
        u.nombres AS vendedor_nombres,
        u.apellidopat AS vendedor_apellidopat,
        u.apellidomat AS vendedor_apellidomat
      FROM producto p
      JOIN categoria c ON p.categoria_id = c.categoria_id
      JOIN plantel   pl ON p.plantel_id   = pl.plantel_id
      JOIN usuarios  u  ON p.usuario_id    = u.usuario_id
      WHERE p.producto_id = ?
    `, [id]);

    if (!producto) {
      // Puedes renderizar una 404 personalizada o redirigir
      return res.status(404).render('404.ejs', { message: 'Producto no encontrado' });
    }
    res.render('producto.ejs', { producto });
  } catch (err) {
    console.error('Error al cargar detalle de producto:', err);
    res.redirect('/');
  }
});

/* ==================================================
   ESTADÍSTICAS DE PRODUCTOS
   ================================================== */

app.get('/data-planteles', checkAuthenticated, async (req, res) => {
    try {
        const [results] = await db.execute(`
            SELECT pl.nombre, COUNT(p.producto_id) AS count
            FROM plantel pl
            LEFT JOIN producto p ON pl.plantel_id = p.plantel_id
            GROUP BY pl.nombre
            ORDER BY 
                CASE 
                    WHEN pl.nombre = 'CECyT 1' THEN 1
                    WHEN pl.nombre = 'CECyT 2' THEN 2
                    WHEN pl.nombre = 'CECyT 3' THEN 3
                    WHEN pl.nombre = 'CECyT 4' THEN 4
                    WHEN pl.nombre = 'CECyT 5' THEN 5
                    WHEN pl.nombre = 'CECyT 6' THEN 6
                    WHEN pl.nombre = 'CECyT 7' THEN 7
                    WHEN pl.nombre = 'CECyT 8' THEN 8
                    WHEN pl.nombre = 'CECyT 9' THEN 9
                    WHEN pl.nombre = 'CECyT 10' THEN 10
                    WHEN pl.nombre = 'CECyT 11' THEN 11
                    WHEN pl.nombre = 'CECyT 12' THEN 12
                    WHEN pl.nombre = 'CECyT 13' THEN 13
                    WHEN pl.nombre = 'CECyT 14' THEN 14
                    WHEN pl.nombre = 'CECyT 15' THEN 15
                    WHEN pl.nombre = 'CECyT 16' THEN 16
                    WHEN pl.nombre = 'CECyT 17' THEN 17
                    WHEN pl.nombre = 'CECyT 18' THEN 18
                    WHEN pl.nombre = 'CECyT 19' THEN 19
                    WHEN pl.nombre = 'CET 1' THEN 20
                    ELSE 21
                END
        `);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta de planteles:', error);
        res.status(500).send('Error en el servidor');
    }
});

// Obtener todos los productos
app.get('/api/productos', checkAuthenticated, async (req, res) => {
    try {
        const [results] = await db.execute(`
            SELECT p.producto_id, p.nombre, p.descripcion, p.precio, p.cantidad, 
                   p.nombre_imagen, c.nombre AS categoria, u.usuario AS vendedor
            FROM producto p
            JOIN categoria c ON p.categoria_id = c.categoria_id
            JOIN usuarios u ON p.usuario_id = u.usuario_id
            ORDER BY p.producto_id DESC
        `);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// Productos por categoría
app.get('/api/productos-categoria/:id', checkAuthenticated, async (req, res) => {
    const categoriaId = req.params.id;
    
    if (!categoriaId || isNaN(parseInt(categoriaId))) {
        return res.status(400).json({ error: 'ID de categoría inválido' });
    }

    try {
        const [results] = await db.execute(`
            SELECT p.producto_id, p.nombre, p.descripcion, p.precio, p.cantidad, p.nombre_imagen,
                   u.usuario AS vendedor
            FROM producto p
            JOIN usuarios u ON p.usuario_id = u.usuario_id
            WHERE p.categoria_id = ?
            ORDER BY p.producto_id DESC
        `, [categoriaId]);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Mostrar imágenes
app.get('/showImage/:nombre', (req, res) => {
    const nombreImagen = req.params.nombre;
    const uploadPath = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    const imagePath = path.join(uploadPath, nombreImagen);
    
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        // Enviar imagen por defecto
        res.sendFile(path.join(uploadPath, 'noImageFound.jpg'));
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
app.get('/productos-carrito-compra', checkAuthenticated, async (req, res) => {
  try {
    const currentMail = req.session.user?.correo;
    if (!currentMail) {
      return res.status(401).json({ error: 'Sesión inválida: usuario no autenticado' });
    }

    // 1) Obtener usuario
    const [u] = await db.execute(
      'SELECT usuario_id FROM usuarios WHERE correo = ?',
      [currentMail]
    );
    if (u.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id_usuario = u[0].usuario_id;

    // 2) Obtener carrito
    const [c] = await db.execute(
      'SELECT carrito_id FROM carritos WHERE usuario_id = ?',
      [id_usuario]
    );
    if (c.length === 0) return res.status(200).json([]);
    const carrito_id = c[0].carrito_id;

    // 3) Obtener elementos_carrito
    const [ec] = await db.execute(
      'SELECT * FROM elementos_carrito WHERE carrito_id = ?',
      [carrito_id]
    );
    if (ec.length === 0) return res.status(200).json([]);
    res.json(ec);
  } catch (error) {
    console.error('Error al obtener productos del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar producto al carrito
app.post('/carrito-compra', checkAuthenticated, async (req, res) => {
  try {
    // 1) Lectura de inputs y usuario
    const userMail    = req.user.correo;
    const id_producto = parseInt(req.body.producto_id, 10);
    const cantidadReq = Math.max(1, parseInt(req.body.cantidad, 10) || 1);

    // 2) Validar producto
    const [[producto]] = await db.execute(
      `SELECT producto_id, nombre, precio, nombre_imagen
         FROM producto
        WHERE producto_id = ?`,
      [id_producto]
    );
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 3) Obtener usuario_id
    const [[{ usuario_id }]] = await db.execute(
      `SELECT usuario_id
         FROM usuarios
        WHERE correo = ?`,
      [userMail]
    );

    // 4) Buscar o crear carrito
    let carrito_id;
    const [c] = await db.execute(
      'SELECT carrito_id FROM carritos WHERE usuario_id = ?',
      [usuario_id]             // <-- usar usuario_id, no id_usuario
    );
    if (c.length === 0) {
      const [insertCarrito] = await db.execute(
        'INSERT INTO carritos (usuario_id) VALUES (?)',
        [usuario_id]
      );
      carrito_id = insertCarrito.insertId;
      // inicializar elementos_carrito
      await db.execute(
        `INSERT INTO elementos_carrito
           (carrito_id, productos_comprados, precio_total, cantidad_total, historial_compra_id)
         VALUES (?, ?, ?, ?, ?)`,
        [carrito_id, JSON.stringify([]), 0, 0, null]
      );
    } else {
      carrito_id = c[0].carrito_id;
    }

    // 5) Cargamos la fila existente:
    let [ec] = await db.execute(
    'SELECT * FROM elementos_carrito WHERE carrito_id = ?',
    [carrito_id]
    );
    if (ec.length === 0) {
    // … creas la fila …
    [ec] = await db.execute(/* … */);
    }
    const elemento = ec[0];

    // 6) Parse seguro con try/catch
    let productosExistentes;
    try {
    productosExistentes = JSON.parse(elemento.productos_comprados);
    if (!Array.isArray(productosExistentes)) {
        productosExistentes = [];
    }
    } catch {
    productosExistentes = [];
    }

    // Ahora empujas tu nuevo producto
    productosExistentes.push({
    producto_id: producto.producto_id,
    nombre:      producto.nombre,
    precio:      parseFloat(producto.precio),
    imagen:      producto.nombre_imagen,
    cantidad:    cantidadReq
    });

    // Recalculas totales…
    const nuevoTotal = productosExistentes
    .reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    const nuevaCantidadTotal = productosExistentes
    .reduce((sum, p) => sum + p.cantidad, 0);

    // 7) Guardas con JSON.stringify sobre un array limpio
    await db.execute(
    `UPDATE elementos_carrito
        SET productos_comprados = ?,
            precio_total       = ?,
            cantidad_total     = ?
        WHERE carrito_id = ?`,
    [JSON.stringify(productosExistentes), nuevoTotal, nuevaCantidadTotal, carrito_id]
    );

    // 8) Responder éxito
    return res.json({ success: true });

  } catch (error) {
    console.error('Error al agregar producto al carrito:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar producto del carrito
app.delete('/carrito-compra/:id_producto', checkAuthenticated, async (req, res) => {
  try {
    const currentMail = req.session.user?.correo;
    if (!currentMail) {
      return res.status(401).json({ error: 'Sesión inválida: usuario no autenticado' });
    }

    const id_producto_a_eliminar = parseInt(req.params.id_producto);

    // 1) Obtener usuario
    const [u] = await db.execute(
      'SELECT usuario_id FROM usuarios WHERE correo = ?',
      [currentMail]
    );
    if (u.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id_usuario = u[0].usuario_id;

    // 2) Obtener carrito + elementos
    const [rc] = await db.execute(`
      SELECT ec.carrito_id, ec.productos_comprados, ec.precio_total
      FROM carritos c
      JOIN elementos_carrito ec ON c.carrito_id = ec.carrito_id
      WHERE c.usuario_id = ?`,
      [id_usuario]
    );
    if (rc.length === 0) return res.status(404).json({ error: 'Carrito no encontrado' });

    const carrito_id = rc[0].carrito_id;
    const productos = JSON.parse(rc[0].productos_comprados);

    // 3) Filtrar producto
    const nuevosProductos = productos.filter(p => p.producto_id !== id_producto_a_eliminar);
    if (nuevosProductos.length === productos.length) {
      return res.status(400).json({ error: 'El producto no existe en el carrito.' });
    }

    // 4) Calcular nuevos totales
    const nuevoTotal = nuevosProductos
      .reduce((sum, x) => sum + x.precio * x.cantidad, 0);
    const nuevaCantidadTotal = nuevosProductos
      .reduce((sum, x) => sum + x.cantidad, 0);

    // 5) Actualizar
    await db.execute(
      `UPDATE elementos_carrito
          SET productos_comprados = ?,
              precio_total      = ?,
              cantidad_total    = ?
        WHERE carrito_id = ?`,
      [JSON.stringify(nuevosProductos), nuevoTotal, nuevaCantidadTotal, carrito_id]
    );

    res.json({
      success: true,
      message: 'Producto eliminado correctamente.',
      nuevosProductos,
      nuevoPrecioTotal: nuevoTotal
    });

  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Vaciar carrito
app.delete('/vaciar-carrito', checkAuthenticated, async (req, res) => {
  try {
    const currentMail = req.session.user?.correo;
    if (!currentMail) {
      return res.status(401).json({ error: 'Sesión inválida: usuario no autenticado' });
    }

    // 1) Obtener usuario y carrito
    const [u] = await db.execute(
      'SELECT usuario_id FROM usuarios WHERE correo = ?',
      [currentMail]
    );
    if (u.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id_usuario = u[0].usuario_id;

    const [c] = await db.execute(
      'SELECT carrito_id FROM carritos WHERE usuario_id = ?',
      [id_usuario]
    );
    if (c.length === 0) return res.status(404).json({ error: 'Carrito no encontrado' });
    const carrito_id = c[0].carrito_id;

    // 2) Resetear
    await db.execute(
      `UPDATE elementos_carrito
          SET productos_comprados = ?,
              precio_total      = ?,
              cantidad_total    = ?
        WHERE carrito_id = ?`,
      ['[]', 0, 0, carrito_id]
    );

    res.json({ success: true, message: 'Carrito vaciado correctamente' });

  } catch (error) {
    console.error('Error al vaciar el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/* ==================================================
   ENVÍO DE CORREOS ELECTRÓNICOS
   ================================================== */

app.post('/enviar-correo', (req, res) => {
    const { productos, total } = req.body;
    const correoUsuario = currentMail;

    let contenidoCorreo = `<h2>Resumen de tu compra</h2><ul>`;
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
   RUTAS PARA ADMINISTRACIÓN DE PLANTELES
   ================================================== */

// Obtener todos los planteles
app.get('/api/planteles', checkAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT plantel_id, nombre, imagen FROM plantel ORDER BY nombre');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener planteles:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un plantel específico con sus categorías
app.get('/api/planteles/:id', checkAuthenticated, async (req, res) => {
    if (req.user.rol !== 'administrador') {
        return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    try {
        const plantelId = req.params.id;
        
        const [plantelResults] = await db.query('SELECT * FROM plantel WHERE plantel_id = ?', [plantelId]);
        
        if (plantelResults.length === 0) {
            return res.status(404).json({ error: 'Plantel no encontrado' });
        }
        
        const [categoriasResults] = await db.query('SELECT * FROM categoria WHERE plantel_id = ?', [plantelId]);
        
        res.json({
            plantel: plantelResults[0],
            categorias: categoriasResults
        });
    } catch (err) {
        console.error('Error al obtener plantel:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Función para extraer el número del plantel y prefijo
function extraerNumeroPlantel(nombre) {
    const match = nombre.match(/(?:CECyT|CET)[\s\-_]*(?:No\.?)?[\s\-_]*(\d+)/i);
    if (match) {
        return {
            numero: match[1],
            prefijo: nombre.toUpperCase().includes('CET') ? 'cet' : 'cecyt'
        };
    }
    return { numero: null, prefijo: 'default' };
}

// Añadir nuevo plantel
app.post('/api/planteles', checkAuthenticated, uploadPlanteles.single('imagen'), async (req, res) => {
    let tempImagePath = null;
    try {
        const { nombre, categorias = '[]' } = req.body;

        if (!nombre) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false, 
                message: 'El nombre del plantel es requerido' 
            });
        }

        // Validar nombre del plantel (CECyT # o CET #)
        const match = nombre.match(/(?:CECyT|CET)[\s\-_]*(?:No\.?)?[\s\-_]*(\d+)/i);
        if (!match) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false, 
                message: 'El nombre del plantel debe ser de tipo CECyT # o CET #' 
            });
        }

        // Procesar imagen si se subió
        if (req.file) {
            tempImagePath = path.join(__dirname, 'images', 'planteles', `temp-${Date.now()}.png`);
            await sharp(req.file.path)
                .resize(800, 600, { fit: 'cover' })
                .toFormat('png')
                .toFile(tempImagePath);
            fs.unlinkSync(req.file.path);
        }

        // Determinar nombre final de la imagen
        const numeroPlantel = parseInt(match[1]);
        const prefijo = nombre.toLowerCase().includes('cet') ? 'cet' : 'c';
        const finalImageName = numeroPlantel ? `${prefijo}${numeroPlantel}.png` : `plantel-${Date.now()}.png`;

        const finalImagePath = path.join(__dirname, 'images', 'planteles', finalImageName);

        if (req.file) {
            fs.renameSync(tempImagePath, finalImagePath);
        } else if (!fs.existsSync(finalImagePath)) {
            const defaultImagePath = path.join(__dirname, 'images', 'planteles', 'default.png');
            fs.copyFileSync(defaultImagePath, finalImagePath);
        }

        // Insertar en la base de datos
        const [insertResult] = await db.execute(
            'INSERT INTO plantel (nombre, imagen) VALUES (?, ?)',
            [nombre, finalImageName]
        );

        res.status(201).json({
            success: true,
            message: 'Plantel añadido correctamente',
            plantelId: insertResult.insertId,
            imageName: finalImageName,
            imageUrl: `/images/planteles/${finalImageName}`
        });

    } catch (error) {
        console.error('Error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar plantel',
            error: error.message 
        });
    }
});

// Eliminar plantel
app.delete('/api/planteles/:id', checkAuthenticated, async (req, res) => {
    try {
        const plantelId = req.params.id;
        
        // Iniciar transacción
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Obtener información del plantel para eliminar la imagen
            const [plantel] = await connection.query(
                'SELECT imagen FROM plantel WHERE plantel_id = ?',
                [plantelId]
            );
            
            if (plantel.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Plantel no encontrado' });
            }

            // 2. Eliminar todos los productos asociados a las categorías del plantel
            await connection.query(`
                DELETE p FROM producto p
                JOIN categoria c ON p.categoria_id = c.categoria_id
                WHERE c.plantel_id = ?
            `, [plantelId]);

            // 3. Eliminar todas las categorías del plantel
            await connection.query(
                'DELETE FROM categoria WHERE plantel_id = ?',
                [plantelId]
            );

            // 4. Eliminar el plantel
            await connection.query(
                'DELETE FROM plantel WHERE plantel_id = ?',
                [plantelId]
            );

            // 5. Eliminar la imagen del sistema de archivos si existe
            if (plantel[0].imagen) {
                const imagePath = path.join(__dirname, 'uploads/planteles', plantel[0].imagen);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Confirmar la transacción
            await connection.commit();
            connection.release();
            
            res.json({ 
                success: true,
                message: 'Plantel eliminado correctamente'
            });
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error al eliminar plantel:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar plantel',
            error: error.message 
        });
    }
});

// Actualizar plantel
app.put('/api/planteles/:id', checkAuthenticated, uploadPlanteles.single('imagen'), async (req, res) => {
    try {
        const plantelId = req.params.id;
        const { nombre, categorias = '[]' } = req.body;
        const categoriasArray = JSON.parse(categorias);

        // Obtener plantel actual
        const [plantel] = await db.execute('SELECT * FROM plantel WHERE plantel_id = ?', [plantelId]);
        if (!plantel.length) {
            return res.status(404).json({ success: false, message: 'Plantel no encontrado' });
        }

        // Validar y generar nombre de imagen
        const numeroPlantel = extraerNumeroPlantel(nombre);
        const newImageName = numeroPlantel.numero
            ? (numeroPlantel.prefijo === 'cet' ? `cet${numeroPlantel.numero}.png` : `c${numeroPlantel.numero}.png`)
            : plantel[0].imagen;
        const newImagePath = path.join(__dirname, 'images', 'planteles', newImageName);

        // Procesar imagen si se subió una nueva
        if (req.file) {
            const tempImagePath = path.join(__dirname, 'images', 'planteles', `temp-${Date.now()}.png`);
            await sharp(req.file.path)
                .resize(800, 600, { fit: 'cover' })
                .toFormat('png')
                .toFile(tempImagePath);

            fs.unlinkSync(req.file.path);

            // Eliminar imagen final si existe
            if (fs.existsSync(newImagePath)) {
                fs.unlinkSync(newImagePath);
            }

            // Mover la imagen temporal a la final
            fs.renameSync(tempImagePath, newImagePath);
        }

        // Actualizar nombre e imagen en BD
        await db.execute(
            'UPDATE plantel SET nombre = ?, imagen = ? WHERE plantel_id = ?',
            [nombre, newImageName, plantelId]
        );

        // Actualizar categorías: borrar las existentes y agregar las nuevas
        await db.execute('DELETE FROM categoria WHERE plantel_id = ?', [plantelId]);
        for (const categoria of categoriasArray) {
            await db.execute('INSERT INTO categoria (nombre, plantel_id) VALUES (?, ?)', [categoria, plantelId]);
        }

        res.json({
            success: true,
            message: 'Plantel actualizado correctamente',
            imageName: newImageName,
            imageUrl: `/images/planteles/${newImageName}`
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar plantel',
            error: error.message 
        });
    }
});

// Obtener categorías de un plantel
app.get('/api/planteles/:id/categorias', checkAuthenticated, async (req, res) => {
    try {
        const plantelId = req.params.id;
        
        const [categorias] = await db.query(
            'SELECT nombre FROM categoria WHERE plantel_id = ?',
            [plantelId]
        );
        
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// Mostrar productos de un plantel específico
app.get('/plantel/:id', checkAuthenticated, async (req, res) => {
    try {
        const plantelId = req.params.id;
        
        // Obtener información del plantel incluyendo la imagen
        const [plantelResults] = await db.query(
            'SELECT * FROM plantel WHERE plantel_id = ?', 
            [plantelId]
        );
        
        if (plantelResults.length === 0) {
            return res.status(404).send('Plantel no encontrado');
        }
        
        const plantel = plantelResults[0];
        
        // Obtener productos del plantel
        const [productos] = await db.query(`
            SELECT 
                p.nombre,
                'Tresca común' AS certificado,
                FLOOR(RAND() * 10) + 1 AS complejo,
                p.precio,
                DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y') AS fecha,
                CONCAT('Usuario', FLOOR(RAND() * 1000)) AS usuario,
                IF(RAND() > 0.5, 'Disponible', 'Agotado') AS estatus
            FROM producto p
            JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE c.plantel_id = ?
            ORDER BY p.fecha_creacion DESC
        `, [plantelId]);
        
        res.render('plantel-producto', {
            plantel,
            productos
        });
        
    } catch (error) {
        console.error('Error al obtener productos del plantel:', error);
        res.status(500).send('Error en el servidor');
    }
});

/* ==================================================
   RUTAS ADICIONALES
   ================================================== */

app.get("/graficas", checkAuthenticated, (req, res) => {
    res.render("graficas.ejs"); 
});

app.get('/admin', checkAuthenticated, async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
        const [producto] = await db.query('SELECT COUNT(*) AS total FROM producto');
        const [plantele] = await db.query('SELECT COUNT(*) AS total FROM plantel');
        const [categoria] = await db.query('SELECT COUNT(*) AS total FROM categoria');

        res.render('admin', {
            usuarios: usuarios[0].total,
            producto: producto[0].total,
            plantel: plantele[0].total,
            categoria: categoria[0].total
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.render('admin', {
            usuarios: 0,
            producto: 0,
            plantele: 0,
            categoria: 0
        });
    }
});

/* ==================================================
   INICIO DEL SERVIDOR
   ================================================== */
   app.listen(3001, (err) => {
    if (err) {
        console.error('Error al iniciar el servidor:', err);
        return;
    }
    console.log('Servidor corriendo en http://localhost:3001');
});