# octen-search-agent

Companion code for the tutorial [How to Add Live Web Search to an AI Agent](https://octen.ai/blog).

An agent that recognizes when a question needs current information, calls Octen search as a tool, and answers from the results with sources. `agent.mjs` is the file from the tutorial, unchanged.

## Run it live

You need Node.js 22 or newer, an Octen API key from the [API platform](https://octen.ai/platform/api-keys), and an LLM API key from any provider whose models support function calling.

```bash
git clone https://github.com/OWNER/octen-search-agent.git
cd octen-search-agent
npm install

cp .env.example .env   # fill in both keys
export $(grep -v '^#' .env | xargs)

npm run verify-key     # confirms the Octen key before a model is involved
npm start              # runs the agent against one task
```

Expected output, with the result list shortened:

```
Q: Which Node.js release line is on Active LTS right now, and when does the next
one take over?

> searching: Node.js Active LTS release schedule 2026

> results:
Title: Node.js Releases
URL: https://nodejs.org/en/about/previous-releases
Published: unknown
Excerpt: Production applications should only use Active LTS or Maintenance LTS
releases...

[four more results]

> answer:
Node.js 24 is the current Active LTS line, and Node.js 22 is in Maintenance LTS.
Node.js 26 shipped as Current on May 5, 2026 and moves to Active LTS at the end
of its six-month Current phase.
Sources: https://nodejs.org/en/about/previous-releases, ...
```

The model writes its own answer each run, so your wording will differ. The search step and the sources are what to watch.

## Run it without keys

```bash
npm install
npm run demo
```

This runs the same LangChain loop with a stubbed model and a recorded Octen response, so you can see the tool call, the results going back into the loop, and the message flow without signing up for anything. The final answer is missing, because a stub model has nothing to say.

```bash
npm test
```

Three tests covering the search helper's handling of a successful response, a payload with no `data`, and a non-2xx status. No keys needed.

## License

MIT
