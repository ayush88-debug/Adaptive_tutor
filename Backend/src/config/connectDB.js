import mongoose from 'mongoose'


const connectDB = async () => {
    try{
        const DB_instance = await mongoose.connect(process.env.MONGODB_URL)
        console.log("MongoDb connected :",DB_instance.connection.host);
    }
    catch(err) {
        console.error("MongoDb connection  failed :", err);
        process.exit(1);
    }
}

export default connectDB