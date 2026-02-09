const jwt = require("jsonwebtoken");

const DEFAULT_SECRET = "dev-secret-change-me";
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

function signToken(payload, options = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload must be an object");
  }

  const signOptions = { expiresIn: "7d", ...options };
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("token must be provided");
  }

  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
