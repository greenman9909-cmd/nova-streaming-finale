import https from 'https';

const fetchJson = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ url, status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ url, status: res.statusCode, error: "Not JSON", snippet: data.slice(0, 200) });
                }
            });
        }).on('error', (e) => {
            resolve({ url, error: e.message });
        });
    });
};

async function run() {
    console.log(await fetchJson("https://anime-peach-eight.vercel.app/api/movies/trending"));
    console.log(await fetchJson("https://anime-peach-eight.vercel.app/movies/flixhq/trending"));
    console.log(await fetchJson("https://anime-peach-eight.vercel.app/movies/dramacool/popular"));
}
run();
