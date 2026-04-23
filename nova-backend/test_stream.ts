import axios from 'axios';

const BASE_URL = 'https://streamed.pk/api';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://streamed.pk/',
    'Origin': 'https://streamed.pk'
};

async function testStream() {
    console.log('--- Testing Upstream Stream Fetching ---');
    try {
        const matchesRes = await axios.get(`${BASE_URL}/matches/all-today`, { headers: HEADERS });
        const matches = matchesRes.data;

        if (matches.length > 0) {
            // Find the Al-Riyadh match or fallback to first
            const match = matches.find((m: any) => m.title.includes('Al-Riyadh')) || matches[0];
            console.log(`Match: ${match.title}`);

            if (match.sources && match.sources.length > 0) {
                console.log(`Found ${match.sources.length} sources. Testing all...`);

                for (const source of match.sources) {
                    console.log(`\n--- Testing Source: ${source.source} ---`);
                    const streamUrl = `${BASE_URL}/stream/${source.source}/${source.id}`;
                    try {
                        const streamRes = await axios.get(streamUrl, { headers: HEADERS });
                        console.log('Response:', JSON.stringify(streamRes.data, null, 2));
                    } catch (e: any) {
                        console.log(`Failed to fetch stream: ${e.message}`);
                    }
                }
            } else {
                console.log("No sources for this match.");
            }
        } else {
            console.log("No matches found.");
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testStream();
