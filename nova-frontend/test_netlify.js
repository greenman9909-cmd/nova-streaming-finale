import https from 'https';
const fetchPage = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
    });
};
const run = async () => {
    const html = await fetchPage("https://nova-streaming-app.netlify.app/watch/movie/1226863");
    console.log(html.substring(0, 500));
};
run();
