const { execSync } = require("child_process");
const fs = require("fs");

require("dotenv").config();

const wordcount = require("word-count");

const { createWordpressDraft } = require("./api");
const { generateArticle, generateTitles } = require("./gen");
const { logger } = require("./logger")
const { queryDdg, summarizeContent } = require("./serp");

const { serve } = require("@hono/node-server");
const { Hono } = require("hono");

const readKeywords = () => {
  const files = fs.readdirSync("./keywords");
  return files;
};

const main = async (keyword, skipPublish = false) => {
  if (!keyword) {
    logger.info("Please provide a keyword");
    return;
  }

  logger.info(`Processing keyword: ${keyword}`);

  // const results = await queryGoogle(keyword);
  const results = await queryDdg(keyword);

  if (results.length === 0) {
    logger.info(
      "No results found. Something might be wrong with this keyword. Skipping...",
    );
    return;
  }

  let summaries = [];

  for (const result of results) {
    logger.info(`PROCESSING "${result.title} - ${result.url}"`);
    const summary = await summarizeContent(result.url);
    summaries.push(summary);
  }
  logger.info(`Summarized ${summaries.length} articles. Generating article...`);

  const article = await generateArticle(keyword, summaries);
  logger.info(`Article generated. ${wordcount(article)} words`);

  const titles = await generateTitles(keyword);
  logger.info(`Titles generated: \n${titles}`);

  const fileContent = `
    ${titles} 

    ${article}
  `;

  const enableWordpress = process.env.ENABLE_WORDPRESS;
  if (!skipPublish && enableWordpress) {
    logger.info(`Creating Wordpress draft with title: ${keyword}`);
    await createWordpressDraft(keyword, fileContent);
    logger.info(`Wordpress draft created`);
  }

  fs.writeFileSync(`./articles/${keyword}.md`, fileContent);
  logger.info(`Article saved to ./articles/${keyword}.md`);

  // logger.info(`Deleting keyword file`);
  // fs.unlinkSync(`./keywords/${keyword}`);

  logger.info("DONE");
  return { keyword, titles, article };
};

const run = async () => {
  const keywords = readKeywords();
  await main(keywords[0]);
  execSync("sleep 5");
  run();
};

const app = new Hono();
app.get("/", async (c) => {
  const keyword = c.req.query("keyword");
  const skipPublish = !!c.req.query("skip_publish") || false;
  if (!keyword) {
    return c.throw(400, "Please provide a keyword");
  }

  const result = await main(keyword, skipPublish);
  return c.json(result);
});

const port = process.env.PORT || "5139";

serve({
  fetch: app.fetch,
  port,
});

console.log(`Listening on port ${port}`);

module.exports = { logger }
