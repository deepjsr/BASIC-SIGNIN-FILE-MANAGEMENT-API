// File schema
const { Schema, model } = require("mongoose");

const fileSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    taglines: {
      type: String,
      reqired: true,
    },
    image: {
      type: String,
      require: true,
    },
    psd: {
      type: String,
      require: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      enum: ["UNAPPROVED", "APPROVED","REJECTED"],
      default: "UNAPPROVED",
    },
  },
  { timestamps: true }
);

const File = model("files", fileSchema);

module.exports = File;
