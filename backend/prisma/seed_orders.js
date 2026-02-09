const { PrismaClient } = require("@prisma/client");//与prisma连接
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

//生成随机数据
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function randomDateInMonth(year, month) {
  // month: 1-12
  const day = randInt(1, 28); 
  const hour = randInt(9, 20);
  return new Date(year, month - 1, day, hour, 0, 0);
}

async function main() {
  console.log("Start seeding test orders");
  const products = await prisma.product.findMany({
    where: { isActive: true }
  });
  if (products.length === 0) {
    throw new Error("No products found. Please seed products first.");
  }

  const usersData = [
    { email: "1@test.com", gender: "female", birthdate: "1998-05-10" },
    { email: "2@test.com", gender: "male", birthdate: "1992-11-22" },
    { email: "3@test.com", gender: "female", birthdate: "1985-03-15" },
    { email: "4@test.com", gender: "male", birthdate: "1978-07-01" },
    { email: "5@test.com", gender: "female", birthdate: "2003-09-08" },
    { email: "6@test.com", gender: "female", birthdate: "1987-12-25" },
    { email: "7@test.com", gender: "male", birthdate: "1990-04-01" },
    { email: "8@test.com", gender: "female", birthdate: "2000-09-09" },
  ];

  const passwordHash = await bcrypt.hash("Test1234!", 10);
  const users = [];

  for (const u of usersData) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          gender: u.gender,
          birthdate: new Date(u.birthdate),
          role: "user"
        }
      });
    }
    users.push(user);
  }

  //定义要生成订单的月份
  const months = [
    { year: 2022, month: 7 },
    { year: 2022, month: 8 },
    { year: 2022, month: 9 },
    { year: 2022, month: 10 },
    { year: 2022, month: 11 },
    { year: 2022, month: 12 }
  ];


  for (const user of users) {
    for (const m of months) {
      const ordersCount = randInt(3, 6); // 每月 3-6 单

      for (let i = 0; i < ordersCount; i++) {
        const pickedProducts = pickRandom(products, randInt(1, 4));

        let totalAmount = 0;
        const itemsData = [];

        for (const p of pickedProducts) {
          const quantity = randInt(1, 3);
          totalAmount += p.price * quantity;
          itemsData.push({
            productId: p.id,
            quantity,
            unitPrice: p.price
          });
        }

        //create order
        await prisma.order.create({
          data: {
            userId: user.id,
            status: "paid",
            totalAmount,
            createdAt: randomDateInMonth(m.year, m.month),
            items: {
              create: itemsData
            }
          }
        });
      }
    }
  }

  console.log("Test orders seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
