import { Hono } from 'hono';

const apis = [
    'https://anime-peach-eight.vercel.app/api/info?id=jujutsu-kaisen-tv',
    'https://api.consumet.org/anime/gogoanime/info/jujutsu-kaisen-tv',
    'https://consumet-api.herokuapp.com/anime/gogoanime/info/jujutsu-kaisen-tv'
];

async function testApis() {
    for (const url of apis) {
        console.log(`Testing ${url}...`);
        try {
            const start = Date.now();
            const res = await fetch(url);
            const time = Date.now() - start;
            if (res.ok) {
                console.log(`✅ Success (${time}ms)`);
                const data = await res.json();
                console.log('Sample data:', JSON.stringify(data).substring(0, 100));
            } else {
                console.log(`❌ Failed: ${res.status}`);
            }
        } catch (e: any) {
            console.log(`❌ Error: ${e.message}`);
        }
        console.log('---');
    }
}

testApis();
