import https from 'https';

const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    url,
                    status: res.statusCode,
                    response: data.slice(0, 500) // First 500 chars to see structure
                });
            });
        }).on('error', (e) => {
            resolve({ url, error: e.message });
        });
    });
};

async function run() {
    console.log(await checkUrl("https://anime-peach-eight.vercel.app/api/search?keyword=nosferatu"));
}
run();
