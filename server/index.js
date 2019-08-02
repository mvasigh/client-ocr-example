require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const base64 = require("base64-img");
const vision = require("@google-cloud/vision");
const visionClient = new vision.ImageAnnotatorClient();

function b64ToImage(base64Image) {
  return new Promise((resolve, reject) => {
    base64.img(base64Image, "temp", String(Date.now()), (err, path) => {
      if (err) return reject(err);
      resolve(path);
    });
  });
}

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/api/ocr", async (req, res) => {
  console.log('Handling OCR request...');
  const imageUri = req.body.imageUri;
  const img = await b64ToImage(imageUri);
  const [result] = await visionClient.textDetection(img);
  const detections = result.textAnnotations;
  res.json(detections);
});

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
