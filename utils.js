import moment from "moment";

export async function scrapePageWithRetry(page, pageNumber, maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.waitForSelector(".ant-table-row", { timeout: 100000 });
      return await page.evaluate(() => {
        const rows = document.querySelectorAll(".ant-table-row");
        return Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");

          return {
            name: cells[0]?.textContent?.trim() || "",
            code: cells[1]?.textContent?.trim() || "",
            price: cells[2]?.textContent?.trim() || "",
            categories: cells[3]?.textContent?.trim() || "",
            color: cells[4]?.textContent?.trim() || "",
            size: cells[5]?.textContent?.trim() || "",
            store: cells[6]?.textContent?.trim() || "",
            createdBy: cells[7]?.textContent?.trim() || "",
            description: cells[8]?.textContent?.trim() || "",
            createdAt: cells[9]?.textContent?.trim() || "",
          };
        });
      });
    } catch (error) {
      console.error(
        `Error scraping page ${pageNumber}, attempt ${attempt}:`,
        error
      );
      if (attempt === maxRetries) throw error;
      await page.waitForTimeout(1000 * attempt); // Exponential backoff
    }
  }
}

export async function navigateToNextPage(page) {
  try {
    // const nextButtonSelector =
    //   ".ant-pagination-next .ant-pagination-item-link:not(:disabled)";
    const nextButtonSelector =
      "li.ant-pagination-next:not(.ant-pagination-disabled) button";
    const nextButton = await page.$(nextButtonSelector);

    if (nextButton) {
      //   await Promise.all([
      //     page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
      //     nextButton.click(),
      //   ]);
      const currentPageNumber = await page.$eval(
        ".ant-pagination-item-active",
        (el) => el.textContent
      );
      await nextButton.click();
      await page.waitForFunction(
        (prevPageNumber) => {
          const currentActive = document.querySelector(
            ".ant-pagination-item-active"
          );
          return currentActive && currentActive.textContent !== prevPageNumber;
        },
        { timeout: 30000 },
        currentPageNumber
      );
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn(
        "Navigation timeout occurred. Assuming navigation was successful."
      );
      return true;
    }
    console.error("Error navigating to next page:", error);
    return false;
  }
}

export async function setItemsPerPage(page, itemCount, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Setting items per page to ${itemCount} (Attempt ${attempt})...`
      );

      // Wait for the select element to be available
      await page.waitForSelector(
        "nz-select.ant-pagination-options-size-changer",
        { timeout: 60000 }
      );

      // Get the current number of rows
      const initialRowCount = await page.evaluate(
        () => document.querySelectorAll("tr.ant-table-row").length
      );

      // Click on the select to open the dropdown
      await page.click("nz-select.ant-pagination-options-size-changer");

      // Wait for the dropdown to open
      await page.waitForSelector(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
        { timeout: 60000 }
      );

      // Click on the option for 100 items per page
      await page.click(`.ant-select-item-option[title="${itemCount} / page"]`);

      // Wait for the page to reload with the new item count
      await page.waitForNavigation(
        (expectedCount, initialCount) => {
          const currentCount =
            document.querySelectorAll("tr.ant-table-row").length;
          return (
            currentCount !== initialCount &&
            (currentCount === expectedCount || currentCount < expectedCount)
          );
        },
        { timeout: 30000 },
        itemCount,
        initialRowCount
      );

      console.log("Items per page set successfully.");
      return true;
    } catch (error) {
      console.error(
        `Error setting items per page (Attempt ${attempt}):`,
        error
      );
      if (attempt === retries) {
        console.error("Failed to set items per page after multiple attempts.");
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
    }
  }
}

export function filterByDate(dataArray, inputDate) {
  // Định dạng ngày đầu vào
  const targetDate = moment(inputDate, "YYYY-MM-DD");

  // Lọc mảng dựa trên điều kiện ngày
  return dataArray.filter((item) => {
    const itemDate = moment(item.createdAt);
    return itemDate.isSameOrAfter(targetDate, "day");
  });
}
