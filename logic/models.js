// Load Xenova transformers.js models dynamically
// Whisper + T5 summarization
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js";

export const whisperModels = {};
let summarizerModel = null;

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
      Notiflix.Notify.info(`Preloading ${key} Whisper model...`);
      whisperModels[key] = await pipeline(
        "automatic-speech-recognition",
        modelMap[key],
         {
          chunk_length_s: 30,   // chunk size for long audios
          stride_length_s: 5    // overlap for continuity
        }
      );
      Notiflix.Notify.success(`${key} Whisper model preloaded!`);
    }
  }
}

/**
 * Get Whisper model (preloaded or fallback)
 */
export function getWhisperModel(key) {
  if (!whisperModels[key]) throw new Error(`${key} Whisper model not loaded`);
  return whisperModels[key];
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
export async function transcribeAudio(audioBlob,modelKey) {
  const model = getWhisperModel(modelKey);
  const floatData = await blobToFloat32Array(audioBlob);
  const transcription = await model(floatData);
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
