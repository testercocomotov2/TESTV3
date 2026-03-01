const { useState } = React;

function App() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('mp4');
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleDownload = (e) => {
        e.preventDefault();
        
        // 1. Validate the URL
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!ytRegex.test(url)) {
            setStatus({ type: 'error', message: 'Please enter a valid YouTube URL.' });
            return;
        }

        setStatus({ type: 'success', message: 'Redirecting to secure processor...' });

        // 2. We use the Cobalt backend via URL parameters
        // This completely bypasses CORS and rate limits because the user's browser 
        // navigates to the processor directly, rather than fetching data in the background.
        
        let processorUrl = "";

        if (format === 'mp4') {
            // Video Download (Defaults to highest quality available)
            processorUrl = `https://cobalt.tools/?u=${encodeURIComponent(url)}`;
        } else {
            // Audio Download (Forces MP3)
            processorUrl = `https://cobalt.tools/?u=${encodeURIComponent(url)}&a=true`;
        }

        // 3. Open the processor in a new tab to handle the actual download
        window.open(processorUrl, '_blank');
        
        // Reset the UI
        setTimeout(() => {
            setStatus({ type: '', message: '' });
            setUrl('');
        }, 3000);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-red-500 mb-2">YT Redirect Processor</h1>
                <p className="text-gray-400 text-sm">100% Uptime • Zero CORS Errors • Fast</p>
            </div>

            <form onSubmit={handleDownload} className="space-y-6">
                <div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Link Here..." 
                        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500 text-white transition-colors"
                    />
                </div>

                <div className="flex justify-center space-x-6">
                    <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input 
                            type="radio" 
                            name="format" 
                            value="mp4" 
                            checked={format === 'mp4'} 
                            onChange={(e) => setFormat(e.target.value)}
                            className="text-red-500 focus:ring-red-500 w-4 h-4 bg-gray-900 border-gray-600"
                        />
                        <span className="font-medium">Video (MP4)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input 
                            type="radio" 
                            name="format" 
                            value="mp3" 
                            checked={format === 'mp3'} 
                            onChange={(e) => setFormat(e.target.value)}
                            className="text-red-500 focus:ring-red-500 w-4 h-4 bg-gray-900 border-gray-600"
                        />
                        <span className="font-medium">Audio (MP3)</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    className="w-full p-4 rounded-lg font-bold text-lg text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-900/20"
                >
                    Process Download
                </button>
            </form>

            {status.message && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium animate-fade-in ${
                    status.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                    'bg-green-900/50 text-green-400 border border-green-800'
                }`}>
                    {status.message}
                </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-6">
                *Downloads are securely processed via Cobalt.tools infrastructure.
            </p>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
