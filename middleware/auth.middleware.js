import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    console.log("Cookies ở protectRoute", req.cookies); // Debug: Log all cookies
    try{
        const accessToken = req.cookies.accessToken;
        console.log("Access Token:", accessToken); // Debug: Log the access token
        if(!accessToken){
            return res.status(401).json({message:"Unauthorized - No access token provided"})
        }
        try{
        const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(401).json({message:"User not found"})
        }

        req.user = user;
        console.log("User authenticated: protectRoute", req.cookie); // Debug: Log authenticated user

            }catch(error){
                if(error.name === "TokenExpiredError")
                return res.status(401).json({message:"Unauthorized - Invalid access token"})
            
            throw error;
            }
        next();
        }
    catch(error){
        console.error("Error in protectRoute middleware;",error.message);
        res.status(401).json({message:"Unauthorized - Invalid access token",error:error.message});
    }
}


export const adminRoute = (req,res,next)=>{
    if(req.user && req.user.role === 'admin'){
        next();
    }else{
        return res.status(403).json({message:"Access denied - Admin only"});
    }
}