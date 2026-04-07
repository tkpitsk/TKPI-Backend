import "./config/env.js";

import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 5555;

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});