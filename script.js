/**
 * SGYT Engine V41 - Full Script & End-Link Grabber
 * User: SlayerGamerYT
 */

const REPO_OWNER = "testercocomotov2";
const REPO_NAME = "TESTV3";
const WORKFLOW_FILE = "downloader.yml";
const BRANCH = "main"; 
const WEBHOOK_TOKEN = "1a9bc849-a393-458c-86a8-4d78aa4bb7af";

// sorting=newest ensure karega ki last mein aayi hui link sabse upar mile
const POLL_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest`;

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
    log("Engine Ignited. GitHub backend started...");

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ref: BRANCH, 
                inputs: { 
                    youtube_url: url, 
                    format: mode, 
                    quality: quality, 
                    webhook_url: `https://webhook.site/${WEBHOOK_TOKEN}` 
                } 
            })
        });

        if (response.status === 204) {
            log("Backend Active. Upload finish hone ka wait kar rahe hain...");
            // Attempts = 0 se start karo
            grabSignal(0); 
        } else {
            throw new Error("GitHub ne request reject kar di.");
        }
    } catch (e) {
        log(e.message, true);
        resetButton();
    }
}

// Ye function backend ke final upload link ko direct grab karega
async function grabSignal(attempts) {
    if (attempts > 60) { // 2 minute ka timeout (agar badi video ho toh badha sakte ho)
        log("Timeout: Upload hone mein zyada time lag gaya ya process fail hua.", true);
        resetButton();
        return;
    }

    try {
        const response = await fetch(POLL_API);
        // Pure text format mein data utha rahe hain (No JSON crash)
        const rawText = await response.text(); 

        // Regex: Ye directly us last link ko nikalega jo Webhook par POST hui hai
        const match = rawText.match(/https:(?:\\\/|\/)filebin\.net(?:\\\/|\/)[a-zA-Z0-9]+(?:\\\/|\/)[^"'\s\\]+/i);

        if (match) {
            // Slashes clean karo aur final link set karo
            const cleanLink = match[0].replace(/\\/g, '');
            showFinalLink(cleanLink);
        } else {
            // Agar upload abhi tak complete nahi hua, toh 2 second baad fir search karo
            setTimeout(() => grabSignal(attempts + 1), 2000);
        }
    } catch (e) {
        console.warn("Connection delay, retrying...");
        setTimeout(() => grabSignal(attempts + 1), 3000);
    }
}

function showFinalLink(url) {
    log("Boom! Link Captured Successfully!");
    resetButton();
    
    const area = document.getElementById('downloadArea');
    const link = document.getElementById('artifactLink');
    
    link.href = url;
    area.style.display = 'block';
    
    // Mobile par vibrate karne ke liye
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function resetButton() {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Download Again</span>`;
}
