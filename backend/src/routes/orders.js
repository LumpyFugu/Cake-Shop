const express = require("express");
const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, price: true }
          }
        }
      }
    }
  });

  return res.json({ orders });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "invalid id" });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, price: true }
          }
        }
      }
    }
  });

  if (!order || order.userId !== req.user.userId) {
    return res.status(404).json({ error: "order not found" });
  }

  return res.json({ order });
});

router.post("/", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length) return res.status(400).json({ error: "order items required" });

  const items = rawItems
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity)
    }))
    .filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);

  if (!items.length) return res.status(400).json({ error: "invalid order items" });

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true }
  });

  if (products.length !== productIds.length) {
    return res.status(400).json({ error: "one or more products unavailable" });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  let totalAmount = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (item.quantity > product.stock) {
      return res.status(400).json({ error: `insufficient stock for ${product.name}` });
    }
    totalAmount += product.price * item.quantity;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = productMap.get(item.productId);
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - item.quantity,
            isActive: product.stock - item.quantity > 0
          }
        });
        product.stock -= item.quantity;
      }

      return tx.order.create({
        data: {
          userId: req.user.userId,
          totalAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: productMap.get(item.productId).price
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, price: true }
              }
            }
          }
        }
      });
    });

    return res.status(201).json({ order });
  } catch (err) {
    return res.status(500).json({ error: "failed to create order" });
  }
});

module.exports = { ordersRouter: router };
