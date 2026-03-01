const { useState } = React;

// A list of public, working Cobalt v10 community instances
const API_INSTANCES = [
    "https://api.cobalt.tools/",               // Official
    "https://cobalt-api.kwiatekmateusz.com/",  // Community Instance 1
    "https://api.cobalt.best/",                // Community Instance 2
    "https://cobalt.q-n-d.de/",                // Community Instance 3
    "https://co.wuk.sh/"                       // Community Instance 4
];

function App() {
    const [url, setUrl] = useState('');
    const [isAudio, setIsAudio] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [downloadData, setDownloadData] = useState(null);

    const handleDownload = async (e) => {
        e.preventDefault();
        
        if (!url.includes('youtu')) {
            setStatus({ type: 'error', message: 'Please enter a valid YouTube URL.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Finding an available server...' });
        setDownloadData(null);

        let success = false;
        let lastError = "";

        // Loop through the backup API instances until one works
        for (let i = 0; i < API_INSTANCES.length; i++) {
            const apiUrl = API_INSTANCES[i];
            setStatus({ type: 'info', message: `Trying server ${i + 1}/${API_INSTANCES.length}...` });

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        url: url,
                        downloadMode: isAudio ? "audio" : "auto"
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server ${i + 1} rejected the request (Rate Limited).`);
                }

                const data = await response.json();

                if (data.status === "error") {
                    throw new Error(data.text || 'Conversion failed on this server.');
                } else if (data.url) {
                    // Success! Stop the loop.
                    setStatus({ type: 'success', message: 'File is ready for download!' });
                    setDownloadData(data);
                    success = true;
                    break; 
                }
            } catch (error) {
                console.warn(`Failed on ${apiUrl}:`, error.message);
                lastError = error.message;
                // If it fails, the loop continues to the next URL
            }
        }

        // If the loop finishes and all servers failed
        if (!success) {
            setStatus({ 
                type: 'error', 
                message: `All servers are currently busy. Last error: ${lastError}` 
            });
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT Converter</h1>
                <p className="text-gray-400 text-sm">React Powered • Distributed API</p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
                <div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link Here..." 
                        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                        disabled={loading}
                    />
                </div>

                <div className="flex items-center space-x-2 pl-1">
                    <input 
                        type="checkbox" 
                        id="audioToggle"
                        checked={isAudio}
                        onChange={(e) => setIsAudio(e.target.checked)}
                        className="w-4 h-4 text-red-500 rounded bg-gray-900 border-gray-600 focus:ring-red-500"
                        disabled={loading}
                    />
                    <label htmlFor="audioToggle" className="text-gray-300 text-sm cursor-pointer">
                        Audio Only (MP3)
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full p-4 rounded-lg font-bold text-lg transition-all ${
                        loading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 active:scale-95'
                    }`}
                >
                    {loading ? 'Processing...' : 'Convert File'}
                </button>
            </form>

            {/* Status Messages */}
            {status.message && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
                    status.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                    status.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                    'bg-blue-900/50 text-blue-400 border border-blue-800'
                }`}>
                    {status.message}
                </div>
            )}

            {/* Download Button */}
            {downloadData && (
                <div className="mt-6">
                    <a 
                        href={downloadData.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-full text-center p-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-green-900/20"
                    >
                        ⬇ Download {isAudio ? 'Audio' : 'Video'}
                    </a>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
