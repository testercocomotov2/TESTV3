const { useState } = React;

// Invidious API instances
const INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://invidious.jing.rocks",
    "https://invidious.nerdvpn.de",
    "https://iv.melmac.space"
];

// CORS Proxies to bypass browser security blocks
const CORS_PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://corsproxy.io/?",
    "https://api.codetabs.com/v1/proxy?quest="
];

function App() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [videoData, setVideoData] = useState(null);

    const extractVideoId = (link) => {
        const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*shorts\/))([^&?]+)/);
        return match ? match[1] : null;
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        
        const videoId = extractVideoId(url);
        if (!videoId) {
            setStatus({ type: 'error', message: 'Invalid YouTube URL.' });
            return;
        }

        setLoading(true);
        setVideoData(null);
        setStatus({ type: 'info', message: 'Connecting to proxy network...' });

        let success = false;

        // Loop through Proxies and Instances to guarantee a connection
        for (let p = 0; p < CORS_PROXIES.length; p++) {
            if (success) break;
            const proxy = CORS_PROXIES[p];

            for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
                if (success) break;
                const instance = INVIDIOUS_INSTANCES[i];
                
                setStatus({ type: 'info', message: `Routing via Proxy ${p+1} to Node ${i+1}...` });

                try {
                    // The full API URL we want to hit
                    const targetUrl = encodeURIComponent(`${instance}/api/v1/videos/${videoId}`);
                    
                    // Fetch through the proxy
                    const res = await fetch(`${proxy}${targetUrl}`);
                    
                    if (!res.ok) throw new Error("Proxy connection failed.");
                    
                    // Proxies wrap responses differently. allorigins puts it in `contents`
                    let data;
                    if (proxy.includes('allorigins')) {
                        const jsonWrapper = await res.json();
                        data = JSON.parse(jsonWrapper.contents);
                    } else {
                        data = await res.json();
                    }

                    if (data && data.formatStreams && data.formatStreams.length > 0) {
                        const bestVideo = data.formatStreams.find(s => s.resolution === '720p') || data.formatStreams[0];
                        
                        const bestAudio = data.adaptiveFormats
                            ? data.adaptiveFormats
                                .filter(s => s.type.includes('audio'))
                                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
                            : null;

                        setVideoData({
                            title: data.title,
                            thumb: data.videoThumbnails && data.videoThumbnails.length > 0 
                                   ? data.videoThumbnails[0].url 
                                   : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                            videoUrl: bestVideo ? bestVideo.url : null,
                            audioUrl: bestAudio ? bestAudio.url : null
                        });

                        setStatus({ type: 'success', message: 'Stream captured! Ready for download.' });
                        success = true;
                    }
                } catch (error) {
                    console.warn(`Failed Proxy ${p+1} -> Node ${i+1}:`, error.message);
                }
            }
        }

        if (!success) {
            setStatus({ 
                type: 'error', 
                message: 'All proxy nodes blocked the request. Try again later.' 
            });
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-red-500 mb-2">Proxy Downloader</h1>
                <p className="text-gray-400 text-sm">CORS Bypass • React • GitHub Pages</p>
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
                    {loading ? 'Bypassing CORS...' : 'Extract Video Links'}
                </button>
            </form>

            {status.message && !videoData && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
                    status.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                    'bg-blue-900/50 text-blue-400 border border-blue-800'
                }`}>
                    {status.message}
                </div>
            )}

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
                            >
                                ⬇ Download Audio (M4A)
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
