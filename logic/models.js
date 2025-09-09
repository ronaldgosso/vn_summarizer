// Load Xenova transformers.js models dynamically
// Whisper + Summarization
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js";

export const whisperModels = {};
export const summarizerModels = {};

// Default fallbacks
const DEFAULT_WHISPER = "fast"; // Whisper-tiny
const DEFAULT_SUMMARIZER = "fast"; // T5-small

/**
 * Preload all Whisper models in background
 */
export async function preloadWhisperModels() {
  const modelMap = {
    fast: "Xenova/whisper-tiny",
    balanced: "Xenova/whisper-base",
    accurate: "Xenova/whisper-small",
  };

  for (const key in modelMap) {
    if (!whisperModels[key]) {
      try {
        Notiflix.Notify.info(`Preloading ${key} Whisper model...`);
        whisperModels[key] = await pipeline(
          "automatic-speech-recognition",
          modelMap[key],
          {
            chunk_length_s: 30, // chunk size for long audios
            stride_length_s: 5, // overlap for continuity
          }
        );
        Notiflix.Notify.success(`${key} Whisper model preloaded!`);
      } catch (err) {
        console.error(`Failed to load Whisper model (${key}):`, err);
        Notiflix.Notify.failure(`Failed to load ${key} Whisper model`);
      }
    }
  }
}

/**
 * Preload summarizer models (fast/accurate)
 */
export async function preloadSummarizerModels() {
  const summarizerMap = {
    fast: "Xenova/t5-small",
    accurate: "Xenova/distilbart-cnn-6-6",
  };

  for (const key in summarizerMap) {
    if (!summarizerModels[key]) {
      try {
        Notiflix.Notify.info(`Preloading ${key} summarizer...`);
        summarizerModels[key] = await pipeline(
          "summarization",
          summarizerMap[key]
        );
        Notiflix.Notify.success(`${key} summarizer preloaded!`);
      } catch (err) {
        console.error(`Failed to load summarizer (${key}):`, err);
        Notiflix.Notify.failure(`Failed to load ${key} summarizer`);
      }
    }
  }
}

/**
 * Get summarizer model (fallback to default if missing)
 */
export function getSummarizerModel(key = DEFAULT_SUMMARIZER) {
  if (!summarizerModels[key]) {
    console.warn(`Summarizer "${key}" not loaded. Falling back to "${DEFAULT_SUMMARIZER}"`);
    key = DEFAULT_SUMMARIZER;
  }
  if (!summarizerModels[key]) throw new Error("No summarizer available");
  return summarizerModels[key];
}

/**
 * Get Whisper model (fallback to default if missing)
 */
export function getWhisperModel(key = DEFAULT_WHISPER) {
  if (!whisperModels[key]) {
    console.warn(`Whisper "${key}" not loaded. Falling back to "${DEFAULT_WHISPER}"`);
    key = DEFAULT_WHISPER;
  }
  if (!whisperModels[key]) throw new Error("No Whisper model available");
  return whisperModels[key];
}

/**
 * Transcribe audio blob to text
 */
export async function transcribeAudio(audioBlob, modelKey = DEFAULT_WHISPER) {
  try {
    const model = getWhisperModel(modelKey);
    const floatData = await blobToFloat32Array(audioBlob);
    const transcription = await model(floatData);
    return transcription.text || "";
  } catch (err) {
    console.error("Transcription failed:", err);
    Notiflix.Notify.failure("Audio transcription failed");
    return "";
  }
}

/**
 * Summarize text
 */
export async function summarizeText(text, modelKey = DEFAULT_SUMMARIZER) {
  try {
    const model = getSummarizerModel(modelKey);
    const summaryOutput = await model(text);
    return summaryOutput[0]?.summary_text || "";
  } catch (err) {
    console.error("Summarization failed:", err);
    Notiflix.Notify.failure("Text summarization failed");
    return text; // fallback: return original text
  }
}

/**
 * Convert audio blob → Float32Array
 */
export async function blobToFloat32Array(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // First channel only
  return audioBuffer.getChannelData(0); // Float32Array
}
