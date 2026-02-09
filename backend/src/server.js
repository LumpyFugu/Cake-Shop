require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { ordersRouter } = require("./routes/orders");
const { dashboardRouter } = require("./routes/dashboard");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);
app.use("/admin/dashboard", dashboardRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
