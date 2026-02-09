const express = require("express");
const { prisma } = require("../prisma");
//dashboard is only for admin
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.use(requireAuth, requireAdmin);

//format the birthday data
function getAgeBucket(birthdate) {
  if (!birthdate) return "unknown";
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return "unknown";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const hasHadBirthday =
    now.getMonth() > d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate());
  if (!hasHadBirthday) age -= 1;
  if (age < 20) return "<20";
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  return "50+";
}

//format the date data
function formatMonth(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

//process data for dashboard
function buildAnalytics(paidOrders) {
  //define analtic data
  const productTotals = new Map();
  const monthTotals = new Map();
  const genderTotals = new Map([
    ["male", 0],
    ["female", 0],
    ["other", 0],
    ["unknown", 0]
  ]);
  const ageBucketOrder = ["<20", "20-29", "30-39", "40-49", "50+", "unknown"];
  const ageTotals = ageBucketOrder.reduce((acc, bucket) => {
    acc[bucket] = 0;
    return acc;
  }, {});

  //search all the orders
  for (const order of paidOrders) {
    let orderUnits = 0;

    for (const item of order.items) {
      orderUnits += item.quantity;
      if (!item.product) continue;
      const existing = productTotals.get(item.product.id) || {
        productId: item.product.id,
        name: item.product.name,
        unitsSold: 0
      };
      existing.unitsSold += item.quantity;
      productTotals.set(item.product.id, existing);
    }
    
    //take data from order
    if (orderUnits > 0) {
      const ym = formatMonth(order.createdAt);
      monthTotals.set(ym, (monthTotals.get(ym) || 0) + orderUnits);

      const genderKey = (order.user?.gender || "unknown").toLowerCase();
      genderTotals.set(genderKey, (genderTotals.get(genderKey) || 0) + orderUnits);

      const ageBucket = getAgeBucket(order.user?.birthdate);
      ageTotals[ageBucket] = (ageTotals[ageBucket] || 0) + orderUnits;
    }
  }

  const topProducts = Array.from(productTotals.values()) //best 5 products
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const salesTrend = Array.from(monthTotals.entries()) //Statistics by month
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([ym, unitsSold]) => ({ ym, unitsSold }));

  const genderDist = Array.from(genderTotals.entries()) //Statistics by gender
    .filter(([, cnt]) => cnt > 0)
    .map(([gender, cnt]) => ({ gender, cnt }));

  const ageBuckets = ageBucketOrder //Statistics by ages
    .map((bucket) => ({ bucket, cnt: ageTotals[bucket] || 0 }))
    .filter((entry) => entry.cnt > 0);

  return { topProducts, salesTrend, genderDist, ageBuckets };
}

router.get("/summary", async (req, res) => {
  let productId = null;
  //show the statisitcs of each product
  if (req.query.productId !== undefined) {
    productId = Number(req.query.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: "productId must be a positive integer" });
    }
  }

  const paidOrderWhere = {
    status: "paid",
    ...(productId
      ? {
          items: {
            some: { productId }
          }
        }
      : {})
  };

  //base selection
  const baseItemsSelect = {
    quantity: true,
    unitPrice: true,
    product: { select: { id: true, name: true } }
  };

  //two situations： see one products or all products
  const itemsSelector = productId
    ? {
        where: { productId },
        select: baseItemsSelect
      }
    : {
        select: baseItemsSelect
      };

  //count data
  const [userCount, orderCount, revenueAgg, lowStockProducts, recentOrders, paidOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, name: true, stock: true }
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5, //best 5 sales
      include: {
        user: { select: { id: true, email: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { id: true, name: true } }
          }
        }
      }
    }),
    prisma.order.findMany({
      where: paidOrderWhere,
      select: {
        createdAt: true,
        user: { select: { gender: true, birthdate: true } },
        items: itemsSelector
      }
    })
  ]);

  //provide data to process
  const analytics = buildAnalytics(paidOrders);
  //keep topproducts graph unchanged when using the filter
  if (productId) {
    const allPaidOrders = await prisma.order.findMany({
      where: { status: "paid" },
      select: {
        createdAt: true,
        user: { select: { gender: true, birthdate: true } },
        items: { select: baseItemsSelect }
      }
    });
    const { topProducts } = buildAnalytics(allPaidOrders);
    analytics.topProducts = topProducts;
  }

  //provide processed data for frontend
  return res.json({
    totals: {
      users: userCount,
      orders: orderCount,
      revenue: revenueAgg._sum.totalAmount || 0
    },
    lowStockProducts,
    recentOrders,
    ...analytics
  });
});

module.exports = { dashboardRouter: router };
