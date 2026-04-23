export { };

const urls = [
    'https://consumet-jade.vercel.app/anime/gogoanime/info/jujutsu-kaisen-2nd-season',
    'https://anify.vercel.app/info/jujutsu-kaisen-2nd-season'
];

async function test() {
    for (const u of urls) {
        console.log(`Checking ${u}...`);
        try {
            const res = await fetch(u);
            if (res.ok) {
                const json = await res.json();
                console.log(`✅ Success`, json.title ? json.title : 'No title');
            } else {
                console.log(`❌ ${res.status}`);
            }
        } catch (e: any) { console.log('Error', e.message); }
    }
}
test();
