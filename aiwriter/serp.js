const { model, openaiClient } = require("./api");
const { logger } = require("./logger")
const cheerio = require("cheerio");
const google = require("googlethis");

const queryDdg = async (keyword) => {
  const url = `https://html.duckduckgo.com/html/?q=${keyword}`;
  const html = await fetch(url);
  const text = await html.text();
  const $ = cheerio.load(text);
  const weirdUrls = $(".result__a").slice(0, 5).map((i, el) => {
    return $(el);
  }).toArray();

  const urls = weirdUrls.map((cheerioEl) => {
    const url = cheerioEl.attr("href");
    const urlObj = new URL(`https:` + url);
    return {
      title: cheerioEl.text(),
      url: urlObj.searchParams.get("uddg"),
    };
  });

  return urls;
};

const queryGoogle = async (keyword) => {
  const search = await google.search(keyword);
  return search.results.slice(0, 5);
};

const summarizeContent = async (url) => {
  let html;
  try {
    html = await fetch(url);
  } catch (e) {
    logger.info(`Error fetching ${url}. Skipping...`);
    return;
  }

  const text = await html.text();

  const $ = cheerio.load(text);
  const body = $("h1, h2, h3, h4, h5, h6, p");

  const content = `
    Helpfully summarize the following content:

    ${body.text().slice(0, 14000)}
  `;

  const messages = [
    {
      role: "system",
      content:
        "Act as a helpful program that can summarize the content of an article. You should be detailed as possible.",
    },
    { role: "user", content },
  ];

  const response = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo-16k",
    messages,
  });

  return response.choices[0].message;
};

module.exports = {
  queryGoogle,
  queryDdg,
  summarizeContent,
};
