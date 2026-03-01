/**
 * SGYT Engine V39 - Premium UI + Raw Grabber
 * User: SlayerGamerYT
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 
const WEBHOOK_TOKEN = "1a9bc849-a393-458c-86a8-4d78aa4bb7af";
const POLL_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest`;

const btn = document.getElementById('startBtn');
const terminal = document.getElementById('terminal');

window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) document.getElementById('ghToken').value = saved;
};

function saveToken() {
    localStorage.setItem('gh_pat', document.getElementById('ghToken').value.trim());
}

function log(msg, isError = false) {
    const p = document.createElement('p');
    if (isError) p.style.color = "#ef4444"; // Red for errors
    p.innerHTML = `<span class="prompt">~</span> ${msg}`;
    terminal.prepend(p);
    if (terminal.children.length > 6) terminal.lastChild.remove();
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;

    if (!token || !url) { log("Token ya URL missing hai bhai!", true); return; }

    // UI Loading State
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> <span>Processing...</span>';
    document.getElementById('downloadArea').style.display = 'none';
    log("Engine Ignited. Pinging GitHub...");

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
                    webhook_url: `https://webhook.site/${WEBHOOK_TOKEN}` 
                } 
            })
        });

        if (response.status === 204) {
            log("Backend Active. Hunting raw signal...");
            grabSignal(); 
        } else {
            throw new Error("GitHub ne request reject kar di.");
        }
    } catch (e) {
        log(e.message, true);
        resetButton();
    }
}

async function grabSignal() {
    try {
        const response = await fetch(POLL_API);
        const rawData = await response.text(); 

        // Raw Text Extract (No JSON freeze issues)
        const linkMatch = rawData.match(/https:\/\/filebin\.net\/[a-z0-9]+\/[a-z0-9_.]+/gi);

        if (linkMatch && linkMatch.length > 0) {
            const finalLink = linkMatch[0].replace(/\\/g, ''); 
            showFinalLink(finalLink);
        } else {
            setTimeout(grabSignal, 2000); // Check again in 2s
        }
    } catch (e) {
        console.warn("Retrying fetch...");
        setTimeout(grabSignal, 2500);
    }
}

function showFinalLink(url) {
    log("Link Captured! Ready to download.");
    resetButton();
    
    const area = document.getElementById('downloadArea');
    const link = document.getElementById('artifactLink');
    
    link.href = url;
    area.style.display = 'block';
    
    // Mobile Vibrate
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function resetButton() {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Download Again</span>`;
}
