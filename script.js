/**
 * SGYT Engine V19 - Live Link Scraper
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
        log("Error: Missing credentials.", "log-error");
        return;
    }

    btn.disabled = true;
    document.getElementById('downloadArea').style.display = 'none';
    log("Engine Ignited! Monitoring live logs...", "log-info");

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: BRANCH, inputs: { youtube_url: url, format: mode, quality: quality } })
        });

        if (response.status === 204) {
            log("Backend started. Searching for download link...", "log-success");
            trackLiveLogs(token);
        } else {
            throw new Error(`GitHub Error: ${response.status}`);
        }
    } catch (error) {
        log(error.message, "log-error");
        btn.disabled = false;
    }
}

async function trackLiveLogs(token) {
    let linkFound = false;
    const interval = setInterval(async () => {
        if (linkFound) return;

        try {
            const runsRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const runsData = await runsRes.json();
            const run = runsData.workflow_runs[0];

            if (!run || run.status === 'queued') return;

            // Fetch logs while the job is still running (In-Progress)
            const jobsRes = await fetch(run.jobs_url, { headers: { 'Authorization': `Bearer ${token}` } });
            const jobsData = await jobsRes.json();
            const job = jobsData.jobs[0];

            if (job) {
                const logsRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${job.id}/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logText = await logsRes.text();
                
                // Match the tmpfiles download format
                const match = logText.match(/https:\/\/tmpfiles\.org\/dl\/\S+/);
                
                if (match) {
                    linkFound = true;
                    clearInterval(interval);
                    const cleanUrl = match[0].trim();
                    log("--- DOWNLOAD READY ---", "log-success");
                    log(`<a href="${cleanUrl}" target="_blank" style="color:#00ff00; font-weight:bold; font-size:1.2em;">🚀 DOWNLOAD NOW</a>`, "log-success");
                    
                    const linkBtn = document.getElementById('artifactLink');
                    linkBtn.href = cleanUrl;
                    document.getElementById('downloadArea').style.display = 'block';
                    document.getElementById('startBtn').disabled = false;
                } else if (run.status === 'completed' && run.conclusion !== 'success') {
                    clearInterval(interval);
                    log("Engine Failed. YouTube might have blocked the runner.", "log-error");
                    document.getElementById('startBtn').disabled = false;
                }
            }
        } catch (e) { console.error("Polling..."); }
    }, 5000); // Check every 5 seconds for absolute speed
}
