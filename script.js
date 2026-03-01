/**
 * SGYT Engine V35 - Client-Sync Fix
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
    log("Igniting Engine V35 (Fixing Format Error)...", "log-info");

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
            log("Backend Live. Sniping link via Webhook...", "log-success");
            startSignalListener();
        } else {
            const err = await response.json();
            throw new Error(err.message || response.status);
        }
    } catch (error) {
        log("Launch Error: " + error.message, "log-error");
        btn.disabled = false;
    }
}

async function startSignalListener() {
    let linkFound = false;
    const interval = setInterval(async () => {
        if (linkFound) return;
        try {
            const res = await fetch(POLL_API);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                const content = data.data[0].content;
                if (content && content.includes("filebin.net")) {
                    linkFound = true;
                    clearInterval(interval);
                    const dlUrl = content.trim();
                    log("--- SIGNAL SNIPED (ASAP) ---", "log-success");
                    log(`<a href="${dlUrl}" target="_blank" style="color:#00ff00; font-weight:bold;">🚀 DOWNLOAD FILE</a>`, "log-success");
                    document.getElementById('artifactLink').href = dlUrl;
                    document.getElementById('downloadArea').style.display = 'block';
                    document.getElementById('startBtn').disabled = false;
                }
            }
        } catch (e) { console.warn("Polling Signal..."); }
    }, 2000); 
}
