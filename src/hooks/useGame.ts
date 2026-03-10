import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fetchCharacters, fetchPool } from '../services/api';
import type { Character } from '../services/api';

export type GameState = 'LOBBY' | 'SELECTING' | 'PLAYING' | 'WON' | 'LOST';

export const useGame = (roomId: string, username: string) => {
    const [gameState, setGameState] = useState<GameState>('LOBBY');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectionPool, setSelectionPool] = useState<Character[]>([]);
    const [mySelection, setMySelection] = useState<Character | null>(null);
    const [upCards, setUpCards] = useState<Set<number>>(new Set());
    const [secretCharacter, setSecretCharacter] = useState<Character | null>(null);
    const [opponentName, setOpponentName] = useState<string>('');
    const [opponentProgress, setOpponentProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpponentReady, setIsOpponentReady] = useState(false);

    const channelRef = useRef<any>(null);
    const gameStartedRef = useRef(false);

    // Initial setup: Lobby + Presence
    useEffect(() => {
        if (!roomId || !username) return;

        const channel = supabase.channel(`room_${roomId}`, {
            config: { presence: { key: username } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const players = Object.keys(state);
                const otherPlayer = players.find(p => p !== username);
                if (otherPlayer) setOpponentName(otherPlayer);
            })
            .on('broadcast', { event: 'start_selection' }, ({ payload }) => {
                // 1. One player fetches the pool and shares it to avoid 429
                if (payload.pool) {
                    setSelectionPool(payload.pool);
                    setGameState('SELECTING');
                } else if (gameState === 'LOBBY') {
                    // Fallback for case where pool isn't in payload (shouldn't happen with new logic)
                    setGameState('SELECTING');
                }
            })
            .on('broadcast', { event: 'choice_ready' }, ({ payload }) => {
                if (payload.user !== username) {
                    setIsOpponentReady(true);
                    setSecretCharacter(payload.character);
                }
            })
            .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                if (gameStartedRef.current) return;
                setCharacters(payload.board);
                setUpCards(new Set(payload.board.map((c: Character) => c.id)));
                setGameState('PLAYING');
                gameStartedRef.current = true;
            })
            .on('broadcast', { event: 'move' }, ({ payload }) => {
                if (payload.user !== username) {
                    setOpponentProgress(payload.progress);
                }
            })
            .on('broadcast', { event: 'win' }, ({ payload }) => {
                if (payload.user !== username) {
                    setGameState('LOST');
                }
            })
            .on('broadcast', { event: 'restart' }, () => {
                resetGameState();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [roomId, username, gameState]);

    const resetGameState = () => {
        setCharacters([]);
        setUpCards(new Set());
        setMySelection(null);
        setSecretCharacter(null);
        setIsOpponentReady(false);
        gameStartedRef.current = false;
        setGameState('LOBBY');
    };

    // Start selection: ONLY the host fetches to prevent 429
    const startSelection = useCallback(async () => {
        setIsLoading(true);
        // Local cache to avoid re-fetching the same list in the same session
        const pool = await fetchPool(50);
        setSelectionPool(pool);
        setGameState('SELECTING');
        setIsLoading(false);

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'start_selection',
                payload: { pool } // Transmit the pool to the other player
            });
        }
    }, []);

    // Automatic game start when both are ready
    useEffect(() => {
        if (gameState === 'SELECTING' && mySelection && isOpponentReady && secretCharacter && !gameStartedRef.current) {
            finalizeGameStart();
        }
    }, [mySelection, isOpponentReady, secretCharacter, gameState]);

    // Pick my secret character
    const selectCharacter = useCallback(async (char: Character) => {
        setMySelection(char);

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'choice_ready',
                payload: { user: username, character: char }
            });
        }
    }, [username]);

    // Generate the final game board
    const finalizeGameStart = async () => {
        if (gameStartedRef.current || isLoading) return;
        setIsLoading(true);

        const randomChars = await fetchCharacters(60, secretCharacter?.id);
        const filtered = randomChars
            .filter(c => c.id !== secretCharacter?.id)
            .slice(0, 47);

        const board = [...filtered, secretCharacter!].sort(() => Math.random() - 0.5);

        setCharacters(board);
        setUpCards(new Set(board.map(c => c.id)));
        setGameState('PLAYING');
        gameStartedRef.current = true;
        setIsLoading(false);

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'game_start',
                payload: { board }
            });
        }
    };

    const toggleCard = (id: number) => {
        if (gameState !== 'PLAYING') return;

        const next = new Set(upCards);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setUpCards(next);

        const progress = characters.length - next.size;
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'move',
                payload: { user: username, progress: progress }
            });
        }

        if (next.size === 1) {
            const lastId = Array.from(next)[0];
            if (secretCharacter && lastId === secretCharacter.id) {
                setGameState('WON');
                if (channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'win',
                        payload: { user: username }
                    });
                }
            }
        }
    };

    const guessCharacter = (charId: number) => {
        if (secretCharacter && charId === secretCharacter.id) {
            setGameState('WON');
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'win',
                    payload: { user: username }
                });
            }
        } else {
            alert('¡Incorrecto! No es el personaje secreto.');
        }
    };

    const handleRestart = useCallback(async () => {
        resetGameState();
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'restart',
                payload: {}
            });
        }
        await startSelection();
    }, [startSelection]);

    return {
        gameState,
        characters,
        selectionPool,
        mySelection,
        upCards,
        secretCharacter,
        opponentName,
        opponentProgress,
        isLoading,
        isOpponentReady,
        startSelection,
        selectCharacter,
        toggleCard,
        guessCharacter,
        handleRestart
    };
};
