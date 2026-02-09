const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // Products
  const products = [
    { name: "Short Cake", price: 25, stock: 50 },
    { name: "Pineapple Cake", price: 10, stock: 50 },
    { name: "Mont Blanc", price: 30, stock: 50 },
    { name: "Tiramisu", price: 25, stock: 50 },
    { name: "Mille Crepe", price: 20, stock: 50 },
    { name: "Chocolate Cake", price: 25, stock: 50 },
    { name: "Roll Cake", price: 20, stock: 50 }
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.product.create({ data: p });
    }
  }

  // Admin user
  const adminEmail = "admin@cake.local";
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("Admin1234!", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "admin",
        gender: "female"
      }
    });
  }

  console.log("Seed completed.");
  console.log("Admin login:", adminEmail, "password: Admin1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
