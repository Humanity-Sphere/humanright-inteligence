# Article Generation Tool

(README generated with AI. This is an old project I'm putting up for posterity in case anyone finds it useful 👍)

This is a Node.js application that generates articles based on a given keyword. It queries a search engine (DuckDuckGo), summarizes the content of the search results, and generates a draft article using the summaries with AI. The generated article can be published as a WordPress draft or saved as a Markdown file.

## Getting Started

1. Install the required dependencies: `npm install`
2. Create a `.env` file and provide the necessary environment variables (e.g., API keys, credentials): `cp .env.example .env` and fill it out
3. Add your keywords to the `./keywords` directory, one keyword per file
4. Run the application: `node index.js`

## Usage

The application can be run in two modes:

1. **Command Line**: The `main` function accepts a keyword as an argument and an optional `skipPublish` flag to skip publishing the article to WordPress.

2. **HTTP Server**: The application runs an HTTP server that listens for GET requests at the `/` endpoint. The keyword can be provided as a query parameter (`?keyword=<keyword>`), and the `skip_publish` query parameter can be used to skip publishing the article to WordPress.

## Example

```
curl http://localhost:5139/?keyword=ai&skip_publish=true
```

This will generate an article based on the keyword "ai", but skip publishing it to WordPress. The response will be a JSON object containing the generated titles and article content.
