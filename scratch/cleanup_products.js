import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb+srv://tkpitsk_db_user:BwbLj5U6WxxHwjh6@cluster0.sdksnco.mongodb.net/?appName=Cluster0";

async function cleanup() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        const collections = [
            "products",
            "variants",
            "baserates",
            "stocks",
            "stockmovements"
        ];

        for (const collName of collections) {
            console.log(`Clearing collection: ${collName}...`);
            await mongoose.connection.db.collection(collName).deleteMany({});
            console.log(`Collection ${collName} cleared.`);
        }

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanup();
