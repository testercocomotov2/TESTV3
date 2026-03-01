const { useState } = React;

function App() {
    const [url, setUrl] = useState('');
    const [iframeSrc, setIframeSrc] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleDownload = (e) => {
        e.preventDefault();
        
        // 1. Validate the URL
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!ytRegex.test(url)) {
            setStatus({ type: 'error', message: 'Please enter a valid YouTube URL.' });
            setIframeSrc(null);
            return;
        }

        // 2. Extract the Video ID
        // This regex works for standard links, shortened youtu.be links, and shorts
        let videoId = "";
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('shorts/')) {
                videoId = url.split('shorts/')[1].split('?')[0];
            } else {
                videoId = url.split('v=')[1].split('&')[0];
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Could not extract Video ID. Check your link.' });
            return;
        }

        // 3. Set the Widget URL using the extracted ID
        // This uses a highly reliable public widget provider that mirrors Y2mate's backend
        setStatus({ type: 'success', message: 'Downloader loaded! Select your format below.' });
        
        // Using the widely supported youtube-mp3/mp4 widget API
        const widgetUrl = `https://ytmp3.mobi/button-api/#${videoId}`;
        setIframeSrc(widgetUrl);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT Downloader</h1>
                <p className="text-gray-400 text-sm">Widget Powered • No Rate Limits</p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
                <div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link Here..." 
                        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-colors text-white"
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full p-4 rounded-lg font-bold text-lg transition-all bg-red-600 hover:bg-red-700 active:scale-95 text-white"
                >
                    Load Download Options
                </button>
            </form>

            {/* Status Message */}
            {status.message && !iframeSrc && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
                    status.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                    'bg-green-900/50 text-green-400 border border-green-800'
                }`}>
                    {status.message}
                </div>
            )}

            {/* The Widget Iframe - Appears only after clicking the button */}
            {iframeSrc && (
                <div className="mt-6 w-full rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
                    <iframe 
                        src={iframeSrc} 
                        width="100%" 
                        height="250px" 
                        allowtransparency="true" 
                        scrolling="no" 
                        style={{ border: "none" }}
                    ></iframe>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
