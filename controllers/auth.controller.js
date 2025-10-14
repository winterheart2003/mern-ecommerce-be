import User from "../models/user.model.js"
import jwt from "jsonwebtoken"
import {redis} from "../lib/redis.js"

const generateToken = (userId)=>{
    const accessToken = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"15m"
    });

    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:"7d"
    });
    return {accessToken,refreshToken}

}

const StoreRefreshToken = async(userId,refreshToken)=>{
    await redis.set(`refresh_token:${userId}`,refreshToken,"EX",7*24*60*60); //7days 
}

const setCookies = (res,accessToken,refreshToken)=>{
    res.cookie("accessToken",accessToken,{
        httpOnly:true, // chặn xss , cross site scripting 
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict", // chặn csrf cross-site request forgery
        maxAge:15*60*1000, // 15m
})
    res.cookie("refreshToken",refreshToken,{
    httpOnly:true, // chặn xss , cross site scripting 
    secure:process.env.NODE_ENV === "production",
    sameSite:"strict", // chặn csrf cross-site request forgery
    maxAge:7*24*60*60*1000, // 7days
})
}
export const signup = async(req,res)=>{
    const {email,password,name} = req.body
   
try{
    const userExists = await User.findOne({email})

   if(userExists){
    return res.status(400).json({message:"Người dùng đã tồn tại"})
   }
   const user = await User.create({email,password,name})

   // authenticate 
   const {accessToken,refreshToken} = generateToken(user._id)
   await StoreRefreshToken(user._id,refreshToken)

   setCookies(res,accessToken,refreshToken)
   res.status(201).json({
    user:{
        _id:user._id,
        name:user.name,
        email:user.email,
        role:user.role,
   },
    message:"Tạo tài khoản thành công"})
}
catch(error){
    console.log("Error in signup controller \n",error.errors.password.message);

    if (error.name === "ValidationError" && error.errors?.password) {
        return res.status(400).json({ message: error.errors.password.message });
    }

    res.status(500).json({message:error.message});
}

 }

export const login = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email})
        if(user && (await user.comparePassword(password))){
            const {accessToken, refreshToken} = generateToken(user._id);

            await StoreRefreshToken(user._id,refreshToken)
            setCookies(res,accessToken,refreshToken);
            
            res.status(200).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
            });
        }
        else{
            res.status(401).json({message:"Email hoặc mật khẩu không hợp lệ"});
        }
    }
    catch(error){
        console.log("Error in login controller",error.message);
        res.status(500).json({message:error.message});
        
    }
}

export const logout = async(req,res)=>{
    try{
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
            await redis.del(`refresh_token:${decoded.userId}`)      
        }
        else{
            return res.status(400).json({message:"No refresh token found"})
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({message:"Logout successfully"})
    }
    catch(error){
        res.status(500).json({message:"Server error",error1:error.message})
    }
    res.send("logout Route called")
}

// this will refress the access token
export const refreshToken = async(req,res) =>{
try{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
        return res.status(401).json({message:"No refresh token found"})
    }

    const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if(storedToken !== refreshToken)
        return res.status(401).json({message:"Invalid refresh token"}) 
    
    const accessToken = jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"15m"
    });

    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge:15*60*1000,     
    })

    res.json({message:"Token refreshed successfully"}) 
}
catch(error){
    console.log("Error in refreshToken controller",error.message);
    res.status(500).json({message:"Server error",error:error.message});
}
}

export const getProfile = async (req, res)=>{
    try {
        // console.log("in ",req)
        res.json(req.user);
    } catch (error) {
        res.status(500).json({message:"Server error",error:error.message});
    }
}
