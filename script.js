/**
 * SGYT Engine V36 - Signal Hunter (Turbo)
 * User: SlayerGamerYT
 * Domain: sgyt.is-best.net
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 

// YOUR UNIQUE WEBHOOK TOKEN
const WEBHOOK_TOKEN = "1a9bc849-a393-458c-86a8-4d78aa4bb7af";
const SIGNAL_URL = `https://webhook.site/${WEBHOOK_TOKEN}`;
const POLL_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest`;

window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) document.getElementById('ghToken').value = saved;
};

function saveToken() {
    localStorage.setItem('gh_pat', document.getElementById('ghToken').value.trim());
}

function log(msg, type = '') {
    const term = document.getElementById('terminal');
    const p = document.createElement('p');
    if (type) p.className = type;
    p.innerHTML = `[${new Date().toLocaleTimeString()}] > ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;
    const btn = document.getElementById('startBtn');

    if (!token || !url) {
        log("Error: Token/URL missing.", "log-error");
        return;
    }

    btn.disabled = true;
    document.getElementById('downloadArea').style.display = 'none';
    log("Engine Ignited. Bypassing Bot Check...", "log-info");

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ref: BRANCH, 
                inputs: { 
                    youtube_url: url, 
                    format: mode, 
                    quality: quality, 
                    webhook_url: SIGNAL_URL 
                } 
            })
        });

        if (response.status === 204) {
            log("Backend Live. Signal Hunter Active...", "log-success");
            huntSignal();
        } else {
            const err = await response.json();
            throw new Error(err.message || response.status);
        }
    } catch (error) {
        log("Launch Error: " + error.message, "log-error");
        btn.disabled = false;
    }
}

async function huntSignal() {
    let found = false;
    let attempts = 0;
    
    const interval = setInterval(async () => {
        if (found) return;
        attempts++;

        try {
            const res = await fetch(POLL_API);
            const json = await res.json();
            
            // Look through the last 5 requests to find our link
            if (json.data && json.data.length > 0) {
                for (let i = 0; i < Math.min(json.data.length, 5); i++) {
                    const content = json.data[i].content;
                    if (content && content.includes("filebin.net")) {
                        found = true;
                        clearInterval(interval);
                        const dlUrl = content.trim();

                        log("--- SIGNAL CAPTURED ---", "log-success");
                        log(`<a href="${dlUrl}" target="_blank" style="color:#00ff00; font-weight:bold; font-size:1.1em; text-decoration:underline;">🚀 DOWNLOAD READY: CLICK HERE</a>`, "log-success");
                        
                        document.getElementById('artifactLink').href = dlUrl;
                        document.getElementById('downloadArea').style.display = 'block';
                        document.getElementById('startBtn').disabled = false;
                        
                        // Mobile vibration alert
                        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        return;
                    }
                }
            }
            
            // Heartbeat status
            if (attempts % 5 === 0) console.log("Hunter still searching...");
            
        } catch (e) { console.warn("Signal Syncing..."); }
        
        if (attempts > 300) { // 10 minute timeout
            clearInterval(interval);
            log("Signal Timeout. Backend might have failed.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 2000); 
}
