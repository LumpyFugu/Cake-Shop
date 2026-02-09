const express = require("express");
const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, price: true, stock: true, isActive: true }
  });

  return res.json({ products });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "invalid id" });

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, price: true, stock: true, isActive: true }
  });

  if (!product || !product.isActive) return res.status(404).json({ error: "product not found" });

  return res.json({ product });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, stock, isActive = true } = req.body || {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name is required" });
  if (!Number.isInteger(price) || price <= 0) return res.status(400).json({ error: "price must be a positive integer" });
  if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ error: "stock must be zero or more" });

  const product = await prisma.product.create({
    data: { name: name.trim(), price, stock, isActive: Boolean(isActive) },
    select: { id: true, name: true, price: true, stock: true, isActive: true }
  });

  return res.status(201).json({ product });
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "invalid id" });

  const updates = {};
  if (req.body?.name !== undefined) {
    if (typeof req.body.name !== "string" || !req.body.name.trim()) {
      return res.status(400).json({ error: "name must be a non-empty string" });
    }
    updates.name = req.body.name.trim();
  }
  if (req.body?.price !== undefined) {
    if (!Number.isInteger(req.body.price) || req.body.price <= 0) {
      return res.status(400).json({ error: "price must be a positive integer" });
    }
    updates.price = req.body.price;
  }
  if (req.body?.stock !== undefined) {
    if (!Number.isInteger(req.body.stock) || req.body.stock < 0) {
      return res.status(400).json({ error: "stock must be zero or more" });
    }
    updates.stock = req.body.stock;
  }
  if (req.body?.isActive !== undefined) {
    updates.isActive = Boolean(req.body.isActive);
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "no valid fields provided" });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, price: true, stock: true, isActive: true }
    });

    return res.json({ product });
  } catch (err) {
    return res.status(404).json({ error: "product not found" });
  }
});

module.exports = { productsRouter: router };
