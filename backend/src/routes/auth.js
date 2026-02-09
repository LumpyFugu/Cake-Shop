//define register and login API
const express = require("express");
const { prisma } = require("../prisma");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const router = express.Router();

//check user info
router.post("/register", async (req, res) => {
  const { email, password, gender, birthdate } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 chars" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "email already exists" });

  let birthdateValue = null;
  if (birthdate) {
    const d = new Date(birthdate);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ error: "invalid birthdate" });
    birthdateValue = d;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      gender: gender || "unknown",
      birthdate: birthdateValue,
      role: "user"
    },
    select: { id: true, email: true, role: true }
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({ token, user });
});

//check user by email
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

module.exports = { authRouter: router };
