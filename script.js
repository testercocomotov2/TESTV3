const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 
const WEBHOOK_TOKEN = "1a9bc849-a393-458c-86a8-4d78aa4bb7af";
const SIGNAL_URL = `https://webhook.site/${WEBHOOK_TOKEN}`;
const POLL_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest`;

// UI Setup
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
    if (type === 'error') p.style.color = '#ff4d4d';
    p.textContent = `> ${msg}`;
    term.prepend(p);
    if (term.children.length > 5) term.lastChild.remove();
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;
    const btn = document.getElementById('startBtn');

    if (!token || !url) { log("Missing URL or Token!", "error"); return; }

    btn.disabled = true;
    btn.textContent = "Processing...";
    document.getElementById('downloadArea').style.display = 'none';
    log("Igniting SGYT Backend...");

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ref: BRANCH, 
                inputs: { youtube_url: url, format: mode, quality: quality, webhook_url: SIGNAL_URL } 
            })
        });

        if (res.status === 204) {
            log("Engine Live. Hunting for signal...");
            huntSignal();
        } else {
            throw new Error("GitHub rejected launch.");
        }
    } catch (e) {
        log(e.message, "error");
        btn.disabled = false;
        btn.textContent = "Download";
    }
}

async function huntSignal() {
    try {
        const res = await fetch(POLL_API);
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
            for (let i = 0; i < Math.min(json.data.length, 3); i++) {
                const content = json.data[i].content;
                if (content && content.includes("filebin.net")) {
                    finishDownload(content.trim());
                    return;
                }
            }
        }
        // Signal not found, wait 2s and try again (Asynchronous)
        setTimeout(huntSignal, 2000);
    } catch (e) {
        setTimeout(huntSignal, 3000);
    }
}

function finishDownload(url) {
    const btn = document.getElementById('startBtn');
    log("Link Captured! Enjoy.");
    btn.disabled = false;
    btn.textContent = "Download Next";
    document.getElementById('artifactLink').href = url;
    document.getElementById('downloadArea').style.display = 'block';
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}
