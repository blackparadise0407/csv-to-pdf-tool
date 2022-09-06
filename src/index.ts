import puppeteer from "puppeteer";
import hbs from "handlebars";
import path from "path";
import fs from "fs";

import { chunkArray, readFromCsvAsync, ROOT_DIR } from "./utils";

async function main() {
  const template = hbs.compile(
    fs.readFileSync(path.join(ROOT_DIR, "templates", "example.html"), "utf8")
  );

  try {
    const data = await readFromCsvAsync(path.join(ROOT_DIR, "data.csv"));
    const chunks = chunkArray(data, 3);

    for (const chunk of chunks) {
      const uid = Date.now().toString();

      for (const item of chunk) {
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.goto(item.postUrl, {
          waitUntil: "networkidle0",
        });

        await page.waitForSelector("[role='article']").catch(() => {
          item.base64Src = "";
        });
        await page.evaluate(() => {
          document.querySelector("#headerArea")?.remove();
        });
        const element = await page.$("[role='article']");
        let screenshot = await element
          ?.screenshot({ encoding: "base64" })
          .then(function (data) {
            return `${data}`;
          });
        item.base64Src = screenshot;
        await browser.close();
      }
      const finalHtml = encodeURIComponent(
        template({
          items: chunk,
        })
      );
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        headless: true,
      });
      const page = await browser.newPage();
      await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
        waitUntil: "networkidle0",
      });
      await page.pdf({
        format: "A4",
        headerTemplate: "<p></p>",
        footerTemplate: "<p></p>",
        displayHeaderFooter: false,
        margin: {
          top: "40px",
          bottom: "100px",
        },
        printBackground: true,
        path: `out/slide-${uid}.pdf`,
        landscape: true,
      });
      await browser.close();
    }
  } catch (e) {
    console.log(e);
  }
}

main();
