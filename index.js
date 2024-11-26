const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const app = express();
const port = 9000;

const url = "https://ehurt24wolka.site/products/list";

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
// https://v0.dev/chat/72U1IuSXVFT
app.get("/", async (req, res) => {
  try {
    const config = {
      headers: {
        Accept: "application/json, text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    };

    const response = await axios.get(url, config);

    const $ = cheerio.load(response.data);
    console.log(response.data);

    const products = [];
    $("table tbody tr").each((index, element) => {
      const $tds = $(element).find("td");
      const product = {
        name: $tds.eq(0).text().trim(),
        code: $tds.eq(1).text().trim(),
        price: $tds.eq(2).text().trim(),
        categories: $tds.eq(3).text().trim(),
        color: $tds.eq(4).text().trim(),
        size: $tds.eq(5).text().trim(),
        store: $tds.eq(6).text().trim(),
        createdBy: $tds.eq(7).text().trim(),
        description: $tds.eq(8).text().trim(),
        createdAt: $tds.eq(9).text().trim(),
      };
      products.push(product);
    });
    res.send(JSON.stringify(products));
    // axios(url).then((response) => {
    //   const html = response.data;
    //   const $ = cheerio.load(html);

    //   console.log(html);

    //   let listData = [{}];
    //   //   function () {
    //   //     const name = $(this).find(".ant-table-cell: nth-child(1)").text();
    //   //     const data = {
    //   //       name,
    //   //     };
    //   //     listData = [...listData, data];
    //   //   }
    //   $(".ant-table-row ng-star-inserted").each((index, ele) => {
    //     const name = $(ele).find(".ant-table-cell: nth-child(1)").text();
    //     const data = {
    //       name,
    //     };
    //     listData = [...listData, data];
    //   });

    //   //   console.log(listData);

    //   res.send(JSON.stringify(html));
    // });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
