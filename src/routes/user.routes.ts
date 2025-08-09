import { Router } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import { signToken } from "../utils/auth";

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

  const token = signToken(newUser.id);

  res.status(201).json({
    message: "Usuario registrado exitosamente",
    token,
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
  const { username, password } = req.body;
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

  const token = signToken(user.id);

  res.status(200).json({
    message: "Inicio de sesión exitoso",
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

export default router;
