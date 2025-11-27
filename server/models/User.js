const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // No password since login is Google-only
    password: {
      type: String,
      default: null,
      select: false, // hide it always (clean DB)
    },

    // Google unique ID
    googleId: {
      type: String,
      default: null,
    },

    // Google profile picture
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
