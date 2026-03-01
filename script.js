/**
 * SGYT Engine V25 - 2s Turbo Polling
 * User: SlayerGamerYT
 * Domain: sgyt.is-best.net
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 

window.onload = () => {
    const saved = localStorage.getItem('gh_pat');
    if (saved) document.getElementById('ghToken').value = saved;
};

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
    log("Igniting Engine V25...", "log-info");

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                ref: BRANCH, 
                inputs: { youtube_url: url, format: mode, quality: quality, audio_ext: "mp3" } 
            })
        });

        if (response.status === 204) {
            log("Backend Live. Polling every 2s...", "log-success");
            turboTrack(token);
        } else {
            const err = await response.json();
            throw new Error(err.message || response.status);
        }
    } catch (error) {
        log("Launch Error: " + error.message, "log-error");
        btn.disabled = false;
    }
}

async function turboTrack(token) {
    let linkFound = false;
    let runId = null;

    const interval = setInterval(async () => {
        if (linkFound) return;

        try {
            // Get the latest run
            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const run = data.workflow_runs[0];

            if (!run || run.status === 'queued') {
                console.log("Waiting in queue...");
                return;
            }

            runId = run.id;

            // Fetch job logs even if 'in_progress'
            const jobsRes = await fetch(run.jobs_url, { headers: { 'Authorization': `Bearer ${token}` } });
            const jobsData = await jobsRes.json();
            const job = jobsData.jobs[0];

            if (job) {
                const logsRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${job.id}/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logContent = await logsRes.text();
                
                // Sniper Regex for TmpFiles
                const match = logContent.match(/https:\/\/tmpfiles\.org\/dl\/\d+\/[^\s"]+/);
                
                if (match) {
                    linkFound = true;
                    clearInterval(interval);
                    const dlUrl = match[0].trim();
                    
                    log("--- LINK SNIPED ---", "log-success");
                    log(`<a href="${dlUrl}" target="_blank" style="color:#00ff00; font-weight:bold; font-size:1.2em;">🚀 DOWNLOAD NOW</a>`, "log-success");
                    
                    document.getElementById('artifactLink').href = dlUrl;
                    document.getElementById('downloadArea').style.display = 'block';
                    document.getElementById('startBtn').disabled = false;
                } else {
                    // Update terminal status without flooding it
                    console.log("Checking logs: " + run.status);
                }

                if (run.status === 'completed' && !linkFound) {
                    clearInterval(interval);
                    log("Process finished. No link found.", "log-error");
                    document.getElementById('startBtn').disabled = false;
                }
            }
        } catch (e) { console.error("Polling error..."); }
    }, 2000); // 2-second turbo poll
}
