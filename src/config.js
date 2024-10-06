const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
dotenv.config({ path: "./.env" });

const app = express();
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((e) => {
    console.log("MongoDB connected successfully ");
  })
  .catch(() => {
    console.log("API_KEY:", process.env.DATABASE);
    console.log("Database cannot be conneted");
  });
// create schema
const LoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

// Collection Part
const User = new mongoose.model("users", LoginSchema);

module.exports = User;
