// Load Xenova transformers.js models dynamically
// Whisper + T5 summarization
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js";

let whisperModel = null;
let summarizerModel = null;

/**
 * Load Whisper model dynamically based on chosenModel
 * @param {string} modelKey - 'fast', 'balanced', 'accurate'
 */
export async function loadWhisperModel(modelKey) {
  let modelName;

  switch (modelKey) {
    case "fast":
      modelName = "Xenova/whisper-tiny";
      break;
    case "balanced":
      modelName = "Xenova/whisper-base";
      break;
    case "accurate":
      modelName = "Xenova/whisper-small";
      break;
    default:
      modelName = "Xenova/whisper-tiny";
  }

  // Show loading notification
  Notiflix.Notify.info(`Loading ${modelKey} Whisper model...`);

  // Load Whisper using transformers.js
  whisperModel = await pipeline("automatic-speech-recognition", modelName);

  Notiflix.Notify.success(`${modelKey} Whisper model loaded!`);
  return whisperModel;
}

/**
 * Load T5 summarization model
 */
export async function loadSummarizer() {
  if (!summarizerModel) {
    Notiflix.Notify.info("Loading T5 summarizer...");
    summarizerModel = await pipeline("summarization", "Xenova/t5-small");
    Notiflix.Notify.success("Summarizer loaded!");
  }
  return summarizerModel;
}

/**
 * Transcribe audio blob to text
 * @param {Blob} audioBlob
 * @returns {string} transcription
 */
export async function transcribeAudio(audioBlob) {
  if (!whisperModel) throw new Error("Whisper model not loaded");
  const floatData = await blobToFloat32Array(audioBlob);
  const transcription = await whisperModel(floatData);
  return transcription.text;
}

/**
 * Summarize text using T5
 * @param {string} text
 * @returns {string} summary
 */
export async function summarizeText(text) {
  if (!summarizerModel) await loadSummarizer();
  const summaryOutput = await summarizerModel(text);
  return summaryOutput[0].summary_text;
}

export async function blobToFloat32Array(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // For simplicity, take the first channel
  const channelData = audioBuffer.getChannelData(0); // Float32Array
  return channelData;
}
