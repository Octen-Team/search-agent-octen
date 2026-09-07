import test from "node:test";
import assert from "node:assert/strict";

const realFetch = globalThis.fetch;

function stubFetch(response) {
  globalThis.fetch = async () => response;
}

async function loadHelper() {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./agent.mjs", import.meta.url), "utf8"),
  );
  const helper = source.slice(
    source.indexOf("async function octenSearch"),
    source.indexOf("const webSearch"),
  );
  const module = await import(
    `data:text/javascript,${encodeURIComponent(helper + "\nexport { octenSearch };")}`
  );
  return module.octenSearch;
}

test("returns the results array on a successful response", async () => {
  const octenSearch = await loadHelper();
  stubFetch({
    ok: true,
    json: async () => ({
      code: 0,
      data: { results: [{ title: "A", url: "https://example.com" }] },
    }),
  });
  const results = await octenSearch("node lts");
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "A");
});

test("returns an empty array when the payload carries no data", async () => {
  const octenSearch = await loadHelper();
  stubFetch({ ok: true, json: async () => ({ code: 401, msg: "Invalid API Key" }) });
  assert.deepEqual(await octenSearch("node lts"), []);
});

test("throws on a non-2xx response", async () => {
  const octenSearch = await loadHelper();
  stubFetch({ ok: false, status: 429, json: async () => ({}) });
  await assert.rejects(() => octenSearch("node lts"), /429/);
});

test.after(() => {
  globalThis.fetch = realFetch;
});
