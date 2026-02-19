require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const analyzeRoute = require("./routes/analyze");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.use("/api/analyze", analyzeRoute);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
