document.getElementById('downloadBtn').addEventListener('click', () => {
    // 1. Get references to the DOM elements
    const urlInput = document.getElementById('videoUrl').value.trim();
    const isAudioOnly = document.getElementById('audioOnly').checked;
    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    const btn = document.getElementById('downloadBtn');

    // 2. Clear previous results and reset button
    resultEl.innerHTML = "";
    btn.disabled = false;

    // 3. Basic Validation: Check if it's a valid YouTube link
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!ytRegex.test(urlInput)) {
        statusEl.innerText = "Error: Please enter a valid YouTube URL.";
        statusEl.style.color = "#ff4444"; // Red for error
        return;
    }

    // 4. Update UI Status to show processing
    statusEl.innerText = "Generating download button...";
    statusEl.style.color = "#ffcc00"; // Yellow for processing
    
    // 5. Determine the format based on the checkbox
    // 'mp3' for audio only, '720' for standard HD video
    const format = isAudioOnly ? 'mp3' : '720';

    // 6. Construct the widget URL using the Loader.to API
    // We encode the URL to ensure special characters don't break the link
    const widgetUrl = `https://loader.to/api/button/?url=${encodeURIComponent(urlInput)}&f=${format}&color=ff0000`;

    // 7. Inject the iframe directly into the results div
    resultEl.innerHTML = `
        <iframe 
            src="${widgetUrl}" 
            style="width: 100%; height: 65px; border: none; overflow: hidden; margin-top: 15px; border-radius: 6px; background-color: transparent;" 
            scrolling="no">
        </iframe>
    `;

    // 8. Final Status Update
    statusEl.innerText = "Ready! Click the download button below.";
    statusEl.style.color = "#28a745"; // Green for success
});

// Optional: Allow pressing "Enter" in the input field to trigger the button
document.getElementById('videoUrl').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('downloadBtn').click();
    }
});
