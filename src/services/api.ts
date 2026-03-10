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

export const fetchPool = async (count: number = 100): Promise<Character[]> => {
    try {
        const pages = Math.ceil(count / 25);
        const allResults: any[] = [];

        for (let i = 0; i < pages; i++) {
            const response = await fetch(`https://api.jikan.moe/v4/top/characters?page=${i + 1}`);

            if (response.status === 429) {
                console.warn("Jikan API Rate Limited. Using fallback pool.");
                return FALLBACK_CHARACTERS;
            }

            const data = await response.json();
            if (data.data) allResults.push(...data.data);

            if (i < pages - 1) await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (allResults.length === 0) return FALLBACK_CHARACTERS;

        return allResults.slice(0, count).map((char: any) => ({
            id: char.mal_id,
            fullName: char.name,
            anime: char.about?.split('\n')[0] || 'Famous Character',
            image: char.images.webp.image_url,
            power: char.name_kanji || 'N/A',
            status: 'Alive'
        }));
    } catch (error) {
        console.error('Error fetching pool:', error);
        return FALLBACK_CHARACTERS;
    }
};
export const fetchCharacters = async (limit: number = 48, excludeId?: number): Promise<Character[]> => {
    try {
        const randomPage = Math.floor(Math.random() * 15) + 1;
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
