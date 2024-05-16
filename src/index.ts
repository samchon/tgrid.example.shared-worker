import browserify, { BrowserifyObject } from "browserify";
import fs from "fs";
import * as puppeteer from "puppeteer";
import { sleep_for } from "tstl";

const HttpServer = require("local-web-server");

const PORT = 37001;
const ROOT = "http://127.0.0.1:" + PORT;

const bundle = async (): Promise<void> => {
  const INSTANCES = ["server", "client"];
  for (const instance of INSTANCES)
    await new Promise<void>((resolve, reject) => {
      const bundler: BrowserifyObject = browserify(
        `${__dirname}/${instance}.js`,
      );
      bundler.external("worker_threads");
      bundler.bundle((err, src) => {
        if (err) reject(err);
        else {
          fs.writeFile(`${__dirname}/../bundle/${instance}.js`, src, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
};

const test = (page: puppeteer.Page): Promise<void> =>
  new Promise((resolve, reject) => {
    page.on("framenavigated", <any>resolve);
    page.on("close", resolve);
    page.on("pageerror", reject);
    page.on("console", (msg) => {
      console.log(msg.text());
    });
    sleep_for(2_000).then(() => page.close());
  });

const paginate = async (
  browser: puppeteer.Browser,
  url: string,
): Promise<void> => {
  console.log("\t" + url);
  url = ROOT + "/" + url;

  const page = await browser.newPage();
  await page.goto(url);
  await test(page);
};

const main = async (): Promise<void> => {
  // DO BUNDLING
  await bundle();

  // PREPARE SERVER & BROWSER
  const server = new HttpServer().listen({
    directory: __dirname + "/../bundle",
    port: PORT,
  });
  const browser = await puppeteer.launch({ devtools: true });

  // TEST PAGES
  try {
    await paginate(browser, "index.html");
  } catch (exp) {
    console.log("An error has occured");
    console.log(exp);
    process.exit(-1);
  }

  // TERMINATES
  await browser.close();
  server.close();
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
