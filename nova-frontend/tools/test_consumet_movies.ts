import { MOVIES } from '@consumet/extensions';

const flixhq = new MOVIES.FlixHQ();

async function test() {
    try {
        console.log("Searching for movie 'Inception'...");
        const searchRes = await flixhq.search('Inception');
        
        const firstResult = searchRes.results[0];
        console.log(`Found: ${firstResult.title} (ID: ${firstResult.id})`);
        
        console.log("\nFetching media info...");
        const movieInfo = await flixhq.fetchMediaInfo(firstResult.id);
        
        console.log("Movie info keys: ", Object.keys(movieInfo));
        if (movieInfo.episodes && movieInfo.episodes.length > 0) {
            console.log("\nFetching stream sources...");
            const stream = await flixhq.fetchEpisodeSources(movieInfo.episodes[0].id, movieInfo.id);
            console.log("Stream Result:");
            console.log(JSON.stringify(stream, null, 2));
        } else {
            console.log("No episodes array found.");
        }
        
    } catch (e) {
        console.error("\nTEST FAILED WITH EXCEPTION:\n", e);
    }
}

test().finally(() => console.log("Test execution finished."));
