export interface Character {
    id: number;
    fullName: string;
    anime: string;
    power?: string;
    element?: string;
    status?: string;
    image: string;
}

import { FALLBACK_CHARACTERS } from './fallback';

export const fetchPool = async (count: number = 50): Promise<Character[]> => {
    try {
        // Pick a random starting point in the top characters (first 50 pages = top 1250 characters)
        const randomStartPage = Math.floor(Math.random() * 45) + 1;
        const allResults: any[] = [];

        // Fetch 2 pages starting from the random offset
        for (let i = 0; i < 2; i++) {
            const response = await fetch(`https://api.jikan.moe/v4/top/characters?page=${randomStartPage + i}`);

            if (response.status === 429) {
                console.warn("Jikan API Rate Limited. Using fallback pool.");
                return [...FALLBACK_CHARACTERS].sort(() => 0.5 - Math.random()).slice(0, count);
            }

            const data = await response.json();
            if (data.data) allResults.push(...data.data);

            if (i < 1) await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (allResults.length === 0) return FALLBACK_CHARACTERS;

        // Shuffle the combined pages locally to get high entropy
        const shuffled = allResults.sort(() => 0.5 - Math.random());

        return shuffled.slice(0, count).map((char: any) => ({
            id: char.mal_id,
            fullName: char.name,
            anime: char.about?.split('\n')[0] || 'Personaje Famoso',
            image: char.images.webp.image_url,
            power: 'N/A',
            status: 'Alive'
        }));
    } catch (error) {
        console.error('Error fetching pool:', error);
        return FALLBACK_CHARACTERS;
    }
};

export const fetchCharacters = async (limit: number = 48, excludeId?: number): Promise<Character[]> => {
    try {
        // Pick a random page from the top 1000 characters (approx 40 pages)
        const randomPage = Math.floor(Math.random() * 40) + 1;
        const response = await fetch(`https://api.jikan.moe/v4/top/characters?page=${randomPage}`);

        if (response.status === 429) {
            return [...FALLBACK_CHARACTERS].sort(() => 0.5 - Math.random()).slice(0, limit);
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            return [...FALLBACK_CHARACTERS].sort(() => 0.5 - Math.random()).slice(0, limit);
        }

        let filtered = data.data;
        if (excludeId) {
            filtered = data.data.filter((char: any) => char.mal_id !== excludeId);
        }

        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        const selection = shuffled.slice(0, limit);

        return selection.map((char: any) => ({
            id: char.mal_id,
            fullName: char.name,
            anime: char.about?.split('\n')[0] || 'Famous Character',
            image: char.images.webp.image_url,
            power: char.name_kanji || 'N/A',
            status: 'Alive'
        }));
    } catch (error) {
        return [...FALLBACK_CHARACTERS].sort(() => 0.5 - Math.random()).slice(0, limit);
    }
};
