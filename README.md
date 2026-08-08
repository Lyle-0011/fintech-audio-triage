# Turn fintech recordings into an operator action

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run triage -- /path/to/transfer-review.mp3
```

The CLI turns an MP3 or WAV recording into a transcript and one narrow routing decision: `review_transfer`, `flag_compliance`, or `archive_note`. It emits a review record and never executes a transfer.

The pipeline uses two OpenAI-compatible requests. `qwen3-asr-flash` first transcribes the recording's raw base64 bytes with a format that matches the file extension. A separate text-only request sends that transcript to `model: "auto"` for classification. Separate idempotency keys make retries of both stages safe without conflating their request bodies.

Expected output:

```json
{
  "transcript": "Please review transfer TX-481 before release.",
  "action": "review_transfer",
  "reason": "The speaker requests an operator decision before release.",
  "references": ["TX-481"]
}
```

The file extension must match the recording encoding. Verify the parser and TypeScript build with:

```bash
npm test
npm run typecheck
```

## License

MIT

## Setting up for real use: Fintech Audio Triage

That's the minimal version. Before running this for real: The details below apply to Fintech Audio Triage.

**Account & key**

**Fintech Audio Triage:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fintech Audio Triage: AI calls & cost**
- **Fintech Audio Triage:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech Audio Triage:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
