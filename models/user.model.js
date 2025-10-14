import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
    {
    name:{
        type:String,
        required:[true," Phải nhập tên"]
    },
    email:{
        type:String,
        required:[true," Phải nhập email"],
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true," Phải nhập mật khẩu"],
        minlength:[6," Mật khẩu phải có ít nhất 6 ký tự"],
    },
    cartItems:[
        {
            quantity:{
                type:Number,
                default:1
            },
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
            }
            }
    ],
    role:{
        type:String,
        enum:["customer","admin"],
        default:"customer"
    },
},
//createdAt, updatedAt
    {
    timestamps:true,
    }
);

// pre-save hook to hash password before saving to database ( middleware)
userSchema.pre("save",async function(next){
    if(!this.isModified("password"))
        return next();

    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    }
    catch(error){
        next(error);
    } 
    })

userSchema.methods.comparePassword = async function(enteredPassword){
    return bcrypt.compare(enteredPassword,this.password) 
}

const User = mongoose.model("User",userSchema);

export default User;