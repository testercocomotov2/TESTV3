/**
 * SGYT Engine V4 - High Performance Downloader
 * User: SlayerGamerYT
 * Domain: sgyt.is-best.net (or GitHub Pages)
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";

// Load SlayerGamerYT's saved token on startup
window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) {
        document.getElementById('ghToken').value = saved;
    }
};

// Securely save the Token to the browser's local storage
function saveToken() {
    const token = document.getElementById('ghToken').value.trim();
    localStorage.setItem('gh_pat', token);
}

// Custom Terminal Logger with Type Formatting
function log(msg, type = '') {
    const term = document.getElementById('terminal');
    const p = document.createElement('p');
    if (type) p.className = type;
    const time = new Date().toLocaleTimeString();
    p.textContent = `[${time}] > ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

/**
 * Core Logic: Triggering the GitHub Action
 */
async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    
    // Get Advanced Options from UI
    const mode = document.getElementById('mode').value;
    const quality = document.getElementById('quality').value;
    const audioExt = document.getElementById('audioExt').value;
    
    const btn = document.getElementById('startBtn');
    const downloadArea = document.getElementById('downloadArea');

    if (!token || !url) {
        log("Error: Token and URL are required.", "log-error");
        return;
    }

    // UI Feedback
    btn.disabled = true;
    downloadArea.style.display = 'none';
    log("Testing connection to GitHub...", "log-info");

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

        // Diagnostic Checks for Specific HTTP Errors
        if (response.status === 401) {
            throw new Error("401 Unauthorized: Your GitHub Token is invalid or expired.");
        } else if (response.status === 404) {
            throw new Error(`404 Not Found: Check if REPO_OWNER (${REPO_OWNER}) or REPO_NAME (${REPO_NAME}) is correct.`);
        } else if (response.status === 422) {
            throw new Error("422 Unprocessable: Verify 'downloader.yml' exists and has 'workflow_dispatch:' enabled.");
        } else if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        log("Engine Ignited! Check your Actions tab.", "log-success");
        log("Waiting for backend to process (approx 1-3 mins)...");
        
        // Wait 10 seconds for GitHub to initialize the run object
        setTimeout(() => trackProgress(token), 10000);

    } catch (error) {
        // Handle 'Failed to fetch' which is usually a CORS or Network issue
        if (error.message === "Failed to fetch") {
            log("DIAGNOSIS: Request Blocked. Check Ad-blockers, VPN, or Repo Path case-sensitivity.", "log-error");
        } else {
            log(error.message, "log-error");
        }
        btn.disabled = false;
    }
}

/**
 * Status Polling: Checking for Completion
 */
async function trackProgress(token) {
    const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes timeout

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
                        log("Success! Generating final download link...", "log-success");
                        fetchArtifactLink(token, run.artifacts_url);
                    } else {
                        log("Engine Error: Check your cookies or video link availability.", "log-error");
                    }
                } else {
                    log(`Processing... Status: ${run.status}`);
                }
            }
        } catch (e) {
            console.error("Polling error:", e);
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            log("Process timed out. Check GitHub Actions manually.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000); // Check every 10 seconds
}

/**
 * Link Retrieval: Fetching the Zip Artifact
 */
async function fetchArtifactLink(token, artifactsUrl) {
    try {
        const res = await fetch(artifactsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.artifacts && data.artifacts.length > 0) {
            const artifactId = data.artifacts[0].id;
            // Direct link to the artifact archive
            const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}`;
            
            const linkBtn = document.getElementById('artifactLink');
            linkBtn.href = downloadUrl;
            linkBtn.textContent = "⬇ Download Zip Archive";
            document.getElementById('downloadArea').style.display = 'block';
            
            log("Download link is now available!", "log-success");
        } else {
            log("Error: Workflow finished but no artifact was found.", "log-error");
        }
    } catch (e) {
        log("Failed to retrieve download link via API.", "log-error");
    }
}
