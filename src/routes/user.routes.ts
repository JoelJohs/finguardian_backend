import { Router } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import { signToken, setTokenCookie, clearTokenCookie } from "../utils/auth";
import { auth, AuthRequest } from "../middlewares/auth";

const router = Router();

const repo = () => AppDataSource.getRepository(User);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un nuevo usuario
 *     description: Crea una nueva cuenta de usuario y retorna un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             username: "john_doe"
 *             email: "john@example.com"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "Usuario registrado exitosamente"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 username: "john_doe"
 *                 email: "john@example.com"
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "El usuario ya existe"
 */
// Registro
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  const existingUser = await repo().findOne({ where: { username } });
  if (existingUser) {
    return res.status(400).json({ message: "El usuario ya existe" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = repo().create({
    username,
    email,
    password: hashedPassword,
  });

  await repo().save(newUser);

  const token = signToken(newUser.id, false);

  // Establecer el token en una cookie segura (registro siempre con duración corta)
  setTokenCookie(res, token, false);

  res.status(201).json({
    message: "Usuario registrado exitosamente",
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  });
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y retorna un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: "john_doe"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "Inicio de sesión exitoso"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 username: "john_doe"
 *                 email: "john@example.com"
 *       400:
 *         description: Faltan datos requeridos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Faltan datos requeridos"
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Usuario incorrecto"
 */
// Login
router.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  const user = await repo().findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: "Usuario incorrecto" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "contraseña incorrecta" });
  }

  const token = signToken(user.id, rememberMe);

  // Establecer el token en una cookie segura con duración basada en rememberMe
  setTokenCookie(res, token, rememberMe);

  res.status(200).json({
    message: "Inicio de sesión exitoso",
    user: { id: user.id, username: user.username, email: user.email },
  });
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     description: Cierra la sesión del usuario eliminando la cookie de autenticación
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Sesión cerrada exitosamente"
 */
// Logout
router.post("/logout", auth, (req: AuthRequest, res) => {
  // Limpiar la cookie del token
  clearTokenCookie(res);

  res.status(200).json({
    message: "Sesión cerrada exitosamente"
  });
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener información del usuario actual
 *     description: Retorna la información del usuario autenticado
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 username: "john_doe"
 *                 email: "john@example.com"
 *       401:
 *         description: Token de autorización inválido
 */
// Obtener información del usuario actual
router.get("/me", auth, async (req: AuthRequest, res) => {
  try {
    const user = await repo().findOne({
      where: { id: req.userId },
      select: ["id", "username", "email", "created_at"]
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
