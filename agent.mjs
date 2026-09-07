// agent.mjs
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import * as z from "zod";

async function octenSearch(query, count = 5) {
  const response = await fetch("https://api.octen.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.OCTEN_API_KEY,
    },
    body: JSON.stringify({ query, count }),
  });
  if (!response.ok) {
    throw new Error(`Octen search failed with ${response.status}`);
  }
  const payload = await response.json();
  return payload.data?.results ?? [];
}

const webSearch = tool(
  async ({ query }) => {
    const results = await octenSearch(query);
    return (
      results
        .map(
          (r) =>
            `Title: ${r.title}\nURL: ${r.url}\n` +
            `Published: ${r.time_published ?? "unknown"}\n` +
            `Excerpt: ${r.highlight ?? ""}`,
        )
        .join("\n\n") || "No results found."
    );
  },
  {
    name: "web_search",
    description: [
      "Search the live web for current information.",
      "Call this whenever the answer depends on something that changes over time,",
      "such as software versions and release schedules, prices, standings, company",
      "news, or any question containing 'now', 'latest', or 'current'. Prefer",
      "calling it over answering from memory when you are unsure.",
      "Returns up to five ranked results, each with a title, URL, publication date,",
      "and an excerpt relevant to the query.",
    ].join(" "),
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  },
);

const agent = createAgent({
  model: new ChatOpenAI({ model: "gpt-5.4", apiKey: process.env.OPENAI_API_KEY }),
  tools: [webSearch],
  systemPrompt:
    "You answer questions about fast-moving technical facts. Search before " +
    "answering anything time-sensitive, and cite the URL you took each claim from.",
});

const question =
  "Which Node.js release line is on Active LTS right now, " +
  "and when does the next one take over?";

console.log(`Q: ${question}`);

const stream = await agent.stream(
  { messages: [{ role: "user", content: question }] },
  { streamMode: "values" },
);

for await (const step of stream) {
  const message = step.messages.at(-1);
  if (message.getType() === "ai" && message.tool_calls?.length) {
    console.log(`\n> searching: ${message.tool_calls[0].args.query}`);
  } else if (message.getType() === "tool") {
    console.log(`\n> results:\n${message.content}`);
  } else if (message.getType() === "ai") {
    console.log(`\n> answer:\n${message.content}`);
  }
}
