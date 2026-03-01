document.getElementById('downloadBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    const isAudioOnly = document.getElementById('audioOnly').checked;
    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    const btn = document.getElementById('downloadBtn');

    // 1. Reset UI
    resultEl.innerHTML = "";
    statusEl.innerText = "";
    btn.disabled = true;

    // 2. Validate URL
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!ytRegex.test(urlInput)) {
        statusEl.innerText = "Error: Please enter a valid YouTube URL.";
        statusEl.style.color = "#ff4444";
        btn.disabled = false;
        return;
    }

    // 3. Update Status
    statusEl.innerText = "Connecting to API... please wait.";
    statusEl.style.color = "#ffcc00";

    // 4. Set up the correct Cobalt v10 API payload
    const payload = {
        url: urlInput,
        // If audio only, set downloadMode to audio. Otherwise, default auto (video)
        downloadMode: isAudioOnly ? "audio" : "auto",
        audioFormat: "mp3",
        videoQuality: "720"
    };

    try {
        // 5. Fetch from Cobalt's NEW v10 endpoint
        // NOTE: Cobalt strictly requires the 'Accept' and 'Content-Type' headers
        const response = await fetch("https://api.cobalt.tools/", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // 6. Handle HTTP Errors (like 403 or 429 Rate Limits)
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.code || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // 7. Process the API response
        if (data.status === "error") {
            statusEl.innerText = "Conversion failed: " + (data.text || "Unknown error");
            statusEl.style.color = "#ff4444";
        } else if (data.url) {
            // Success! Generate the direct download button
            statusEl.innerText = "Conversion successful!";
            statusEl.style.color = "#28a745";
            
            resultEl.innerHTML = `
                <a href="${data.url}" target="_blank" style="
                    display: inline-block;
                    margin-top: 15px;
                    padding: 12px 25px;
                    background-color: #28a745;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    transition: background 0.2s;
                ">⬇ Download ${isAudioOnly ? 'MP3 Audio' : 'MP4 Video'}</a>
            `;
        } else {
            throw new Error("API did not return a download link.");
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        statusEl.innerText = `Error: ${error.message}. The API might be rate-limited right now.`;
        statusEl.style.color = "#ff4444";
    } finally {
        btn.disabled = false; // Re-enable the button
    }
});

// Allow hitting "Enter" in the text box
document.getElementById('videoUrl').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('downloadBtn').click();
    }
});
