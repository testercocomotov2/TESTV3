const { useState } = React;

// A decentralized list of open-source Invidious proxy servers
const INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://yewtu.be",
    "https://invidious.jing.rocks",
    "https://invidious.nerdvpn.de",
    "https://invidious.slipfox.xyz",
    "https://iv.melmac.space"
];

function App() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [videoData, setVideoData] = useState(null);

    const extractVideoId = (link) => {
        // Regex to handle standard links, youtu.be, and shorts
        const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*shorts\/))([^&?]+)/);
        return match ? match[1] : null;
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        
        const videoId = extractVideoId(url);
        if (!videoId) {
            setStatus({ type: 'error', message: 'Invalid YouTube URL. Please check the link.' });
            return;
        }

        setLoading(true);
        setVideoData(null);
        setStatus({ type: 'info', message: 'Querying decentralized network...' });

        let success = false;

        // Loop through the decentralized instances until one successfully parses the video
        for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
            const instance = INVIDIOUS_INSTANCES[i];
            setStatus({ type: 'info', message: `Connecting to node ${i + 1}/${INVIDIOUS_INSTANCES.length}...` });

            try {
                // Fetch the raw deciphered streams from the Invidious API
                const res = await fetch(`${instance}/api/v1/videos/${videoId}`);
                
                if (!res.ok) throw new Error("Node rejected request.");
                
                const data = await res.json();

                if (data && data.formatStreams && data.formatStreams.length > 0) {
                    // Extract the best Video+Audio combined stream (usually 720p or 360p MP4)
                    const bestVideo = data.formatStreams.find(s => s.resolution === '720p') || data.formatStreams[0];
                    
                    // Extract the best Audio-only stream (M4A or WebM)
                    const bestAudio = data.adaptiveFormats
                        .filter(s => s.type.includes('audio'))
                        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

                    setVideoData({
                        title: data.title,
                        thumb: data.videoThumbnails && data.videoThumbnails.length > 0 
                               ? data.videoThumbnails[0].url 
                               : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        videoUrl: bestVideo ? bestVideo.url : null,
                        audioUrl: bestAudio ? bestAudio.url : null
                    });

                    setStatus({ type: 'success', message: 'Deciphering complete! Ready for download.' });
                    success = true;
                    break; // Stop the loop on success
                }
            } catch (error) {
                console.warn(`Node ${instance} failed:`, error.message);
                // Continue to the next instance
            }
        }

        if (!success) {
            setStatus({ 
                type: 'error', 
                message: 'All network nodes are currently busy. Please try again in a few minutes.' 
            });
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT Decentralized Downloader</h1>
                <p className="text-gray-400 text-sm">React Powered • Invidious Network • No CLI</p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
                <div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link Here..." 
                        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full p-4 rounded-lg font-bold text-lg text-white transition-all ${
                        loading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 active:scale-95'
                    }`}
                >
                    {loading ? 'Bypassing Security...' : 'Extract Video Links'}
                </button>
            </form>

            {/* Status Messages */}
            {status.message && !videoData && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
                    status.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                    'bg-blue-900/50 text-blue-400 border border-blue-800'
                }`}>
                    {status.message}
                </div>
            )}

            {/* Results Section */}
            {videoData && (
                <div className="mt-6 animate-fade-in border-t border-gray-700 pt-6">
                    <div className="text-center mb-4">
                        <img src={videoData.thumb} alt="Thumbnail" className="w-full h-40 object-cover rounded-lg mb-3 shadow-md" />
                        <h3 className="text-white font-medium text-sm line-clamp-2 px-2">{videoData.title}</h3>
                    </div>

                    <div className="flex flex-col space-y-3">
                        {videoData.videoUrl && (
                            <a 
                                href={videoData.videoUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block w-full text-center p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all shadow-lg"
                                download
                            >
                                ⬇ Download Video (MP4)
                            </a>
                        )}
                        
                        {videoData.audioUrl && (
                            <a 
                                href={videoData.audioUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block w-full text-center p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg"
                                download
                            >
                                ⬇ Download Audio (M4A)
                            </a>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center mt-4">
                        *Note: If a video opens in a new tab instead of downloading, click the three dots in the corner of the video player and select "Download".
                    </p>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
