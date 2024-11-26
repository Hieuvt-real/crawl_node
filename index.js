const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cherrio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const app = express();
const port = 9000;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
dotenv.config();
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
