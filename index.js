const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const UploadModel = require("./UploadModel");
const app = express();
const UPLOAD_DESTINATION = "./uploads";
const dotenv = require("dotenv").config();

//Create folder if its not exist
fs.mkdirSync(UPLOAD_DESTINATION, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DESTINATION);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = file.originalname
      .replace(fileExt, "")
      .toLowerCase()
      .split(" ")
      .join("-");
    cb(null, fileName + Date.now() + fileExt);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000000,
  },

  //Set file filter
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .pdf format allowed"));
    }
  },
});

//Router

//Upload File

//The frontenf form or postmane form field name have to be "file" else it will not work.
app.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "No file uploaded" });
    }

    // Read the file content using file streams
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath);

    const newFile = new UploadModel({
      fileName: req.file.filename,
      data: fileContent,
      mimetype: req.file.mimetype,
    });
    await newFile.save();

    //Delete file from local machine after successfully uploaded into DB.
    fs.unlinkSync(filePath);

    res.status(200).json({
      status: "success",
      message: "File Uploaded Successfully",
      data: newFile,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
});

//Fetch File By Id
app.get("/fetchFile/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await UploadModel.findById(fileId);
    if (!file) {
      return res
        .status(404)
        .json({ status: "fail", message: "File not found" });
    }

    // Set the appropriate content type based on the file's mimetype
    res.setHeader("Content-Type", file.mimetype);

    // Send the file data as the response
    res.send(file.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
});

//Welcome

app.get("/", (req, res) => {
  res.send("Welcome to Express App!");
});

//Error handling Middleware
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      console.log(err);
      res.status(500).json({
        status: "fail",
        message: "There is an upload error check extension and file size.",
      });
    } else {
      res.status(500).json({ status: "fail", message: err });
    }
  } else {
    res
      .status(200)
      .json({ status: "success", message: "File uploaded successfully!" });
    next();
  }
});

//Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log("DB is connected!");
  })
  .catch((err) => {
    console.log(err);
  });

//Run server
app.listen(3100, () => {
  console.log("App is running on 3100");
});



module.exports = app;