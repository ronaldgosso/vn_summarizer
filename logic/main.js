const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');
const summaryText = document.getElementById('summaryText');
const recordingIndicator = document.getElementById('recordingIndicator');
const recordingsContainer = document.getElementById('recordingsContainer');

let mediaRecorder;
let audioChunks = [];

// Start Recording
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstart = () => {
      recordingIndicator.style.visibility = 'visible';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    };

    mediaRecorder.start();
  } catch (error) {
    Notiflix.Notify.failure('Microphone access denied!');
    console.error(error);
  }
});

// Stop Recording
stopBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;

  mediaRecorder.stop();
  recordingIndicator.style.visibility = 'hidden';
  startBtn.disabled = false;
  stopBtn.disabled = true;

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create a responsive audio card
    const colDiv = document.createElement('div');
    colDiv.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

    const audioCard = document.createElement('div');
    audioCard.className = 'audio-card';
    
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audioUrl;

    audioCard.appendChild(audioEl);
    colDiv.appendChild(audioCard);
    recordingsContainer.prepend(colDiv); // newest first

    fakeSummary();
  };
});

// Fake Summary
function fakeSummary() {
  setTimeout(() => {
    summaryText.textContent = "This is the fake summary. The real summary will come after Whisper transcription + T5 summarization.";
    Notiflix.Notify.success('Summary ready!');
  }, 1000);
}

// Copy to Clipboard
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(summaryText.textContent);
  Notiflix.Notify.success('Summary copied!');
});
