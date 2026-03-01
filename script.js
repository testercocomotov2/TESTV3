/**
 * SGYT Engine V4 - Public Access Edition
 * User: SlayerGamerYT
 * Domain: sgyt.is-best.net
 */

// Configuration - Ensure these match your GitHub Repo exactly!
const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml"; // The physical filename in .github/workflows/
const BRANCH = "main"; // Change to "master" if your repo uses that instead

// Startup: Load saved token from browser storage
window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) document.getElementById('ghToken').value = saved;
};

// Save token for future use
function saveToken() {
    localStorage.setItem('gh_pat', document.getElementById('ghToken').value.trim());
}

// Terminal Logging System
function log(msg, type = '') {
    const term = document.getElementById('terminal');
    const p = document.createElement('p');
    if (type) p.className = type;
    p.textContent = `[${new Date().toLocaleTimeString()}] > ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

/**
 * Trigger the Backend Engine
 */
async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;
    const audioExt = document.getElementById('audioExt').value;
    const btn = document.getElementById('startBtn');

    if (!token || !url) {
        log("Error: Token and URL are required.", "log-error");
        return;
    }

    btn.disabled = true;
    document.getElementById('downloadArea').style.display = 'none';
    log("Igniting Engine on GitHub...", "log-info");

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
                ref: BRANCH,
                inputs: { 
                    youtube_url: url, 
                    format: mode, 
                    quality: quality, 
                    audio_ext: audioExt 
                }
            })
        });

        if (response.status === 204) {
            log("Backend processing started. Do not close this page.", "log-success");
            // Start polling for the result after a short delay
            setTimeout(() => trackProgress(token), 15000);
        } else {
            const errData = await response.json();
            throw new Error(`GitHub Error: ${errData.message || response.status}`);
        }
    } catch (error) {
        log(error.message, "log-error");
        btn.disabled = false;
    }
}

/**
 * Monitor Progress and Generate Public Link
 */
async function trackProgress(token) {
    const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes total

    const checkInterval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(runsUrl, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            
            if (data.workflow_runs && data.workflow_runs.length > 0) {
                const run = data.workflow_runs[0];

                if (run.status === 'completed') {
                    clearInterval(checkInterval);
                    document.getElementById('startBtn').disabled = false;
                    
                    if (run.conclusion === 'success') {
                        // FIX: Nightly.link expects the workflow ID or filename without .yml
                        const workflowName = WORKFLOW_FILE.replace(".yml", "");
                        
                        // Construct the Direct Public Link
                        const publicUrl = `https://nightly.link/${REPO_OWNER}/${REPO_NAME}/workflows/${workflowName}/${BRANCH}/Downloaded_Media.zip`;
                        
                        const linkBtn = document.getElementById('artifactLink');
                        linkBtn.href = publicUrl;
                        document.getElementById('downloadArea').style.display = 'block';
                        
                        log("SUCCESS: Download link is now public!", "log-success");
                        log("No GitHub login is required for this link.");
                    } else {
                        log("Engine Failure: Check your repository logs for errors.", "log-error");
                    }
                } else {
                    log(`Processing... Current Status: ${run.status}`);
                }
            }
        } catch (e) { 
            console.error("Polling error:", e); 
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            log("Polling Timeout. Check GitHub Actions manually.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000); // Check every 10 seconds
}
