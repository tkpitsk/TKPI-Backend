import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://tkpitsk_db_user:BwbLj5U6WxxHwjh6@cluster0.sdksnco.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

async function testSession() {
    try {
        await mongoose.connect(MONGO_URI);
        const Variant = require("./src/models/Variant.js").default;
        
        const doc = new Variant({ productId: new mongoose.Types.ObjectId(), variantName: "test", unit: "kg" });
        console.log("Has $session?", typeof doc.$session === "function");
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testSession();
