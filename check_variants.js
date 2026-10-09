import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://tkpitsk_db_user:BwbLj5U6WxxHwjh6@cluster0.sdksnco.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

async function checkVariants() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log("Fetching all variants...");
        const variants = await db.collection("variants").find().toArray();
        console.log(`Found ${variants.length} variants`);
        if (variants.length > 0) {
            console.log(variants);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkVariants();
