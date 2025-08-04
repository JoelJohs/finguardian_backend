import { Router } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import { signToken } from "../utils/auth";

const router = Router();

const repo = () => AppDataSource.getRepository(User);

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
