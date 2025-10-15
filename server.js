import express from "express";
import dotenv from "dotenv";
import path from "path";
import authRouters from "./routes/auth.route.js";
import productRouters from "./routes/product.route.js";
import cartRouters from "./routes/cart.route.js";
import couponRouters from "./routes/coupon.route.js";
import paymentRouters from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import cookieParser from 'cookie-parser';
import { connectDB } from "./lib/db.js";
import cors from "cors";

dotenv.config()

const app = express();
app.use(cors({
  origin: [
    "https://mern-ecommerce-sage-five.vercel.app", // domain FE
    "http://localhost:5173"                   // domain dev local (nếu cần)
  ],
  credentials: true,
  method:["GET","POST","PUT","DELETE","PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],// nếu bạn dùng cookie-based auth
}));
// const PORT 
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();
app.use(express.json({limit:"10mb"})); // allow json data to be sent in the request body
app.use(cookieParser());

 // allow json data to be sent in the request body
 app.get("/", (req, res) => {
  res.send("Express is working!");
});

app.use("/api/auth", authRouters);
app.use("/api/products",productRouters);
app.use("/api/cart",cartRouters);
app.use("/api/coupons",couponRouters);
app.use("/api/payments",paymentRouters);
app.use("/api/analytics",analyticsRoutes);

// if (process.env.NODE_ENV === "production") {
// 	app.use(express.static(path.join(__dirname, "/frontend/dist")));

// 	app.use((req, res) => {
// 		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
// 	});
// }


app.listen(PORT,()=> {
	console.log('aaa');
    console.log("Server is running on http://localhost:"+ PORT);
    console.log(`🌐 Public URL: ${process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || "localhost:" + PORT}`);
    connectDB();
});
 