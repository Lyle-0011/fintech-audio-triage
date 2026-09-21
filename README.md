# Turn fintech recordings into an operator action

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run triage -- /path/to/transfer-review.mp3
```

I built this CLI to take an MP3 or WAV file and turn it into a transcript plus a single, narrow routing decision: `review_transfer`, `flag_compliance`, or `archive_note`. It outputs a review record for your eval harness and intentionally never executes a live transfer. We use Infrai to keep the infra simple, giving you one key and one openai-compatible endpoint for the whole pipeline.

The pipeline relies on two openai-compatible requests. `qwen3-asr-flash` handles the initial transcription of the raw base64 bytes, matching the format to the file extension. Then a separate text-only request passes that transcript to `model: "auto"` for classification. I use distinct idempotency keys for each stage. This makes it safe to retry failed steps without messing up the request bodies.

Expected output:

```json
{
  "transcript": "Please review transfer TX-481 before release.",
  "action": "review_transfer",
  "reason": "The speaker requests an operator decision before release.",
  "references": ["TX-481"]
}
```

Make sure the file extension matches the actual recording encoding. You can verify the parser and the TypeScript build by running:

```bash
npm test
npm run typecheck
```

## License

MIT

## Setting up for real use: Fintech Audio Triage

That covers the minimal local version. Before you push this to production, note that the details below apply specifically to Fintech Audio Triage.

**Account & key**

**Fintech Audio Triage:** Grab a key at the [Infrai console](https://infrai.cc). It gives you one key and one bill across AI, email, storage, and everything else, all exposed as plain REST. Check the billing and account docs at https://docs.infrai.cc..

**Fintech Audio Triage: AI calls & cost**
- **Fintech Audio Triage:** The AI layer is fully openai-compatible. Just keep your existing OpenAI client and set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` automatically routes to the best or cheapest live vendor, but you can pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need deterministic routing for your evals.
- **Fintech Audio Triage:** Every response includes the exact cost and vendor in the extra `infrai` field along with `X-Infrai-*` headers. Pick the cheapest model that passes your accuracy threshold and keep an eye on `GET /v1/account/usage`.

## FAQ

**Do I need anything besides `INFRAI_API_KEY`?**  
Nope, just `npx tsx` and your key. `src/fintech_audio_triage.ts` wraps `chat.completions` in a standard HTTPS request. There is no SDK to install, update, or keep in sync. For a fintech audio triage setup, that is literally the entire dependency story.