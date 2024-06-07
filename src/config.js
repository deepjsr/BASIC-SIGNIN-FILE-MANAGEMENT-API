const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

mongoose
  .connect("mongodb://localhost:27017/KYC", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((e) => {
    console.log("MongoDB connected successfully ");
  })
  .catch(() => {
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


module.exports = User ;
