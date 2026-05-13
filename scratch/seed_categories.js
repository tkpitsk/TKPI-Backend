import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/models/Category.js";

dotenv.config();

const MONGO_URI = "mongodb+srv://tkpitsk_db_user:BwbLj5U6WxxHwjh6@cluster0.sdksnco.mongodb.net/?appName=Cluster0";

const categories = [
  "TMT Bar",
  "Lightweight TMT Bar",
  "MS Angle",
  "GI Angle",
  "Galvanized Angle",
  "MS Channel",
  "ISMC Channel",
  "MS Beam",
  "ISMB",
  "H Beam",
  "I Beam",
  "NPB",
  "WPB",
  "Universal Beam",
  "Universal Column",
  "MS Flat Bar",
  "Galvanized Flat Bar",
  "MS Round Bar",
  "MS Square Bar",
  "MS Plate",
  "Chequered Plate",
  "MS Pipe",
  "MS Square Pipe",
  "MS Rectangular Pipe",
  "Binding Wire",
  "HB Wire",
  "Wire Rod",
  "Ribbed Coil"
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        // Clear existing categories (optional, but clean for redoing)
        // console.log("Clearing existing categories...");
        // await Category.deleteMany({});

        for (let i = 0; i < categories.length; i++) {
            const name = categories[i];
            const exists = await Category.findOne({ name });
            if (!exists) {
                console.log(`Seeding category: ${name}...`);
                await Category.create({
                    name,
                    sortOrder: i + 1,
                    status: "active"
                });
            } else {
                console.log(`Category already exists: ${name}`);
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
