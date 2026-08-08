import assert from "node:assert/strict";
import test from "node:test";
import { parseFintechAudioResult } from "../src/fintech_audio_triage.ts";

test("accepts the triage contract", () => {
  const result = parseFintechAudioResult(
    JSON.stringify({
      transcript: "Please review transfer TX-481 before release.",
      action: "review_transfer",
      reason: "The speaker requests an operator decision before release.",
      references: ["TX-481"],
    }),
  );

  assert.equal(result.action, "review_transfer");
  assert.deepEqual(result.references, ["TX-481"]);
});

test("rejects an action outside the routing table", () => {
  assert.throws(() =>
    parseFintechAudioResult(
      JSON.stringify({
        transcript: "Transfer TX-481.",
        action: "release_transfer",
        reason: "A release was requested.",
        references: ["TX-481"],
      }),
    ),
  );
});

test("rejects additional fields outside the exact contract", () => {
  assert.throws(() =>
    parseFintechAudioResult(
      JSON.stringify({
        transcript: "Please review transfer TX-481 before release.",
        action: "review_transfer",
        reason: "The speaker requests an operator decision before release.",
        references: ["TX-481"],
        executeTransfer: true,
      }),
    ),
  );
});
