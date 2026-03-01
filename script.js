document.getElementById('downloadBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    const isAudioOnly = document.getElementById('audioOnly').checked;
    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    const btn = document.getElementById('downloadBtn');

    if (!urlInput) {
        statusEl.innerText = "Please enter a valid YouTube URL.";
        statusEl.style.color = "#ff4444";
        return;
    }

    // Reset UI state
    btn.disabled = true;
    statusEl.style.color = "#ffcc00";
    statusEl.innerText = "Processing... this may take a moment.";
    resultEl.innerHTML = "";

    try {
        // Cobalt API Endpoint (Public Instance)
        const response = await fetch("https://api.cobalt.tools/api/json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                url: urlInput,
                isAudioOnly: isAudioOnly,
                aFormat: "mp3", 
                vQuality: "720"
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Handle the API Response
        if (data.status === "error" || !data.url) {
            statusEl.innerText = "Error: " + (data.text || "Failed to parse video.");
            statusEl.style.color = "#ff4444";
        } else {
            statusEl.innerText = "Conversion successful!";
            statusEl.style.color = "#28a745";
            
            // Create download button
            resultEl.innerHTML = `<a href="${data.url}" target="_blank">⬇ Download ${isAudioOnly ? 'Audio' : 'Video'}</a>`;
        }
        
    } catch (error) {
        console.error("Fetch Error:", error);
        statusEl.innerText = "A network error occurred. The API might be temporarily unavailable.";
        statusEl.style.color = "#ff4444";
    } finally {
        btn.disabled = false;
    }
});
