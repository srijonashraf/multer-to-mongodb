const mongoose = require("mongoose");

const UploadSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    data: {
      type: Buffer, // Store binary data as Buffer
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UploadModel = mongoose.model("uploads", UploadSchema);

module.exports = UploadModel;
