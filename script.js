// Configuration for SlayerGamerYT's Engine
const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";

// Load saved token from browser storage on startup
window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) {
        document.getElementById('ghToken').value = saved;
    }
};

// Save token locally so you don't have to paste it every time
function saveToken() {
    const token = document.getElementById('ghToken').value.trim();
    localStorage.setItem('gh_pat', token);
}

function log(msg, type = '') {
    const term = document.getElementById('terminal');
    const p = document.createElement('p');
    if (type) p.className = type;
    p.textContent = `> ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

async function triggerAction() {
    const token = document.getElementById('ghToken').value.trim();
    const url = document.getElementById('ytUrl').value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    const btn = document.getElementById('startBtn');
    const downloadArea = document.getElementById('downloadArea');

    if (!token || !url) {
        log("Error: Token and URL are required.", "log-error");
        return;
    }

    // Reset UI for new run
    btn.disabled = true;
    downloadArea.style.display = 'none';
    log("Connecting to GitHub API...", "log-info");

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
                inputs: { youtube_url: url, format: format }
            })
        });

        if (!response.ok) {
            throw new Error(`Auth Failed (HTTP ${response.status}). Check your Token.`);
        }

        log("Engine Ignited! Linux/Mac runner is starting...", "log-success");
        log("Waiting for backend to process media (approx 1-2 mins)...");
        
        // Start polling for the result
        setTimeout(() => trackProgress(token), 10000);

    } catch (error) {
        log(error.message, "log-error");
        btn.disabled = false;
    }
}

async function trackProgress(token) {
    const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    let attempts = 0;
    const maxAttempts = 60; // Poll for 10 minutes max

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
                        log("Conversion Complete! Fetching download link...", "log-success");
                        fetchArtifactLink(token, run.artifacts_url);
                    } else {
                        log("Engine crashed. Check your cookies or YT link.", "log-error");
                    }
                } else {
                    log(`Processing... (Status: ${run.status})`);
                }
            }
        } catch (e) {
            console.error("Polling error:", e);
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            log("Timeout: Action is taking too long.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000); // Check every 10 seconds
}

async function fetchArtifactLink(token, artifactsUrl) {
    try {
        const res = await fetch(artifactsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.artifacts && data.artifacts.length > 0) {
            // This is the direct link to the zip file artifact
            const artifactId = data.artifacts[0].id;
            const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}`;
            
            const linkBtn = document.getElementById('artifactLink');
            linkBtn.href = downloadUrl;
            linkBtn.textContent = "⬇ Download Your Media (Zip)";
            document.getElementById('downloadArea').style.display = 'block';
            
            log("Download link generated successfully!", "log-success");
        } else {
            log("Error: No artifact found in successful run.", "log-error");
        }
    } catch (e) {
        log("Failed to retrieve final link.", "log-error");
    }
}
