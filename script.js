/**
 * SGYT Engine V7 - Catbox Private Edition
 * User: SlayerGamerYT
 * Repo: testercocomotov2/TESTV3
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 

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

    if (!token || !url) {
        log("Missing Token or URL.", "log-error");
        return;
    }

    btn.disabled = true;
    document.getElementById('downloadArea').style.display = 'none';
    log("Igniting Engine...", "log-info");

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
                inputs: { youtube_url: url, format: mode, quality: quality, audio_ext: audioExt }
            })
        });

        if (response.status === 204) {
            log("Backend processing. Uploading to secure cloud...", "log-success");
            setTimeout(() => trackProgress(token), 15000);
        } else {
            const err = await response.json();
            throw new Error(err.message || response.status);
        }
    } catch (error) {
        log(error.message, "log-error");
        btn.disabled = false;
    }
}

async function trackProgress(token) {
    const runsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    let attempts = 0;

    const checkInterval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(runsUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            const run = data.workflow_runs[0];

            if (run && run.status === 'completed') {
                clearInterval(checkInterval);
                document.getElementById('startBtn').disabled = false;
                
                if (run.conclusion === 'success') {
                    // FETCH THE LINK FROM JOB SUMMARY
                    fetchLinkFromSummary(token, run.id);
                } else {
                    log("Engine Failed. Check your YouTube URL/Cookies.", "log-error");
                }
            } else {
                log(`Processing... (${run ? run.status : 'starting'})`);
            }
        } catch (e) { console.error(e); }

        if (attempts >= 100) {
            clearInterval(checkInterval);
            log("Timeout reached.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000);
}

// Advanced Link Scraper: Pulls the link from GitHub logs into your UI
async function fetchLinkFromSummary(token, runId) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/jobs`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        // This is a direct link to the summary page for privacy
        const summaryUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`;
        
        log("SUCCESS: Media ready for download!", "log-success");
        const linkBtn = document.getElementById('artifactLink');
        linkBtn.href = summaryUrl;
        linkBtn.textContent = "🔗 Get Private Download Link";
        document.getElementById('downloadArea').style.display = 'block';
    } catch (e) {
        log("Error fetching final link summary.", "log-error");
    }
}
