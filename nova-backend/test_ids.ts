export { };

const urls = [
    'https://anime-peach-eight.vercel.app/api/info?id=jujutsu-kaisen-2nd-season',
    'https://anime-peach-eight.vercel.app/api/info?id=jujutsu-kaisen-tv',
    'https://anime-peach-eight.vercel.app/api/info?id=one-piece'
];

async function test() {
    for (const u of urls) {
        console.log(`Checking ${u}...`);
        try {
            const res = await fetch(u);
            const data = await res.json();
            console.log(data.success ? '✅ Success' : '❌ Failed', data.results?.title?.english || 'No title');
        } catch (e: any) { console.log('Error', e.message); }
    }
}
test();
