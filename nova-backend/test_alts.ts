export { };

const urls = [
    'https://api-consumet.vercel.app/anime/gogoanime/top-airing',
    'https://consumet-api-clone.vercel.app/anime/gogoanime/top-airing',
    'https://api.amvstr.me/api/v2/trending'
];

async function test() {
    for (const u of urls) {
        console.log(`Testing ${u}`);
        try {
            const res = await fetch(u);
            if (res.ok) {
                const txt = await res.text();
                try {
                    const json = JSON.parse(txt);
                    console.log('✅ OK:', JSON.stringify(json).substring(0, 100));
                } catch {
                    console.log('❌ Invalid JSON');
                }
            } else {
                console.log('❌ Status:', res.status);
            }
        } catch (e: any) {
            console.log('❌ Network error', e.message);
        }
    }
}
test();
