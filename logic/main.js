const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');
const summaryText = document.getElementById('summaryText');
const recordingIndicator = document.getElementById('recordingIndicator');

let mediaRecorder;
let audioChunks = [];

// Start Recording
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      recordingIndicator.style.visibility = 'visible'; // show recording dot
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
  recordingIndicator.style.visibility = 'hidden'; // hide recording dot
  Notiflix.Notify.success('Recording stopped, processing...');
  startBtn.disabled = false;
  stopBtn.disabled = true;

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Debug playback
    const audioPlayer = document.createElement('audio');
    audioPlayer.controls = true;
    audioPlayer.src = audioUrl;
    document.body.appendChild(audioPlayer);

    fakeSummary();
  };
});

// Fake Summary (replace with Whisper + T5 later)
function fakeSummary() {
  setTimeout(() => {
    summaryText.textContent = "This is the fake summary. The real summary will come after Whisper transcription + T5 summarization.";
    Notiflix.Notify.success('Summary ready!');
  }, 2000);
}

// Copy to Clipboard
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(summaryText.textContent);
  Notiflix.Notify.success('Summary copied!');
});
