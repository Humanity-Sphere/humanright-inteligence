const { model, openaiClient } = require("./api");
const { logger } = require("./logger")

const wordcount = require("word-count");

const generateTitles = async (keyword) => {
  const content = `
    Generate 10 SEO-optimized titles for the following keyword: ${keyword}.
  `;

  const response = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: "user", content },
    ],
  });

  const message = response.choices[0].message;
  return message.content;
};

const generateArticle = async (topic, summaries) => {
  const summariesAsText = summaries.filter((s) => !!s).map((summary) =>
    summary.content
  );

  const currentToken = 0;

  const minimumWordCount = 1700;

  const content = `
    Write an article about the following topic: ${topic}. 

    Use the following contents of similar articles to construct the article. Do not repeat the same content. Use a tone that is appropriate for a blog post. The article should be SEO-optimized. The article must be more than ${minimumWordCount} words. It must be formatted as Markdown.
    
    In the introductory paragraph, introduce the topic and the main points of the article. Also, declaratively answer any questions that the reader may have in a format that is Google SEO-friendly. Generate Markdown links as often as possible for anything that should be linked to. You must generate at least one Markdown link in the first two paragraphs linking to the concept or project.

    You should provide the reader with all the information they need to solve the problem/question or otherwise give them a solution.

    In the body, elaborate on the main points. Each section indicated by an h2 header must contain at least 100 words. In the conclusion, summarize the main points and provide a call to action.

    The blog post will be longer than you are able to generate in a single request. Generate the article in increments of 1000 tokens. Start at token ${currentToken}. When you are done, add the text "$COMPLETED" to the end of the article.

    ${summariesAsText.join("\n")}

    Do not repeat any of the content you have already generated. If you do, you will be penalized. Don't output any information about the articles that you are referencing either, or promote them in any way (do not generate links to them).
  `;

  let finalContent = "";

  while (wordcount(finalContent) < minimumWordCount) {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            `Act as a technical writer creating SEO-optimized articles for a blog. Use very plain language and focus on the information you are trying to present. You must generate at least ${
              minimumWordCount - wordcount(finalContent)
            } more words.`,
        },
        { role: "user", content },
      ],
    });

    const message = response.choices[0].message;

    finalContent += message.content;

    if (message.content.includes("$COMPLETED")) {
      break;
    }

    logger.info(`${wordcount(finalContent)} words generated, continuing...`);
  }

  finalContent = finalContent.replace("$COMPLETED", "");

  return finalContent;
};

module.exports = {
  generateTitles,
  generateArticle,
};
