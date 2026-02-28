document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("converter-form");
    const urlInput = document.getElementById("video-url");
    const formatInput = document.getElementById("format-type");
    const statusMsg = document.getElementById("status-message");
    const resultSection = document.getElementById("result-section");
    const downloadLink = document.getElementById("download-link");
    const errorSection = document.getElementById("error-section");
    const errorMsg = document.getElementById("error-message");

    const BACKEND_URL = "https://your-heroku-backend.herokuapp.com/download"; // Change to your Heroku backend URL!

    function showStatus(message, loading = false) {
        statusMsg.textContent = message;
        if (loading) {
            statusMsg.classList.add("loading");
        } else {
            statusMsg.classList.remove("loading");
        }
    }

    function showResult(downloadUrl, filename) {
        statusMsg.textContent = "";
        resultSection.classList.remove("hidden");
        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        downloadLink.textContent = `Download ${filename}`;
        errorSection.classList.add("hidden");
    }

    function showError(message) {
        errorSection.classList.remove("hidden");
        errorMsg.textContent = message;
        resultSection.classList.add("hidden");
        statusMsg.textContent = "";
    }

    function hideFeedback() {
        resultSection.classList.add("hidden");
        errorSection.classList.add("hidden");
        statusMsg.textContent = "";
        statusMsg.classList.remove("loading");
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        hideFeedback();
        const youtubeUrl = urlInput.value.trim();
        const format = formatInput.value.trim();
        if (!youtubeUrl) {
            showError("Please enter a YouTube URL.");
            return;
        }
        if (!["mp3", "mp4"].includes(format)) {
            showError("Invalid format selected.");
            return;
        }
        showStatus("Converting video... Please wait.", true);
        fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({url: youtubeUrl, format: format}),
        })
        .then(async res => {
            if (!res.ok) {
                let data = await res.json().catch(() => ({}));
                throw (data.error || "Failed to download file");
            }
            // Extract filename from content-disposition header if present
            let fn = "youtube_download." + format;
            const disposition = res.headers.get("content-disposition");
            if (disposition) {
                let match = disposition.match(/filename=\"?([^\";]+)\"?/);
                if (match) fn = match[1];
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            showResult(url, fn);
        })
        .catch(err => {
            showError(err || "An unexpected error occurred, please try again.");
        })
        .finally(() => {
            showStatus("");
        });
    });
});