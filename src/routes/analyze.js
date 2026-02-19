const express = require("express");
const multer = require("multer");
const analyzeController = require("../controllers/analyzeController");

const router = express.Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/", upload.single("vcf"), analyzeController.analyze);

module.exports = router;
