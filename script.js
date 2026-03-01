/**
 * SGYT Engine V4 - High Performance Downloader
 * User: SlayerGamerYT
 * Repo: testercocomotov2/TESTV3
 */

// 1. DOUBLE-CHECK THESE NAMES (They are Case-Sensitive!)
const REPO_OWNER = "testercocomotov2"; 
const REPO_NAME = "TESTV3"; 
const WORKFLOW_FILE = "downloader.yml";

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
    p.textContent = `[${new Date().toLocaleTimeString()}] > ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;
    const audioExt = document.getElementById('audioExt').value;
    
    const btn = document.getElementById('startBtn');
    const downloadArea = document.getElementById('downloadArea');

    if (!token || !url) {
        log("Missing Token or URL.", "log-error");
        return;
    }

    btn.disabled = true;
    log("Connecting to GitHub API...", "log-info");

    // The endpoint must be exact
    const dispatchUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

    try {
        const response = await fetch(dispatchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: { 
                    youtube_url: url, 
                    format: mode,
                    quality: quality,
                    audio_ext: audioExt
                }
            })
        });

        if (response.status === 204) {
            log("Engine Ignited! Running on GitHub Backend.", "log-success");
            setTimeout(() => trackProgress(token), 10000);
        } else if (response.status === 401) {
            throw new Error("Invalid Token. Re-check permissions.");
        } else if (response.status === 404) {
            throw new Error("Repo or Workflow not found. Check casing (TESTV3 vs testv3).");
        } else {
            const err = await response.json();
            throw new Error(`GitHub Error: ${err.message}`);
        }

    } catch (error) {
        if (error.message === "Failed to fetch") {
            log("DIAGNOSIS: Connection blocked by Browser/Adblocker or VPN.", "log-error");
        } else {
            log(error.message, "log-error");
        }
        btn.disabled = false;
    }
}

async function trackProgress(token) {
    const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    const checkInterval = setInterval(async () => {
        try {
            const res = await fetch(runsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const run = data.workflow_runs[0];
            
            if (run.status === 'completed') {
                clearInterval(checkInterval);
                document.getElementById('startBtn').disabled = false;
                if (run.conclusion === 'success') {
                    log("Media Processed!", "log-success");
                    fetchArtifactLink(token, run.artifacts_url);
                } else {
                    log("Backend Engine failed. Check GitHub Logs.", "log-error");
                }
            } else {
                log(`Status: ${run.status}...`);
            }
        } catch (e) { console.error(e); }
    }, 10000);
}

async function fetchArtifactLink(token, artifactsUrl) {
    try {
        const res = await fetch(artifactsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.artifacts && data.artifacts.length > 0) {
            const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${data.artifacts[0].id}`;
            document.getElementById('artifactLink').href = downloadUrl;
            document.getElementById('downloadArea').style.display = 'block';
            log("Ready to download.", "log-success");
        }
    } catch (e) { log("Link retrieval failed.", "log-error"); }
                   }
