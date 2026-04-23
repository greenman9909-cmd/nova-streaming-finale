import axios from 'axios';

const BASE_URL = 'https://streamed.pk/api';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://streamed.pk/',
    'Origin': 'https://streamed.pk'
};

async function testStreams() {
    console.log('--- Testing Streamed.pk API ---');

    try {
        // 1. Get Live Matches
        console.log('\n1. Fetching Live Matches...');
        const matchesRes = await axios.get(`${BASE_URL}/matches/live`, { headers: HEADERS });
        const matches = matchesRes.data;
        console.log(`> Found ${matches.length} live matches.`);

        if (matches.length === 0) {
            console.log('No live matches to test streams with. Trying "all-today"...');
            // Try all today if no live
            const todayRes = await axios.get(`${BASE_URL}/matches/all-today`, { headers: HEADERS });
            const todayMatches = todayRes.data;
            console.log(`> Found ${todayMatches.length} matches today.`);
            if (todayMatches.length > 0) matches.push(...todayMatches);
        }

        if (matches.length > 0) {
            const match = matches[0];
            console.log(`\n2. Testing Match: ${match.title} (${match.id})`);
            console.log(`   Category: ${match.category}`);

            if (match.sources && match.sources.length > 0) {
                const source = match.sources[0];
                console.log(`   Source: ${source.source} (ID: ${source.id})`);

                // 2. Get Streams
                console.log('\n3. Fetching Streams...');
                const streamUrl = `${BASE_URL}/stream/${source.source}/${source.id}`;
                console.log(`   URL: ${streamUrl}`);

                try {
                    const streamRes = await axios.get(streamUrl, { headers: HEADERS });
                    console.log('> Stream Response Status:', streamRes.status);
                    console.log('> Stream Data:', JSON.stringify(streamRes.data, null, 2));

                    if (Array.isArray(streamRes.data) && streamRes.data.length > 0) {
                        console.log('\nSUCCESS: Streams found!');
                    } else {
                        console.log('\nWARNING: Streams array is empty.');
                    }
                } catch (streamErr: any) {
                    console.error('ERROR Fetching Streams:', streamErr.message);
                    if (streamErr.response) {
                        console.error('Status:', streamErr.response.status);
                        console.error('Data:', streamErr.response.data);
                    }
                }

            } else {
                console.log('Match has no sources.');
            }
        } else {
            console.log('No matches found at all.');
        }

    } catch (error: any) {
        console.error('FATAL ERROR:', error.message);
    }
}

testStreams();
