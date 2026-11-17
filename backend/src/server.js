
require("dotenv").config();

// Validate required environment variables
const requiredEnvVariables = [
    "MONGO_URI",
    "JWT_SECRET"
];

const missingVariables = requiredEnvVariables.filter(
    (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
    console.error(
        `Missing environment variables: ${missingVariables.join(", ")}`
    );
    process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );
        process.exit(1);
    }
};

startServer();
