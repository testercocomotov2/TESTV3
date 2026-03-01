/**
 * SGYT Engine V4 - 422 Fix Edition
 * User: SlayerGamerYT
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
// IMPORTANT: Most new repos use 'main', but older ones use 'master'
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
                ref: BRANCH, // If you get 422, change 'main' to 'master' at the top of this script
                inputs: { 
                    youtube_url: url, 
                    format: mode, 
                    quality: quality, 
                    audio_ext: audioExt 
                }
            })
        });

        if (response.status === 204) {
            log("Engine Ignited! Monitoring progress...", "log-success");
            setTimeout(() => trackProgress(token), 10000);
        } else if (response.status === 422) {
            log("ERROR 422: Branch name mismatch or Workflow hidden. Try changing 'main' to 'master' in script.js.", "log-error");
            btn.disabled = false;
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
                    const workflowId = run.workflow_id;
                    const publicUrl = `https://nightly.link/${REPO_OWNER}/${REPO_NAME}/workflows/${workflowId}/${BRANCH}/Downloaded_Media.zip`;
                    
                    document.getElementById('artifactLink').href = publicUrl;
                    document.getElementById('downloadArea').style.display = 'block';
                    log("SUCCESS: Public link ready!", "log-success");
                } else {
                    log("Backend Engine failed. Check GitHub Logs.", "log-error");
                }
            } else {
                log(`Processing... Status: ${run ? run.status : 'starting'}`);
            }
        } catch (e) { console.error(e); }

        if (attempts >= 60) {
            clearInterval(checkInterval);
            log("Timeout reached.", "log-error");
            document.getElementById('startBtn').disabled = false;
        }
    }, 10000);
}
