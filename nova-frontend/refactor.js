const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. Add import for LazyFetchRow
if (!code.includes('LazyFetchRow')) {
    code = code.replace(
        "import PremiumCTA from '../components/PremiumCTA';",
        "import PremiumCTA from '../components/PremiumCTA';\nimport LazyFetchRow from '../components/LazyFetchRow';"
    );
}

// 2. Remove all secondary states
const statesToRemove = [
    'popularAnime', 'latestAnime', 'topRatedMovies', 'popularMovies',
    'upcomingMovies', 'actionMovies', 'topRatedSeries', 'popularSeries',
    'airingTodaySeries', 'scifiMovies', 'comedySeries', 'documentaries',
    'topRatedAnimeList', 'animeMovies', 'horrorMovies', 'romanceSeries',
    'thrillerMovies', 'dramaSeries', 'hiddenGemMovies', 'bingeworthySeries'
];

statesToRemove.forEach(state => {
    const capitalized = state.charAt(0).toUpperCase() + state.slice(1);
    const regex = new RegExp(`\\s*const \\[${state}, set${capitalized}\\] = useState<HomeRowItem\\[\\]>\\(\\[\\]\\);`, 'g');
    code = code.replace(regex, '');
});

// 3. Remove fetchSecondaryData body and call
code = code.replace(/const fetchSecondaryData = async \(\) => \{[\s\S]*?\};\s*void fetchCriticalData\(\);\s*deferredFetchTimer = setTimeout\(\(\) => \{\s*void fetchSecondaryData\(\);\s*\}, 120\);/m,
    'void fetchCriticalData();'
);

// 4. Transform ContentRow blocks to LazyFetchRow blocks.
const transformations = [
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'popularMovies', title: "Most Watched Movies", fetcher: "getPopularMovies()", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'upcomingMovies', title: "Upcoming Premieres", fetcher: "getUpcomingMovies()", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'scifiMovies', title: "Sci-Fi & Fantasy", fetcher: "getMoviesByGenre(878)", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'comedySeries', title: "Comedy Hits", fetcher: "getSeriesByGenre(35)", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'airingTodaySeries', title: "Airing Today", fetcher: "getAiringTodaySeries()", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'topRatedMovies', title: "Critically Acclaimed Movies", fetcher: "getTopRatedMovies()", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'topRatedSeries', title: "All-Time Best Series", fetcher: "getTopRatedSeries()", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'actionMovies', title: "Adrenaline Rush", fetcher: "getMoviesByGenre(28)", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'anime'", oldState: 'popularAnime', title: "Most Popular Anime", fetcher: "getPopularAnime()", mapper: 'mapAnime', link: "`/watch/tv/${item.id}`", seeAll: "/anime" },
    { cond: "activeCategory === 'all' || activeCategory === 'anime'", oldState: 'topRatedAnimeList', title: "Top Rated Anime", fetcher: "getTopRatedAnime()", mapper: 'mapAnime', link: "`/watch/tv/${item.id}`", seeAll: "/anime", extraCls: 'titleClassName="text-yellow-400"' },
    { cond: "activeCategory === 'all' || activeCategory === 'anime'", oldState: 'animeMovies', title: "Anime Movies", fetcher: "getAnimeMovies()", mapper: 'mapAnime', link: "`/watch/movie/${item.id}`", seeAll: "/anime" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'horrorMovies', title: "Horror & Thriller", fetcher: "getHorrorMovies()", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas", extraCls: 'titleClassName="text-red-500"' },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'documentaries', title: "Fascinating Documentaries", fetcher: "getMoviesByGenre(99)", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'romanceSeries', title: "Romance Collection", fetcher: "getRomanceSeries()", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series", extraCls: 'titleClassName="text-pink-400"' },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'thrillerMovies', title: "Edge-of-Seat Thrillers", fetcher: "getThrillerMovies()", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'popularSeries', title: "Most Watched Shows", fetcher: "getPopularSeries()", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'dramaSeries', title: "Drama Masterpieces", fetcher: "getDramaSeries()", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'movies'", oldState: 'hiddenGemMovies', title: "Hidden Gems", fetcher: "getPopularMovies(2)", mapper: 'movieToContent', link: "`/watch/movie/${item.id}`", seeAll: "/peliculas" },
    { cond: "activeCategory === 'all' || activeCategory === 'series'", oldState: 'bingeworthySeries', title: "Binge-Worthy Series", fetcher: "getPopularSeries(2)", mapper: 'seriesToContent', link: "`/watch/tv/${item.id}`", seeAll: "/series" },
    { cond: "activeCategory === 'all' || activeCategory === 'anime'", oldState: 'latestAnime', title: "New Anime Episodes", fetcher: "getLatestAnimeEpisodes()", mapper: 'mapAnime', link: "`/watch/tv/${item.id}`", seeAll: "/anime" },
];

transformations.forEach(t => {
    // Find the JSX block for this specific oldState and replace it with LazyFetchRow
    // The structure looks like:
    /*
                {({cond}) && {oldState}.length > 0 && (
                    <ContentRow
                        title="{title}"
                        items={{oldState}}
                        seeAllLink="{seeAll}"
                        getLink={(item: HomeRowItem) => {link}}
                        ...
                    />
                )}
    */

    // We will use a regex to match the top comment and the entire JSX block
    // It's easier to just match from the comment to `)}`

    // Using string replacement or generic regex is risky. Let's build a regex for `<ContentRow\\s+title="${t.title}"[^>]*/>\\s*\\)\\}`
    const blockRegex = new RegExp(`\\{\\(${t.cond.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&')}\\) && ${t.oldState}\\.length > 0 && \\([\\s\\S]*?<ContentRow[\\s\\S]*?title="${t.title}"[\\s\\S]*?/>\\s*\\)\\}`);

    const lazyFetchBlock =
        `{(${t.cond}) && (
    <LazyFetchRow
        title="${t.title}"
        fetchFn={async () => {
            const res = await ${t.fetcher};
            return res.slice(0, 20).map(${t.mapper}) as HomeRowItem[];
        }}
        seeAllLink="${t.seeAll}"
        getLink={(item: any) => ${t.link}}
        ${t.extraCls ? t.extraCls : ''}
    />
)}`;

    code = code.replace(blockRegex, lazyFetchBlock);
});

// Write it back
fs.writeFileSync(homePath, code, 'utf8');
console.log('Refactoring complete!');
