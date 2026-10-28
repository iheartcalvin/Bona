import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const DEFAULT_FILM = {
    videoId: 'GQI72THyO5I',
    title: 'Bible Project: Genesis 1 Overview',
    author: 'BibleProject',
    language: 'English',
    captions: ['English'],
    description: 'Demo film mode video. Add a Firestore film chapter record to use a chapter-specific animation.',
};

const LOCAL_FILM_MAP = {
    'Genesis_1': DEFAULT_FILM,
};

const normalizeKey = (book, chapter) => `${book}_${chapter}`.replace(/\s+/g, '_');

const getOEmbedMetadata = async (videoId) => {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            title: data.title,
            author: data.author_name,
            thumbnailUrl: data.thumbnail_url,
        };
    } catch (error) {
        console.warn('Unable to load YouTube metadata:', error);
        return null;
    }
};

export const FilmModeService = {
    getFilmForChapter: async (book, chapter) => {
        const key = normalizeKey(book, chapter);
        let film = LOCAL_FILM_MAP[key] || null;

        try {
            const snapshot = await getDoc(doc(db, 'filmChapters', key));
            if (snapshot.exists()) {
                film = { ...film, ...snapshot.data() };
            }
        } catch (error) {
            console.warn('Unable to load film chapter config:', error);
        }

        const resolvedFilm = film || {
            ...DEFAULT_FILM,
            title: `${book} ${chapter} Film Mode`,
            description: `No custom film has been configured for ${book} ${chapter} yet. Showing the default animation video.`,
        };

        const metadata = await getOEmbedMetadata(resolvedFilm.videoId);

        return {
            ...resolvedFilm,
            ...metadata,
            language: resolvedFilm.language || 'English',
            captions: resolvedFilm.captions || ['English'],
            qualities: resolvedFilm.qualities || ['360p', '480p', '720p'],
        };
    },

    getFirestoreDocumentId: normalizeKey,
};
