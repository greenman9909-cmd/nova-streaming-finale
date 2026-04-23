
const mirrors = [
    'https://anime-peach-eight.vercel.app/api',
    'https://anime-peach-seven.vercel.app/api',
    'https://anime-api-itzzzme.vercel.app/api',
    'https://consumet.ursulf.me/anime/gogoanime',
    'https://api.consumet.org/anime/gogoanime',
    'https://api.amvstr.me/api/v2'
];

async function test() {
    for (const m of mirrors) {
        console.log(`Checking ${m}...`);
        try {
            // Try a search or info endpoint
            let url = `${m}/info/jujutsu-kaisen-tv`;
            if (m.includes('amvstr')) url = `${m}/info/jujutsu-kaisen`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ ${m} IS WORKING!`);
                console.log(JSON.stringify(data).substring(0, 50));
            } else {
                console.log(`❌ ${m} -> ${res.status}`);
            }
        } catch (e: any) {
            console.log(`❌ ${m} -> Error`);
        }
    }
}
test();
