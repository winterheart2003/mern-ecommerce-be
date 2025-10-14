import { redis } from "../lib/redis.js";
import  cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res)=>{
    try{
        const products = await Product.find({});
        res.json(products);  
    }
    catch(error){
        console.error("Error in getAllProducts controller; ",error.message);
    res.status(500).json({message:"Server error",error: error.message});   }
}

export const getFeaturedProducts = async (req, res)=>{
    try{
        let featuredProducts = await  redis.get("featured_products");
        if(featuredProducts)
            return res.json(JSON.parse(featuredProducts));
        
        // .lean() sẽ trả về kiểu object javascript thay vì mongoose document,
        //  tốt cho hiệu suất khi trả về cho client 
        featuredProducts = await Product.find({isFeatured:true}).lean();

        if(!featuredProducts){
            return res.status(404).json({message:"No featured products found"});

        }

        // store in redis for future access 

        await redis.set("featured_products", JSON.stringify(featuredProducts))

        res.json({featuredProducts});
     } catch(error)
    {
        console.error("Error in getFeaturedProducts controller; ",error.message);
        res.status(500).json({message:"Server error",error: error.message});
}
}

export const createProduct = async (req, res) => {
    try{
        const {name, price, description, image, category} = req.body;

        let cloudinaryResponse = null;
        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products",});
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            // cloudinary tra ve url an toan nen can tra ve rong neu secure_url là rỗng 
            
        })

        res.status(201).json(product);
}catch(error){
    console.error("Error in createProduct controller ", error.message);
    res.status(500).json({message:"Server error", error: error.message});

}}

export const deleteProduct = async (req,res)=>{
    try {
        const product = await Product.findById(req.params.id)

        if(!product){
            return res.status(404).json({message:"Product not found"});
        }

        if(product.image){

            const publicId = product.image.split("/").pop().split(".")[0]; // sẽ lấy id của link url từ image
        try{
            await cloudinary.uploader.destroy(`products/${publicId}`);
            console.log("Image deleted from cloudinary");
        }catch(error){
            console.error("Error in deleteProduct controller; ",error.message);
            res.status(500).json({message:"Server error",error: error.message});
        }
}   

    await Product.findByIdAndDelete(req.params.id);

    res.json({message:"Product deleted successfully"});
 } catch (error) {
      console.error("Error in deleteProduct controller; ", error.message);
      res.status(500).json({message:"Server error", error: error.message});  
    }
}

export const getRecommendedProducts = async (req, res) => {
    try{
        const products = await Product.aggregate([ // tổng hợp 
            {
                $sample: { size: 3 } // Lấy ngẫu nhiên 5 sản phẩm
            },
            {
                $project: {
                    name: 1,
                    price: 1,
                    image: 1,
                    description: 1
                }
            }])

            res.json(products);
    }


    catch(error) {
        console.error("Error in getRecommendedProducts controller; ", error.message);
        res.status(500).json({message:"Server error", error: error.message});
    }
}

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;

    try{
        const products = await Product.find({ category });
        res.json(products);
    }
    catch(error) {
        console.error("Error in getProductsByCategory controller; ", error.message);
        res.status(500).json({message:"Server error", error: error.message});
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try{
        const product = await Product.findById(req.params.id);

        if(product){
            product.isFeatured = !product.isFeatured;  // Chuyển đổi trạng thái isFeatured
            const updatedProduct = await product.save(); // Lưu sản phẩm đã cập nhật
             // Cập nhật lại cache Redis nếu có
            await updateFeaturedProductsCache(); 
            res.json(updatedProduct);
        }
        else
            return res.status(404).json({message:"Product not found"});
        
    }
    catch(error){
        console.error("Error in toggleFeaturedProduct controller; ", error.message);
        res.status(500).json({message:"Server error", error: error.message});
    }
}

async function updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
       console.error("Error updating featured products cache; ", error.message); 
    }
}
