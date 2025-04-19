const openai = require("openai");
const openaiClient = new openai.OpenAI(process.env.OPENAI_API_KEY);
const model = process.env.OPENAI_MODEL || "gpt-4-1106-preview";

const createWordpressDraft = async (title, content) => {
  const wordpressApiUrl = "https://7.dev/wp-json/wp/v2/posts";
  const username = process.env.WP_USERNAME;
  const password = process.env.WP_PASSWORD;

  const token = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await fetch(wordpressApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        content: content,
        status: "draft",
      }),
    });

    const data = await response.json();
    console.log("Draft created:", data);
  } catch (error) {
    console.error("Error creating draft:", error);
  }
};

module.exports = {
  createWordpressDraft,
  openaiClient,
  model,
};
