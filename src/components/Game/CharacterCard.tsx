import React from 'react';
import { motion } from 'framer-motion';
import type { Character } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Target } from 'lucide-react';
import { clsx } from 'clsx';

interface CharacterCardProps {
    character: Character;
    isDown: boolean;
    onClick: () => void;
    onGuess?: (id: number) => void;
    isSecret?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
    character,
    isDown,
    onClick,
    onGuess,
    isSecret = false
}) => {
    const { theme } = useTheme();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
                "group relative w-full aspect-[3/4] cursor-pointer perspective-1000",
                isSecret && "ring-4 ring-[var(--accent-color)] shadow-2xl scale-105"
            )}
            onClick={onClick}
        >
            <motion.div
                animate={{ rotateY: isDown ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full h-full relative"
            >
                {/* Front side */}
                <div
                    className={clsx(
                        "absolute inset-0 w-full h-full backface-hidden overflow-hidden flex flex-col glass rounded-[var(--border-radius)]",
                        theme === 'kawaii' && "kawaii-shadow border-4 border-white",
                        theme === 'cyberpunk' && "neon-border shadow-[0_0_15px_rgba(0,255,255,0.3)]",
                    )}
                >
                    <div className="relative flex-1 bg-white/5 overflow-hidden">
                        <img
                            src={character.image}
                            alt={character.fullName}
                            className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent flex flex-col justify-end p-3">
                            <h3 className="text-sm font-black uppercase tracking-tighter text-white drop-shadow-lg leading-tight text-center">
                                {character.fullName}
                            </h3>
                        </div>

                        {/* Guess Button Overlay */}
                        {onGuess && !isSecret && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onGuess) onGuess(character.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-[var(--accent-color)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-125 active:scale-95 z-40"
                                title="¿Es este?"
                            >
                                <Target className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Back side */}
                <div
                    style={{ transform: "rotateY(180deg)" }}
                    className={clsx(
                        "absolute inset-0 w-full h-full backface-hidden flex items-center justify-center glass rounded-[var(--border-radius)]",
                        "bg-gradient-to-br from-[var(--bg-color)] to-[var(--accent-color)]/20 shadow-inner",
                        theme === 'kawaii' && "bg-pink-100 border-4 border-white",
                        theme === 'cyberpunk' && "bg-black/90 neon-border",
                    )}
                >
                    {theme === 'cyberpunk' ? (
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-red-500/50 glitch-text tracking-widest uppercase">ELIMINADO</span>
                            <div className="w-12 h-0.5 bg-red-500/30 mt-2 animate-pulse" />
                        </div>
                    ) : theme === 'kawaii' ? (
                        <div className="text-center">
                            <span className="text-6xl drop-shadow-lg block mb-2">🎈</span>
                            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">¡Adiós!</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center opacity-20">
                            <span className="text-xl font-black uppercase tracking-[0.3em]">OUT</span>
                            <div className="w-8 h-8 rounded-full border-2 border-white mt-4" />
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
