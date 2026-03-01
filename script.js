/**
 * SGYT Engine V37 - Loader.fo UI Edition
 * User: SlayerGamerYT
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 
const WEBHOOK_TOKEN = "1a9bc849-a393-458c-86a8-4d78aa4bb7af";
const POLL_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest`;

// UI Elements
const btn = document.getElementById('startBtn');
const terminal = document.getElementById('terminal');
const downloadArea = document.getElementById('downloadArea');
const artifactLink = document.getElementById('artifactLink');

function log(msg, isError = false) {
    const p = document.createElement('p');
    if (isError) p.style.color = "#ff4d4d";
    p.textContent = `> ${msg}`;
    terminal.prepend(p); // Newest on top to prevent scrolling lag
    if (terminal.children.length > 5) terminal.lastChild.remove(); // Keep it light
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const format = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;

    if (!token || !url) {
        log("Missing API Token or URL", true);
        return;
    }

    // Set Loading State
    btn.disabled = true;
    btn.textContent = "Processing...";
    downloadArea.style.display = 'none';
    log("Igniting Backend...");

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/vnd.github.v3+json', 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                ref: BRANCH, 
                inputs: { 
                    youtube_url: url, 
                    format: format, 
                    quality: quality, 
                    webhook_url: `https://webhook.site/${WEBHOOK_TOKEN}` 
                } 
            })
        });

        if (response.status === 204) {
            log("Engine Live. Hunting for signal...");
            pollForSignal();
        } else {
            const err = await response.json();
            throw new Error(err.message || "Launch Failed");
        }
    } catch (e) {
        log(e.message, true);
        btn.disabled = false;
        btn.textContent = "Download";
    }
}

async function pollForSignal() {
    try {
        const res = await fetch(POLL_API);
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
            // Check top 3 signals for the filebin link
            for (let i = 0; i < Math.min(json.data.length, 3); i++) {
                const content = json.data[i].content;
                if (content && content.includes("filebin.net")) {
                    showDownload(content.trim());
                    return; // Signal found, stop polling
                }
            }
        }
        
        // Signal not found yet, wait 2s and try again (Non-blocking)
        setTimeout(pollForSignal, 2000);
        
    } catch (e) {
        console.warn("Retrying signal sync...");
        setTimeout(pollForSignal, 3000);
    }
}

function showDownload(url) {
    log("Signal captured! File ready.");
    btn.disabled = false;
    btn.textContent = "Start New Download";
    
    artifactLink.href = url;
    downloadArea.style.display = 'block';
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}
