import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fetchPool } from '../services/api';
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

    // Anti-cheat/spam lock
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimer, setLockTimer] = useState(0);

    const channelRef = useRef<any>(null);
    const gameStateRef = useRef<GameState>('LOBBY');

    // Update ref for listeners
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Single persistent connection
    useEffect(() => {
        if (!roomId || !username) return;

        const channel = supabase.channel(`room_${roomId}`, {
            config: { presence: { key: username } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const players = Object.keys(state) || [];
                const otherPlayer = players.find(p => p !== username);
                if (otherPlayer) setOpponentName(otherPlayer);
            })
            .on('broadcast', { event: 'start_selection' }, (data) => {
                const pool = data?.payload?.pool;
                if (pool && Array.isArray(pool)) {
                    setSelectionPool(pool);
                    setGameState('SELECTING');
                }
            })
            .on('broadcast', { event: 'choice_ready' }, (data) => {
                const payload = data?.payload;
                if (payload?.user !== username && payload?.character) {
                    setIsOpponentReady(true);
                    setSecretCharacter(payload.character);
                }
            })
            .on('broadcast', { event: 'game_start' }, () => {
                if (gameStateRef.current !== 'PLAYING') {
                    setGameState('PLAYING');
                }
            })
            .on('broadcast', { event: 'move' }, (data) => {
                const payload = data?.payload;
                if (payload?.user !== username) {
                    setOpponentProgress(payload?.progress || 0);
                }
            })
            .on('broadcast', { event: 'win' }, (data) => {
                const payload = data?.payload;
                if (payload?.user !== username) {
                    setGameState('LOST');
                }
            })
            .on('broadcast', { event: 'restart' }, () => {
                resetLocalState();
                setGameState('LOBBY');
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
    }, [roomId, username]);

    const resetLocalState = () => {
        setCharacters([]);
        setUpCards(new Set());
        setMySelection(null);
        setSecretCharacter(null);
        setIsOpponentReady(false);
        setIsLocked(false);
        setLockTimer(0);
    };

    useEffect(() => {
        if (lockTimer > 0) {
            const timer = setTimeout(() => setLockTimer(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (lockTimer === 0 && isLocked) {
            setIsLocked(false);
        }
    }, [lockTimer, isLocked]);

    const startSelection = useCallback(async () => {
        setIsLoading(true);
        const pool = await fetchPool(50);
        setSelectionPool(pool || []);
        setGameState('SELECTING');
        setIsLoading(false);

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'start_selection',
                payload: { pool }
            });
        }
    }, []);

    useEffect(() => {
        if (gameState === 'SELECTING' && mySelection && isOpponentReady && secretCharacter && characters.length === 0) {
            finalizeGameStart();
        }
    }, [mySelection, isOpponentReady, secretCharacter, gameState, characters.length]);

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

    const finalizeGameStart = async () => {
        if (isLoading || characters.length > 0) return;
        setIsLoading(true);

        const boardSize = 47;
        const randomChars = await fetchPool(boardSize + 5);
        const filtered = (randomChars || []).filter(c => c.id !== secretCharacter?.id);
        const board = [secretCharacter!, ...filtered.slice(0, boardSize)].sort(() => Math.random() - 0.5);

        setCharacters(board);
        setUpCards(new Set(board.map(c => c.id)));
        setGameState('PLAYING');
        setIsLoading(false);

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'game_start',
                payload: { started: true }
            });
        }
    };

    const toggleCard = (id: number) => {
        if (gameState !== 'PLAYING' || isLocked) return;

        const next = new Set(upCards);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setUpCards(next);

        const progress = (characters || []).length - next.size;
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'move',
                payload: { user: username, progress: progress }
            });
        }
    };

    const guessCharacter = (charId: number) => {
        if (gameState !== 'PLAYING' || isLocked) return;

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
            setIsLocked(true);
            setLockTimer(10);
            alert('¡Incorrecto! Bloqueado por 10 segundos.');
        }
    };

    const handleRestart = useCallback(async () => {
        resetLocalState();
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
        characters: characters || [],
        selectionPool: selectionPool || [],
        mySelection,
        upCards,
        secretCharacter,
        opponentName,
        opponentProgress,
        isLoading,
        isOpponentReady,
        isLocked,
        lockTimer,
        startSelection,
        selectCharacter,
        toggleCard,
        guessCharacter,
        handleRestart
    };
};
