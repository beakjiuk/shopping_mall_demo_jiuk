import dotenv from "dotenv";
import { connectDb } from "../src/db.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { appleProducts } from "./appleProducts.js";

dotenv.config();

async function main() {
  await connectDb(process.env.MONGODB_URI);

  const adminEmail = "admin@gmail.com";
  const userEmail = "user@example.com";
  const password = "password123";

  await User.deleteMany({ email: { $in: [adminEmail, userEmail] } });
  await Product.deleteMany({});

  await User.create([
    { email: adminEmail, name: "Admin", password, role: "admin" },
    { email: userEmail, name: "User", password, role: "user" }
  ]);

  await Product.create([
    {
      title: "Premium Wireless Headphones Pro Max",
      description:
        "Experience audio like never before with our Premium Wireless Headphones Pro Max. Featuring advanced noise cancellation, crystal-clear sound quality, and an incredibly comfortable design for extended listening sessions.",
      price: 299,
      originalPrice: 399,
      brand: "SoundTech",
      category: "Electronics",
      rating: 4.8,
      reviews: 2847,
      isBestSeller: false,
      isNew: true,
      fastDelivery: true,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80",
        "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=1200&q=80"
      ],
      features: [
        "Active Noise Cancellation",
        "40-hour battery life",
        "Premium comfort ear cushions",
        "Hi-Res Audio certified",
        "Multi-device connectivity"
      ],
      colors: ["Midnight Black", "Pearl White", "Rose Gold"],
      stock: 45
    },
    {
      title: "Minimalist Watch Collection",
      description:
        "Timeless elegance meets modern simplicity. Our Minimalist Watch features a sleek design with premium materials that complement any outfit.",
      price: 189,
      originalPrice: null,
      brand: "CHRONO",
      category: "Accessories",
      rating: 4.9,
      reviews: 1523,
      isBestSeller: true,
      isNew: false,
      fastDelivery: false,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1200&q=80"
      ],
      features: ["Swiss movement", "Sapphire crystal glass", "Water resistant 50m", "Genuine leather strap", "2-year warranty"],
      colors: ["Silver", "Gold", "Black"],
      stock: 28
    },
    {
      title: "Smart Home Speaker with Voice Control",
      description:
        "Transform your home with intelligent voice control. Stream music, control smart devices, and get answers hands-free.",
      price: 129,
      originalPrice: 179,
      brand: "HomeTech",
      category: "Electronics",
      rating: 4.6,
      reviews: 3421,
      isBestSeller: false,
      isNew: false,
      fastDelivery: true,
      imageUrl: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80",
        "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=1200&q=80"
      ],
      features: ["360-degree premium sound", "Voice assistant built-in", "Smart home hub", "Multi-room audio", "Privacy controls"],
      colors: ["Charcoal", "Chalk"],
      stock: 156
    },
    {
      title: "Organic Cotton Oversized Tee",
      description:
        "Sustainable comfort meets contemporary style. Made from 100% organic cotton for a soft, breathable feel.",
      price: 59,
      originalPrice: null,
      brand: "ESSENCE",
      category: "Fashion",
      rating: 4.7,
      reviews: 892,
      isBestSeller: false,
      isNew: true,
      fastDelivery: false,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80"
      ],
      features: ["100% organic cotton", "Relaxed oversized fit", "Pre-washed for softness", "Eco-friendly dyes", "Fair trade certified"],
      colors: ["White", "Black", "Sage", "Sand"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      stock: 234
    },
    {
      title: "Professional Camera Lens Kit",
      description:
        "Capture stunning images with professional-grade optics. This comprehensive lens kit elevates your photography to the next level.",
      price: 849,
      originalPrice: 1099,
      brand: "OpticsPro",
      category: "Electronics",
      rating: 4.9,
      reviews: 567,
      isBestSeller: true,
      isNew: false,
      fastDelivery: true,
      imageUrl: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=1200&q=80",
        "https://images.unsplash.com/photo-1606986628253-e0f5c988d41d?w=1200&q=80"
      ],
      features: [
        "Ultra-wide 16-35mm f/2.8",
        "Standard 24-70mm f/2.8",
        "Telephoto 70-200mm f/2.8",
        "Weather-sealed construction",
        "Premium carrying case"
      ],
      stock: 12
    },
    {
      title: "Handcrafted Leather Backpack",
      description:
        "A timeless piece crafted by skilled artisans using premium full-grain leather. Built to last a lifetime.",
      price: 245,
      originalPrice: null,
      brand: "ARTISAN",
      category: "Accessories",
      rating: 4.8,
      reviews: 1234,
      isBestSeller: false,
      isNew: false,
      fastDelivery: false,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80"
      ],
      features: ["Full-grain leather", "Laptop compartment (15\")", "YKK zippers", "Padded straps", "Lifetime warranty"],
      colors: ["Cognac", "Black", "Dark Brown"],
      stock: 67
    },
    {
      title: "Ceramic Pour Over Coffee Set",
      description:
        "Brew the perfect cup every time. This handmade ceramic set brings the art of pour-over coffee to your kitchen.",
      price: 79,
      originalPrice: 99,
      brand: "BrewCraft",
      category: "Home",
      rating: 4.5,
      reviews: 2156,
      isBestSeller: false,
      isNew: true,
      fastDelivery: false,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
        "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80"
      ],
      features: ["Handmade ceramic", "Includes dripper & carafe", "Heat-resistant glass", "Reusable metal filter", "Recipe guide included"],
      colors: ["Matte White", "Charcoal", "Terracotta"],
      stock: 89
    },
    {
      title: "Premium Yoga Mat with Alignment Lines",
      description:
        "Elevate your practice with our premium yoga mat featuring laser-etched alignment lines for perfect positioning.",
      price: 89,
      originalPrice: null,
      brand: "ZenFit",
      category: "Home",
      rating: 4.7,
      reviews: 1876,
      isBestSeller: false,
      isNew: false,
      fastDelivery: true,
      imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80"
      ],
      features: ["6mm eco-friendly TPE", "Alignment guide system", "Non-slip dual surface", "Includes carry strap", "Easy to clean"],
      colors: ["Forest Green", "Ocean Blue", "Lavender", "Black"],
      stock: 203
    },
    ...appleProducts
  ]);

  // eslint-disable-next-line no-console
  console.log("[seed] done. admin/admin@gmail.com, user/user@example.com, password=password123");
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", err);
  process.exit(1);
});

