import https from 'https';
const fetchPage = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ url, status: res.statusCode, data: data.substring(0, 500) }));
        });
    });
};
const run = async () => {
    console.log(await fetchPage("https://vidsrc.cc/v2/embed/movie/1226863"));
    console.log(await fetchPage("https://vidsrc.xyz/embed/movie/1226863"));
};
run();
