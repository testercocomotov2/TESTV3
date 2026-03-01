/**
 * SGYT Engine V14 - Direct Terminal Edition
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
        log("Error: Token and URL are required.", "log-error");
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
            log("Backend processing started...", "log-success");
            setTimeout(() => trackProgress(token), 20000);
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
                    log("Engine finished! Extracting links...", "log-info");
                    fetchLinksFromLogs(token, run.id);
                } else {
                    log("Engine Failed. Check logs on GitHub.", "log-error");
                }
            } else {
                log(`Processing... Status: ${run ? run.status : 'starting'}`);
            }
        } catch (e) { console.error(e); }

        if (attempts >= 150) {
            clearInterval(checkInterval);
            log("Timeout reached.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000);
}

/**
 * NEW: Fetches the raw logs and displays the links directly in the UI
 */
async function fetchLinksFromLogs(token, runId) {
    try {
        // 1. Get the Job ID
        const jobsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/jobs`;
        const jobsRes = await fetch(jobsUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const jobsData = await jobsRes.json();
        const jobId = jobsData.jobs[0].id;

        // 2. Fetch the raw log text
        const logsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${jobId}/logs`;
        const logsRes = await fetch(logsUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const logText = await logsRes.text();

        // 3. Search for our custom tags
        const pdMatch = logText.match(/LINK_READY_PD: (https:\/\/pixeldrain\.com\/u\/\S+)/);
        const fioMatch = logText.match(/LINK_READY_FIO: (https:\/\/file\.io\/\S+)/);

        if (pdMatch || fioMatch) {
            log("--- DOWNLOAD LINKS ---", "log-success");
            if (pdMatch) log(`PixelDrain: ${pdMatch[1]}`, "log-success");
            if (fioMatch) log(`File.io: ${fioMatch[1]} (One-time use)`, "log-success");
            
            // Update the main button too
            const linkBtn = document.getElementById('artifactLink');
            linkBtn.href = pdMatch ? pdMatch[1] : fioMatch[1];
            linkBtn.textContent = "🚀 Download Now";
            document.getElementById('downloadArea').style.display = 'block';
        } else {
            log("Links found but could not be parsed. Check GitHub manually.", "log-error");
        }
    } catch (e) {
        log("Error reading logs: " + e.message, "log-error");
    }
}
