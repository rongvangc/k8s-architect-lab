import { restaurants, menuItems } from "./schema";
import { count } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/node-postgres";

type DB = ReturnType<typeof drizzle>;

const seedData = [
  {
    name: "Phở Hà Nội",
    description: "Phở truyền thống Hà Nội với nước dùng hầm xương 12 tiếng, bánh phở tươi mỗi ngày.",
    imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    rating: "4.5",
    menu: [
      { name: "Phở Bò Tái", description: "Bò tái thái mỏng, nước dùng đậm đà", price: "55000", category: "Phở" },
      { name: "Phở Gà", description: "Thịt gà ta thả vườn, da giòn", price: "50000", category: "Phở" },
      { name: "Phở Đặc Biệt", description: "Đầy đủ bò tái, nạm, gầu, trứng", price: "75000", category: "Phở" },
      { name: "Bún Chả Hà Nội", description: "Chả nướng than hoa, nước mắm chua ngọt", price: "60000", category: "Bún & Miến" },
      { name: "Nem Rán", description: "Nem rán giòn, nhân thịt mộc nhĩ", price: "35000", category: "Khai vị" },
    ],
  },
  {
    name: "Cơm Tấm Sài Gòn",
    description: "Cơm tấm chuẩn vị Sài Gòn, sườn nướng mật ong thơm lừng.",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
    address: "456 Lê Lợi, Quận 3, TP.HCM",
    rating: "4.3",
    menu: [
      { name: "Cơm Tấm Sườn", description: "Sườn cốt lết nướng mật ong, bì, chả", price: "45000", category: "Cơm Tấm" },
      { name: "Cơm Tấm Bì Chả", description: "Bì heo thái sợi, chả trứng hấp", price: "40000", category: "Cơm Tấm" },
      { name: "Cơm Tấm Gà Nướng", description: "Đùi gà nướng xả ớt, mỡ hành", price: "50000", category: "Cơm Tấm" },
      { name: "Canh Chua Cá", description: "Cá lóc, giá đỗ, thơm, cà chua", price: "35000", category: "Canh" },
    ],
  },
  {
    name: "Pizza House",
    description: "Pizza lò gạch chuẩn Napoli, nguyên liệu nhập khẩu từ Ý.",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    address: "789 Hai Bà Trưng, Quận 1, TP.HCM",
    rating: "4.6",
    menu: [
      { name: "Margherita", description: "Sốt cà chua, mozzarella tươi, basil", price: "129000", category: "Pizza" },
      { name: "Pepperoni", description: "Pepperoni, mozzarella, sốt cà chua", price: "159000", category: "Pizza" },
      { name: "Hawaiian", description: "Thịt nguội, dứa, mozzarella", price: "149000", category: "Pizza" },
      { name: "Caesar Salad", description: "Xà lách Roman, gà nướng, parmesan", price: "89000", category: "Salad" },
      { name: "Garlic Bread", description: "Bánh mỳ bơ tỏi nướng giòn", price: "45000", category: "Khai vị" },
    ],
  },
  {
    name: "Sushi Tokyo",
    description: "Sushi tươi sống, đầu bếp Nhật trên 15 năm kinh nghiệm.",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    address: "12 Lê Thánh Tôn, Quận 1, TP.HCM",
    rating: "4.7",
    menu: [
      { name: "Sashimi Tổng Hợp", description: "Cá hồi, cá ngừ, cá trích, bạch tuộc", price: "259000", category: "Sashimi" },
      { name: "Maki Cá Hồi", description: "Cơm cuộn cá hồi tươi, bơ", price: "129000", category: "Maki" },
      { name: "Ramen Miso", description: "Mỳ ramen nước súp miso, chashu, trứng", price: "139000", category: "Mỳ" },
      { name: "Tempura Tôm", description: "Tôm tươi chiên tempura giòn tan", price: "109000", category: "Khai vị" },
    ],
  },
  {
    name: "Burger Street",
    description: "Burger bò Mỹ 100%, sốt đặc biệt, khoai tây chiên tươi.",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    address: "345 Phạm Ngũ Lão, Quận 1, TP.HCM",
    rating: "4.2",
    menu: [
      { name: "Classic Burger", description: "Bò 150g, cheddar, xà lách, cà chua", price: "85000", category: "Burger" },
      { name: "Cheese Burger", description: "Bò đôi, cheddar đôi, thịt xông khói", price: "109000", category: "Burger" },
      { name: "Chicken Burger", description: "Gà giòn, sốt mayonnaise, xà lách", price: "75000", category: "Burger" },
      { name: "Khoai Tây Chiên", description: "Khoai tây cắt tay, chiên giòn", price: "39000", category: "Món phụ" },
      { name: "Milkshake", description: "Kem tươi, sữa, siro các vị", price: "49000", category: "Đồ uống" },
    ],
  },
];

export async function seedIfEmpty(db: DB): Promise<void> {
  const existing = await db.select({ value: count() }).from(restaurants);
  if (Number(existing[0].value) > 0) return;

  console.log(JSON.stringify({ level: "info", event: "seeding_database" }));

  for (const restaurantData of seedData) {
    const { menu, ...rest } = restaurantData;
    const [inserted] = await db.insert(restaurants).values(rest).returning({ id: restaurants.id });

    const menuValues = menu.map((item) => ({
      restaurantId: inserted.id,
      ...item,
    }));

    await db.insert(menuItems).values(menuValues);
  }

  console.log(JSON.stringify({ level: "info", event: "seeding_complete", restaurants: seedData.length }));
}
