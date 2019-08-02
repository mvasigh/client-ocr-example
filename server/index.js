require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const vision = require("@google-cloud/vision");
const visionClient = new vision.ImageAnnotatorClient();

app.get("/api/ocr", (req, res) => {
  const imageUri = req.body.imageUri;
  console.log({ imageUri });
});

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
