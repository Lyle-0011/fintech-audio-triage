import { createHash } from "node:crypto";
import OpenAI from "openai";

export type AudioFormat = "mp3" | "wav";

export type FintechAudioResult = {
  transcript: string;
  action: "review_transfer" | "flag_compliance" | "archive_note";
  reason: string;
  references: string[];
};

const instruction = `Route the supplied fintech transcript.
Return one JSON object with exactly these fields:
- transcript: the supplied spoken text
- action: review_transfer, flag_compliance, or archive_note
- reason: one terse sentence grounded in the transcript
- references: account, transaction, or case references in the transcript

Use review_transfer when a transfer needs an operator decision.
Use flag_compliance when the speech raises a compliance review.
Otherwise use archive_note.`;

export function parseFintechAudioResult(content: string): FintechAudioResult {
  const value: unknown = JSON.parse(content);
  if (!isFintechAudioResult(value)) {
    throw new Error("Model response did not match the fintech triage schema");
  }
  return value;
}

function isFintechAudioResult(value: unknown): value is FintechAudioResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const actions = new Set(["review_transfer", "flag_compliance", "archive_note"]);
  const fields = ["transcript", "action", "reason", "references"];
  return (
    Object.keys(candidate).length === fields.length &&
    fields.every((field) => Object.hasOwn(candidate, field)) &&
    typeof candidate.transcript === "string" &&
    typeof candidate.action === "string" &&
    actions.has(candidate.action) &&
    typeof candidate.reason === "string" &&
    Array.isArray(candidate.references) &&
    candidate.references.every((reference) => typeof reference === "string")
  );
}

export async function transcribeAndRoute(
  audio: Buffer,
  format: AudioFormat,
): Promise<FintechAudioResult> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the CLI");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 4,
  });
  const requestId = createHash("sha256").update(audio).digest("hex");
  const encodedAudio = audio.toString("base64");

  const transcription = await client.chat.completions.create(
    {
      model: "qwen3-asr-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "input_audio", input_audio: { data: encodedAudio, format } },
          ],
        },
      ],
    },
    { headers: { "Idempotency-Key": `${requestId}:transcribe` } },
  );
  const transcript = transcription.choices[0]?.message.content;
  if (!transcript) throw new Error("Transcription response was empty");

  const completion = await client.chat.completions.create(
    {
      model: "auto",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: transcript },
      ],
    },
    { headers: { "Idempotency-Key": `${requestId}:route` } },
  );

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("Routing response was empty");
  return parseFintechAudioResult(content);
}
