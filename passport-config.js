const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise"); // Usamos la versión con promesas

// Eliminamos las variables globales ya que no son recomendables
// En su lugar usaremos req.user que proporciona passport

async function getUserByEmail(email) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await db.query(
            'SELECT usuario_id, usuario, correo, contra, rol, verificado FROM usuarios WHERE correo = ?',
            [email]
        );
        return rows[0] || null;
    } catch (error) {
        console.error("Error en getUserByEmail:", error);
        return null;
    } finally {
        await db.end();
    }
}

async function getUserById(id) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await db.query(
            'SELECT usuario_id, usuario, correo, rol, verificado FROM usuarios WHERE usuario_id = ?',
            [id]
        );
        return rows[0] || null;
    } catch (error) {
        console.error("Error en getUserById:", error);
        return null;
    } finally {
        await db.end();
    }
}

function initialize(passport) {
    const authenticateUsers = async (email, password, done) => {
        try {
            const user = await getUserByEmail(email);
            
            if (!user) {
                console.log("Usuario no encontrado:", email);
                return done(null, false, { message: "Correo electrónico no registrado" });
            }

            // Verificar si la cuenta está verificada
            if (user.verificado !== 1) {
                console.log("Cuenta no verificada:", email);
                return done(null, false, { 
                    message: "Por favor verifica tu cuenta de correo antes de iniciar sesión" 
                });
            }

            const validPassword = await bcrypt.compare(password, user.contra);
            
            if (validPassword) {
                console.log("Usuario autenticado:", user.usuario);
                return done(null, user);
            } else {
                console.log("Contraseña incorrecta para:", email);
                return done(null, false, { message: "Contraseña incorrecta" });
            }
        } catch (error) {
            console.error("Error en authenticateUsers:", error);
            return done(error);
        }
    };

    passport.use(new LocalStrategy({ 
        usernameField: 'email',
        passwordField: 'password'
    }, authenticateUsers));
    
    passport.serializeUser((user, done) => {
        done(null, user.usuario_id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await getUserById(id);
            if (user) {
                done(null, user);
            } else {
                done(new Error('Usuario no encontrado'));
            }
        } catch (error) {
            done(error);
        }
    });
}

// Eliminamos las funciones de ayuda globales ya que no son necesarias
// Todas estas propiedades están disponibles en req.user después de autenticar

module.exports = {
    initialize
};