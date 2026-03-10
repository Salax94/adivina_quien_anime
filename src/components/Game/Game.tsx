import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../hooks/useGame';
import { CharacterCard } from './CharacterCard';
import { Button } from '../UI/Button';
import { Loader2, RefreshCcw, User, RotateCcw, Play, Users, Target, Lock } from 'lucide-react';
import { clsx } from 'clsx';

interface GameProps {
    roomId: string;
    username: string;
}

export const Game: React.FC<GameProps> = ({ roomId, username }) => {
    const {
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
        isLocked,
        lockTimer,
        startSelection,
        selectCharacter,
        toggleCard,
        guessCharacter,
        handleRestart
    } = useGame(roomId, username);

    const [alertText, setAlertText] = useState<string | null>(null);

    // Initial setup: Alert cleanup
    useEffect(() => {
        if (alertText) {
            const timer = setTimeout(() => setAlertText(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [alertText]);

    // 1. Loading State (Global)
    if (isLoading && characters.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-color)] text-white">
                <Loader2 className="w-12 h-12 text-[var(--accent-color)] animate-spin" />
                <p className="text-xl font-bold animate-pulse uppercase tracking-widest text-center">
                    {gameState === 'LOBBY' ? 'Invocando guerreros...' : 'Generando tablero...'}
                </p>
                <div className="text-xs opacity-50 uppercase tracking-tighter">Esto puede tardar unos segundos</div>
            </div>
        );
    }

    // 2. Lobby View: Waiting for opponent
    if (gameState === 'LOBBY') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-color)] text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass max-w-lg w-full p-8 rounded-3xl text-center space-y-8 border border-white/10"
                >
                    <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase tracking-widest opacity-40">SALA PRIVADA</h2>
                        <div className="text-4xl font-black bg-[var(--accent-color)]/20 text-[var(--accent-color)] inline-block px-6 py-2 rounded-2xl border border-[var(--accent-color)]/30">
                            {roomId}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 py-8">
                        {opponentName ? (
                            <div className="space-y-4 w-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10"
                                >
                                    <div className="p-2 bg-green-500/20 rounded-full">
                                        <Users className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs uppercase opacity-40 font-bold">Oponente Conectado</p>
                                        <p className="text-xl font-black">{opponentName}</p>
                                    </div>
                                </motion.div>
                                <Button className="w-full h-16 text-xl uppercase tracking-widest bg-[var(--accent-color)]" onClick={startSelection}>
                                    <Play className="fill-current" />
                                    ¡Comenzar Desafío!
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-12 rounded-full border-4 border-dashed border-white/10 animate-[spin_10s_linear_infinite] inline-flex items-center justify-center relative">
                                    <Users className="w-12 h-12 opacity-20" />
                                    <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent-color)] rounded-full animate-spin" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black">Esperando a tu rival...</p>
                                    <p className="text-sm opacity-50">Comparte el código de la sala para empezar.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // 3. Selection View: Choose your secret character
    if (gameState === 'SELECTING') {
        return (
            <div className="min-h-screen p-8 bg-[var(--bg-color)]">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter italic uppercase text-[var(--accent-color)]">
                            {mySelection ? 'PERSONAJE ELEGIDO' : 'PREPARACIÓN'}
                        </h2>
                        <p className="text-lg opacity-60">
                            {mySelection
                                ? `Has elegido a ${mySelection.fullName}. Esperando al oponente...`
                                : `Elige a tu personaje secreto entre los 50 disponibles.`}
                        </p>
                    </div>

                    {isOpponentReady && (
                        <div className="max-w-xs mx-auto text-center py-2 px-4 rounded-full bg-green-500/20 text-green-400 text-sm font-bold animate-bounce border border-green-500/20">
                            ¡RIVAL LISTO! Solo faltas tú.
                        </div>
                    )}

                    {!mySelection ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                            {selectionPool.map(char => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    isDown={false}
                                    onClick={() => selectCharacter(char)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 py-12">
                            <div className="w-64 transform scale-125">
                                <CharacterCard character={mySelection} isDown={false} onClick={() => { }} />
                            </div>
                            <Loader2 className="w-8 h-8 text-[var(--accent-color)] animate-spin" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-40 underline decoration-[var(--accent-color)]">Sincronizando con el oponente...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Playing View (Board)
    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative">
            {/* Lock Overlay */}
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-red-600 p-8 rounded-3xl shadow-2xl text-center space-y-4 border-4 border-red-400"
                        >
                            <Lock className="w-16 h-16 text-white mx-auto animate-bounce" />
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">¡PENALIZACIÓN!</h2>
                            <p className="text-red-100 font-bold">Has fallado. Bloqueado por {lockTimer}s</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar - Player Info */}
            <aside className="w-full lg:w-80 glass p-6 flex flex-col gap-8 border-r border-white/5 order-2 lg:order-1">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest opacity-50">Sala Privada</h2>
                        <span className="bg-[var(--accent-color)]/20 text-[var(--accent-color)] px-2 py-1 rounded text-[10px] font-bold">
                            {roomId}
                        </span>
                    </div>

                    <div className="p-4 rounded-[var(--border-radius)] bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[var(--accent-color)]" />
                            <span className="font-bold">{username} (Tú)</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[var(--accent-color)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(upCards.size / (characters.length || 1)) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] opacity-60 uppercase">{upCards.size} cartas activas</p>
                    </div>

                    <div className="p-4 rounded-[var(--border-radius)] bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
                            <Users className="w-4 h-4 text-white/40" />
                            <span className="font-bold opacity-60">{opponentName || 'Esperando...'}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white/20"
                                initial={{ width: 0 }}
                                animate={{ width: `${(opponentProgress / (characters.length || 1)) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] opacity-60 uppercase">{characters.length - opponentProgress} activos restantes</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-8">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Objetivo del Oponente</h3>
                    <p className="text-[10px] opacity-40 uppercase">(Es el que le diste)</p>
                    {mySelection && (
                        <div className="w-40 opacity-70">
                            <CharacterCard character={mySelection} isDown={false} onClick={() => { }} isSecret />
                        </div>
                    )}
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mt-4 underline decoration-[var(--accent-color)]">Tú debes adivinar a:</h3>
                    <div className="p-4 border border-dashed border-white/20 rounded-2xl w-full flex items-center justify-center gap-2 bg-white/5">
                        <Target className="w-5 h-5 text-[var(--accent-color)] animate-pulse" />
                        <span className="text-xs font-bold opacity-80 uppercase tracking-tighter italic text-center">¡Usa el botón de la diana para adivinar!</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full opacity-50 hover:opacity-100 transition-opacity" onClick={handleRestart}>
                    <RefreshCcw className="w-4 h-4" />
                    Abandonar Partida
                </Button>
            </aside>

            {/* Main Board */}
            <main className="flex-1 p-4 lg:p-8 order-1 lg:order-2 overflow-y-auto max-h-screen">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 sm:gap-3">
                    <AnimatePresence>
                        {characters.map((char) => (
                            <CharacterCard
                                key={char.id}
                                character={char}
                                isDown={!upCards.has(char.id)}
                                onClick={() => toggleCard(char.id)}
                                onGuess={(id) => guessCharacter(id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* Overlays for Win/Loss */}
            <AnimatePresence>
                {(gameState === 'WON' || gameState === 'LOST') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={clsx(
                                "p-10 rounded-3xl max-w-md w-full text-center border shadow-2xl overflow-hidden relative",
                                gameState === 'WON' ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"
                            )}
                        >
                            <div className="relative z-10 space-y-6">
                                <h2 className={clsx(
                                    "text-6xl font-black mb-2 uppercase italic tracking-tighter",
                                    gameState === 'WON' ? "text-green-400" : "text-red-400"
                                )}>
                                    {gameState === 'WON' ? '¡VICTORIA!' : '¡DERROTA!'}
                                </h2>
                                <div className="space-y-4">
                                    <p className="text-lg opacity-80 text-white">
                                        {gameState === 'WON'
                                            ? '¡Increíble! Has descubierto su personaje secreto.'
                                            : 'Lástima... Tu oponente adivinó más rápido.'}
                                    </p>
                                    {secretCharacter && (
                                        <div className="w-full flex flex-col items-center gap-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-color)]">El Secreto era:</p>
                                            <div className="w-32">
                                                <CharacterCard character={secretCharacter} isDown={false} onClick={() => { }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button variant="primary" onClick={handleRestart} className="w-full h-14 text-lg uppercase font-bold bg-[var(--accent-color)]">
                                    <RotateCcw className="w-5 h-5" />
                                    Revancha
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
