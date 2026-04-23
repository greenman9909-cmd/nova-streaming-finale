import https from 'https';

const tmdbId = 1226863;
const urls = [
    `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
    `https://vidlink.pro/movie/${tmdbId}?primaryColor=06b6d4`,
    `https://vidsrc.su/embed/movie/${tmdbId}`,
    `https://player.autoembed.cc/embed/movie/${tmdbId}`
];

const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const isError = data.toLowerCase().includes('not found') || data.toLowerCase().includes('unavailable') || data.toLowerCase().includes('404');
                resolve({
                    url,
                    status: res.statusCode,
                    hasVideo: !isError,
                    contentLength: data.length,
                    errorFound: isError
                });
            });
        }).on('error', (e) => {
            resolve({ url, error: e.message });
        });
    });
};

async function run() {
    console.log("Testing TMDB ID:", tmdbId, "\n");
    for (const url of urls) {
        const result = await checkUrl(url);
        console.log(JSON.stringify(result, null, 2));
    }
}
run();
