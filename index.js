import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { launch } from "puppeteer";
import {
  navigateToNextPage,
  scrapePageWithRetry,
  setItemsPerPage,
} from "./utils.js";
import fs from "fs/promises";
import moment from "moment";

const app = express();
const port = 9000;

const url = "https://ehurt24wolka.site/products/list";

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
config();
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
// https://v0.dev/chat/72U1IuSXVFT

const maxRetries = 3;
const delayBetweenPages = 1000;
const jsonOutputFile = "products.json";
const navigationTimeout = 60000;
const targetDate = "2024-11-27";

app.get("/v1/data", async (req, res) => {
  let browser;
  try {
    browser = await launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(navigationTimeout);
    await page.goto(url, { waitUntil: "networkidle0" });

    // Try to set items per page to 100
    const itemsPerPageSet = await setItemsPerPage(page, 100);
    if (!itemsPerPageSet) {
      console.log(
        "Failed to set items per page. Proceeding with default pagination."
      );
    }

    let allProducts = [];
    let hasNextPage = true;
    let currentPage = 1;

    while (hasNextPage) {
      console.log(`Scraping page ${currentPage}...`);

      const products = await scrapePageWithRetry(page, currentPage, maxRetries);

      if (products.length > 0) {
        const hasInvalidDate = products.some((item) => {
          const itemDate = moment(item.createdAt, "YYYY-MM-DD");
          return itemDate.isBefore(targetDate, "day");
        });

        allProducts = [...allProducts, ...products];

        if (hasInvalidDate) {
          hasNextPage = false;
          break;
        }
        console.log(
          `Wrote ${products.length} products from page ${currentPage}`
        );
      } else {
        console.log(`No products found on page ${currentPage}. Ending scrape.`);
        hasNextPage = false;
        break;
      }
      //   // Check if there's a next page and navigate
      hasNextPage = await navigateToNextPage(page);
      if (hasNextPage) {
        currentPage++;
        await new Promise((resolve) => setTimeout(resolve, delayBetweenPages));
      }
    }
    // Write all products to JSON file
    await fs.writeFile(jsonOutputFile, JSON.stringify(allProducts, null, 2));
    return res.send(JSON.stringify(allProducts));
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
