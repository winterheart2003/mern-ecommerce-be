import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

export  const connectDB = async () => {
    try {
        const conn  = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully ",conn.connection.host);
    }
    catch(error){
        console.log("MongoDB connection failed",error.message);
        process.exit(1); // Exit process with failure
    }
}