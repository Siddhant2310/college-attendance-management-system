
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Check MongoDB URI
        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from environment variables."
            );
        }

        // Connect to MongoDB
        const conn = await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            `MongoDB Connected: ${conn.connection.host}`
        );

    } catch (error) {
        console.error(
            "MongoDB Connection Error:",
            error.message
        );

        process.exit(1);
    }
};

// Monitor database connection
mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected.");
});

mongoose.connection.on("error", (error) => {
    console.error(
        "MongoDB Runtime Error:",
        error.message
    );
});

module.exports = connectDB;
