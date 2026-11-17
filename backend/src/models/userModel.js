
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        loginId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: undefined
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        role: {
            type: String,
            enum: ["ADMIN", "TEACHER", "STUDENT"],
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isFirstLogin: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with stored password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export User Model
const User = mongoose.model("User", userSchema);

module.exports = User;
