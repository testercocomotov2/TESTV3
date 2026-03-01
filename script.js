/**
 * SGYT Engine V45 - Zero Polling WebSocket Client
 * User: SlayerGamerYT
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 

// Tumhari exact Pusher Keys
const PUSHER_KEY = "5d1519712c01b0699a83";
const PUSHER_CLUSTER = "ap2"; 

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
    if (isError) p.style.color = "#ef4444"; 
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

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> <span>Processing...</span>';
    document.getElementById('downloadArea').style.display = 'none';
    
    // Unique ID for this specific download trigger
    const jobId = "job-" + Math.random().toString(36).substr(2, 9);
    
    // Initialize Pusher Listener
    Pusher.logToConsole = true; // Debugging ke liye (Browser console mein logs aayenge)
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(jobId);
    
    // Backend se "my-event" ka wait karna
    channel.bind('my-event', function(data) {
        showFinalLink(data.message); 
        pusher.unsubscribe(jobId); // Kaam hone ke baad connection band
    });

    log(`Job [${jobId}] Created. GitHub ko trigger kar rahe hain...`);

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
                inputs: { youtube_url: url, format: mode, quality: quality, job_id: jobId } 
            })
        });

        if (response.status === 204) {
            log("Backend Started! Socket connection live, link ka wait ho raha hai...");
        } else {
            throw new Error("GitHub ne workflow trigger reject kar diya.");
        }
    } catch (e) {
        log(e.message, true);
        resetButton();
    }
}

function showFinalLink(url) {
    log("🚀 BOOM! Link Received Live.");
    resetButton();
    
    const area = document.getElementById('downloadArea');
    const link = document.getElementById('artifactLink');
    
    link.href = url;
    area.style.display = 'block';
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function resetButton() {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Download Again</span>`;
}
