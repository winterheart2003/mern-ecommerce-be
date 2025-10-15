import express from "express";
import {signup,login,logout,refreshToken,getProfile} from "../controllers/auth.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/",(req,res)=>{
    console.log("Request nhận được: ..", req.method, req.cookies);
    res.send("Auth route is working")
})
router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)
router.post("/refresh-token",refreshToken)
router.get("/profile",protectRoute,getProfile);

export default router