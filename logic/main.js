import {
  transcribeAudio,
  summarizeText,
  preloadWhisperModels,
  preloadSummarizerModels,
} from "./models.js";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const copyBtn = document.getElementById("copyBtn");
const summaryText = document.getElementById("summaryText");
const recordingIndicator = document.getElementById("recordingIndicator");
const recordingsContainer = document.getElementById("recordingsContainer");
const recordingsSection = document.getElementById("recordingsSection");

//Audio transcriber Model Choices
const modelSelect = document.getElementById("modelSelect");
//Summarize Select Model Choices
const summarizeSelect = document.getElementById("summarizerSelect");
const uploadInput = document.getElementById("uploadInput");
const audioPreview = document.getElementById("audioPreview");
const audioPlayer = document.getElementById("audioPlayer");
const processUploadBtn = document.getElementById("processUploadBtn");

let mediaRecorder;
let audioChunks = [];
let chosenModel = modelSelect.value;
let sumaryModel = summarizeSelect.value;

// Update chosen audio model dynamically
modelSelect.addEventListener("change", async () => {
  chosenModel = modelSelect.value;
  Notiflix.Notify.info(
    `${modelSelect.options[modelSelect.selectedIndex].text} selected`
  );
});

// Update chosen summarize model dynamically
summarizeSelect.addEventListener("change", async () => {
  sumaryModel = summarizeSelect.value;
  Notiflix.Notify.info(
    `${summarizeSelect.options[summarizeSelect.selectedIndex].text} selected`
  );
});

// Preload models on page load
window.addEventListener("lod", async () => {
  try {
    Notiflix.Loading.dots("Preloading AI models...");
    await Promise.all([preloadWhisperModels(), preloadSummarizerModels()]);
    Notiflix.Loading.remove();
    Notiflix.Notify.success("All models preloaded! Ready to record.");
  } catch (err) {
    console.error(err);
    Notiflix.Loading.remove();
    Notiflix.Notify.failure("Failed to preload models.");
  }
});

// Start Recording
startBtn.addEventListener("click", async () => {
  uploadInput.disabled = true;
  recordingIndicator.classList.remove("d-none"); 
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstart = () => {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      Notiflix.Notify.info(
        `Recording started using ${
          modelSelect.options[modelSelect.selectedIndex].text
        }`
      );
    };

    mediaRecorder.start();
  } catch (error) {
    uploadInput.disabled = false;
    Notiflix.Notify.failure("Microphone access denied!");
    console.error(error);
  }
});

// Stop Recording
stopBtn.addEventListener("click", async () => {
  if (!mediaRecorder) return;

  mediaRecorder.stop();
  recordingIndicator.classList.add("d-none"); 
  startBtn.disabled = false;
  stopBtn.disabled = true;

  uploadInput.disabled = false;

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create responsive audio card
    const colDiv = document.createElement("div");
    colDiv.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    const audioCard = document.createElement("div");
    audioCard.className = "audio-card";

    const audioEl = document.createElement("audio");
    audioEl.controls = true;
    audioEl.src = audioUrl;

    const modelLabel = document.createElement("small");
    modelLabel.className = "text-muted mt-1";
    modelLabel.textContent = `Model: ${
      modelSelect.options[modelSelect.selectedIndex].text
    }`;

    audioCard.appendChild(audioEl);
    audioCard.appendChild(modelLabel);
    colDiv.appendChild(audioCard);
    recordingsSection.classList.remove("d-none");
    recordingsContainer.prepend(colDiv);

    try {
      Notiflix.Notify.info("Transcribing audio...");
      const transcription = await transcribeAudio(audioBlob, chosenModel);

      Notiflix.Notify.info("Summarizing transcription...");
      const summary = await summarizeText(transcription, sumaryModel);

      summaryText.textContent = summary;
      Notiflix.Notify.success("Summary ready!");
    } catch (err) {
      console.error(err);
      summaryText.textContent = "Error transcribing/summarizing audio.";
      Notiflix.Notify.failure("Failed to process audio.");
    } finally {
      Notiflix.Loading.remove();
    }
  };
});

// Disable recording if file is chosen
uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    audioPreview.classList.remove("d-none");
     if(!recordingsSection.classList.contains("d-none")){
      recordingsSection.classList.add("d-none");
    }
    startBtn.disabled = false;
  }
});

// --- Process Uploaded File ---
processUploadBtn.addEventListener("click", async () => {
  if (!uploadInput.files.length) {
    Notiflix.Notify.failure("No audio file selected!");
    return;
  }

  const file = uploadInput.files[0];
    Notiflix.Notify.info("Processing uploaded  audio...");

  try {
    // Step 1: Transcribe
    const transcription = await transcribeAudio(file, chosenModel);

    // Step 2: Summarize
    const summary = await summarizeText(transcription, sumaryModel);
    summaryText.textContent = summary;

    // results.classList.remove("d-none");
    Notiflix.Notify.success("Audio processed successfully!");
  } catch (err) {
    console.error(err);
    Notiflix.Notify.failure("Error processing uploaded audio.");
  } finally {
    Notiflix.Loading.remove();
  }
});

// Copy to Clipboard
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(summaryText.textContent);
  Notiflix.Notify.success("Summary copied!");
});
