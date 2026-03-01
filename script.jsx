const { useState, useEffect } = React;

function App() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('mp4');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);

    const checkProgress = async (id) => {
        try {
            const res = await fetch(`https://p.oceansaver.in/ajax/progress.php?id=${id}`);
            const data = await res.json();

            if (data.success && data.progress) {
                setProgress(data.progress);
                
                if (data.progress === 1000 || data.download_url) {
                    setIsProcessing(false);
                    setDownloadUrl(data.download_url);
                    setStatus({ type: 'success', message: 'Conversion complete!' });
                    return;
                }
                
                // If not done, check again in 2 seconds
                setTimeout(() => checkProgress(id), 2000);
            } else {
                throw new Error("Failed to track progress.");
            }
        } catch (error) {
            setIsProcessing(false);
            setStatus({ type: 'error', message: 'Connection to server lost during conversion.' });
        }
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        
        if (!url.includes('youtu')) {
            setStatus({ type: 'error', message: 'Please enter a valid YouTube URL.' });
            return;
        }

        setIsProcessing(true);
        setDownloadUrl(null);
        setVideoInfo(null);
        setProgress(0);
        setStatus({ type: 'info', message: 'Initializing Y2Mate/YT1s Engine...' });

        try {
            // Step 1: Initialize the conversion using the Oceansaver API
            const initRes = await fetch(`https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}`);
            const initData = await initRes.json();

            if (initData.success) {
                setStatus({ type: 'info', message: 'Converting file on remote server...' });
                setVideoInfo({ title: initData.info.title, image: initData.info.image });
                
                // Step 2: Start polling the progress API
                checkProgress(initData.id);
            } else {
                throw new Error("Server rejected the URL. It might be copyrighted music.");
            }
        } catch (error) {
            setIsProcessing(false);
            setStatus({ type: 'error', message: error.message || 'API is currently down or blocked.' });
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT5s API Converter</h1>
                <p className="text-gray-400 text-sm">Real-time Backend Processing via React</p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
                <div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link Here..." 
                        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500 text-white"
                        disabled={isProcessing}
                    />
                </div>

                <div className="flex justify-center space-x-4">
                    <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                        <input 
                            type="radio" 
                            name="format" 
                            value="mp4" 
                            checked={format === 'mp4'} 
                            onChange={(e) => setFormat(e.target.value)}
                            className="text-red-500 focus:ring-red-500"
                            disabled={isProcessing}
                        />
                        <span>Video (MP4)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                        <input 
                            type="radio" 
                            name="format" 
                            value="mp3" 
                            checked={format === 'mp3'} 
                            onChange={(e) => setFormat(e.target.value)}
                            className="text-red-500 focus:ring-red-500"
                            disabled={isProcessing}
                        />
                        <span>Audio (MP3)</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={isProcessing}
                    className={`w-full p-4 rounded-lg font-bold text-lg text-white transition-all ${
                        isProcessing 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                    {isProcessing ? 'Processing...' : 'Start Conversion'}
                </button>
            </form>

            {/* Video Info & Progress Bar */}
            {isProcessing && (
                <div className="mt-6">
                    <p className="text-center text-sm text-yellow-400 mb-2">{status.message}</p>
                    <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-700 overflow-hidden">
                        <div 
                            className="bg-red-600 h-4 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((progress / 1000) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {status.type === 'error' && (
                <div className="mt-6 p-4 bg-red-900/50 text-red-400 border border-red-800 rounded-lg text-center text-sm">
                    {status.message}
                </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
                <div className="mt-6 text-center animate-fade-in">
                    {videoInfo && (
                        <div className="mb-4">
                            <img src={videoInfo.image} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg mb-2 opacity-80" />
                            <p className="text-sm text-gray-300 truncate px-2">{videoInfo.title}</p>
                        </div>
                    )}
                    <a 
                        href={downloadUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-full p-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all shadow-lg"
                    >
                        ⬇ Download {format.toUpperCase()}
                    </a>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
