const { useState } = React;

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
        setStatus({ type: 'info', message: 'Processing your request...' });
        setDownloadData(null);

        try {
            const response = await fetch("https://api.cobalt.tools/", {
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
                throw new Error("API rejected the request. It may be rate-limited.");
            }

            const data = await response.json();

            if (data.status === "error") {
                setStatus({ type: 'error', message: data.text || 'Failed to convert.' });
            } else if (data.url) {
                setStatus({ type: 'success', message: 'Ready for download!' });
                setDownloadData(data);
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT Converter</h1>
                <p className="text-gray-400 text-sm">React Powered • No Ads • Free API</p>
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
                    {loading ? 'Converting...' : 'Convert File'}
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
