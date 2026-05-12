import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatStepPrompt,
  getModelMatchScore,
  parseCollabInput,
} from "../extensions/collab.ts";

describe("parseCollabInput", () => {
  it("accepts a JSON array of sequential model jobs", () => {
    const plan = parseCollabInput(
      JSON.stringify([
        { model: "gpt-5.5", job: "do code review and write FINDINGS.md" },
        { model: "opus-4.7", job: "implement the top issue" },
      ]),
    );

    assert.equal(plan.steps.length, 2);
    assert.equal(plan.steps[0].model, "gpt-5.5");
    assert.equal(plan.steps[1].job, "implement the top issue");
    assert.equal(plan.restoreModel, false);
  });

  it("accepts an object wrapper with restoreModel", () => {
    const plan = parseCollabInput(
      JSON.stringify({
        restoreModel: true,
        steps: [{ model: "anthropic/claude-opus-4-7", job: "review" }],
      }),
    );

    assert.equal(plan.restoreModel, true);
    assert.equal(plan.steps[0].model, "anthropic/claude-opus-4-7");
  });

  it("rejects malformed steps", () => {
    assert.throws(() => parseCollabInput("[]"), /at least one step/);
    assert.throws(() => parseCollabInput(JSON.stringify([{ model: "", job: "review" }])), /model/);
    assert.throws(() => parseCollabInput(JSON.stringify([{ model: "gpt-5.5", job: "" }])), /job/);
  });
});

describe("model matching", () => {
  it("matches shorthand model names against provider model ids", () => {
    assert.equal(
      getModelMatchScore("opus-4.7", {
        provider: "anthropic",
        id: "claude-opus-4-7-20260501",
        name: "Claude Opus 4.7",
      }),
      70,
    );
    assert.equal(
      getModelMatchScore("gpt-5.5", {
        provider: "openai",
        id: "gpt-5.5",
        name: "GPT 5.5",
      }),
      100,
    );
  });
});

describe("formatStepPrompt", () => {
  it("wraps the job with workflow context", () => {
    const prompt = formatStepPrompt({ model: "gpt-5.5", job: "write FINDINGS.md" }, 0, 3);

    assert.match(prompt, /Pi Collab step 1\/3/);
    assert.match(prompt, /Model requested: gpt-5\.5/);
    assert.match(prompt, /write FINDINGS\.md/);
    assert.match(prompt, /pi-collab-ext will advance/);
  });
});
