// --- 1. DEBUGGER SETUP ---
const consoleEl = document.getElementById('debugConsole');

function logToScreen(msg, type = 'info') {
    const p = document.createElement('p');
    p.className = `log-${type}`;
    // Add timestamp to logs
    const time = new Date().toLocaleTimeString();
    p.textContent = `[${time}] > ${msg}`;
    consoleEl.appendChild(p);
    consoleEl.scrollTop = consoleEl.scrollHeight; // Auto-scroll to bottom
}

// Catch unhandled global browser errors
window.onerror = function(message, source, lineno, colno, error) {
    logToScreen(`FATAL BROWSER ERROR: ${message} at line ${lineno}`, 'error');
    return true;
};

// Catch unhandled promise rejections (like failed fetches)
window.addEventListener('unhandledrejection', function(event) {
    logToScreen(`UNHANDLED PROMISE: ${event.reason}`, 'error');
});


// --- 2. API LOGIC ---
document.getElementById('convertBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value.trim();
    const downloadArea = document.getElementById('download-area');
    
    downloadArea.innerHTML = ""; // Clear old buttons

    if (!url) {
        logToScreen("Validation failed: No URL entered.", 'warn');
        return;
    }

    logToScreen(`Starting process for URL: ${url}`, 'info');

    try {
        logToScreen("Preparing payload for Cobalt v10 API...", 'info');
        
        const payload = {
            url: url,
            videoQuality: "720"
        };

        logToScreen("Initiating fetch() request to https://api.cobalt.tools/ ...", 'warn');

        // Execute the fetch
        const response = await fetch("https://api.cobalt.tools/", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        logToScreen(`Fetch completed. HTTP Status: ${response.status}`, 'info');

        if (!response.ok) {
            logToScreen(`HTTP Error Detected. Status code is not 2xx.`, 'error');
            const errorText = await response.text();
            logToScreen(`Server response body: ${errorText}`, 'error');
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        logToScreen("JSON parsed successfully.", 'success');

        if (data.status === "error") {
            logToScreen(`API returned an error state: ${data.text}`, 'error');
        } else if (data.url) {
            logToScreen(`Success! Download URL generated.`, 'success');
            downloadArea.innerHTML = `<a href="${data.url}" target="_blank">⬇ Click to Download</a>`;
        } else {
            logToScreen(`Unexpected API response structure. Data: ${JSON.stringify(data)}`, 'warn');
        }

    } catch (error) {
        logToScreen(`CATCH BLOCK TRIGGERED: ${error.name} - ${error.message}`, 'error');
        
        // Specific check for CORS / Network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            logToScreen("DIAGNOSIS: This is a CORS block or your network is blocking the request.", 'error');
            logToScreen("Check if you have an AdBlocker (like uBlock Origin or Brave Shields) blocking the API.", 'warn');
        }
    }
});
