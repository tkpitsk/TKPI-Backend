import mongoose from "mongoose";
import dotenv from "dotenv";
import Brand from "../src/models/Brand.js";

dotenv.config();

const MONGO_URI = "mongodb+srv://tkpitsk_db_user:BwbLj5U6WxxHwjh6@cluster0.sdksnco.mongodb.net/?appName=Cluster0";

const brands = [
  "SAIL",
  "RINL",
  "JSW",
  "JSPL",
  "ESSAR"
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        for (const name of brands) {
            const exists = await Brand.findOne({ name });
            if (!exists) {
                console.log(`Seeding brand: ${name}...`);
                await Brand.create({
                    name,
                    status: "active"
                });
            } else {
                console.log(`Brand already exists: ${name}`);
            }
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
