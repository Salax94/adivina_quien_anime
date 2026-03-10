import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeType } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Users, Plus, Play, Monitor, Zap, Smile } from 'lucide-react';
import { clsx } from 'clsx';

interface RoomManagerProps {
    onJoinRoom: (roomId: string, username: string) => void;
    onCreateRoom: (username: string) => void;
}

export const RoomManager: React.FC<RoomManagerProps> = ({ onJoinRoom, onCreateRoom }) => {
    const { theme, setTheme } = useTheme();
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const themes: { id: ThemeType; label: string; icon: any; color: string }[] = [
        { id: 'cyberpunk', label: 'Ciberpunk', icon: Zap, color: 'text-cyan-400' },
        { id: 'dark', label: 'Oscuro Pro', icon: Monitor, color: 'text-white' },
        { id: 'kawaii', label: 'Tierno (Kawaii)', icon: Smile, color: 'text-pink-400' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass p-8 rounded-[var(--border-radius)] flex flex-col gap-8 shadow-2xl relative overflow-hidden"
            >
                {/* Background glow for theme */}
                <div className={clsx(
                    "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-30 transition-colors duration-1000",
                    theme === 'cyberpunk' ? "bg-cyan-500" : theme === 'dark' ? "bg-blue-600" : "bg-pink-400"
                )} />

                <div className="text-center space-y-2">
                    <h1 className={clsx(
                        "text-4xl font-black tracking-tighter uppercase",
                        theme === 'cyberpunk' && "glitch-text text-cyan-400",
                        theme === 'kawaii' && "text-pink-500"
                    )}>
                        Anime <span className="text-[var(--accent-color)]">Guess Who</span>
                    </h1>
                    <p className="opacity-60 text-sm">Elige tu estilo y entra en la arena.</p>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-50">Selecciona Estética</label>
                    <div className="grid grid-cols-3 gap-3">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={clsx(
                                    "flex flex-col items-center gap-2 p-3 rounded-[var(--border-radius)] border transition-all",
                                    theme === t.id
                                        ? "border-[var(--accent-color)] bg-[var(--accent-color)]/20 shadow-lg scale-105"
                                        : "border-white/5 hover:border-white/20"
                                )}
                            >
                                <t.icon className={clsx("w-6 h-6", t.color)} />
                                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Nombre de Usuario"
                        placeholder="Escribe tu nombre..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    {!isJoining ? (
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => onCreateRoom(username)}
                                disabled={!username}
                                className="w-full"
                                variant="primary"
                            >
                                <Plus className="w-5 h-5" />
                                Crear Sala Privada
                            </Button>
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-[10px] font-bold opacity-30">O TAMBIÉN</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>
                            <Button
                                onClick={() => setIsJoining(true)}
                                disabled={!username}
                                variant="outline"
                                className="w-full"
                            >
                                <Users className="w-5 h-5" />
                                Unirse a una Sala
                            </Button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-3"
                        >
                            <Input
                                label="ID de la Sala"
                                placeholder="Código de 6 caracteres"
                                maxLength={6}
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="ghost" onClick={() => setIsJoining(false)}>
                                    Atrás
                                </Button>
                                <Button
                                    onClick={() => onJoinRoom(roomId, username)}
                                    disabled={roomId.length !== 6}
                                >
                                    <Play className="w-5 h-5" />
                                    Entrar a Sala
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="text-center opacity-40 text-[10px] font-medium uppercase">
                    MULTIJUGADOR POTENCIADO POR SUPABASE
                </div>
            </motion.div>
        </div>
    );
};
