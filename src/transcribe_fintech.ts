#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import {
  type AudioFormat,
  transcribeAndRoute,
} from "./fintech_audio_triage.ts";

const audioPath = process.argv[2];
if (!audioPath) {
  console.error("usage: npm run triage -- <recording.mp3|recording.wav>");
  process.exitCode = 2;
} else {
  const extension = extname(audioPath).toLowerCase();
  if (extension !== ".mp3" && extension !== ".wav") {
    throw new Error("Recording must use an .mp3 or .wav extension");
  }

  const audio = await readFile(audioPath);
  const result = await transcribeAndRoute(
    audio,
    extension.slice(1) as AudioFormat,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
