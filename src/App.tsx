import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { RoomManager } from './components/UI/RoomManager';
import { Game } from './components/Game/Game';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  const handleJoinRoom = (id: string, name: string) => {
    setRoomId(id);
    setUsername(name);
  };

  const handleCreateRoom = (name: string) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    setUsername(name);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {!roomId ? (
          <RoomManager
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
          />
        ) : (
          <Game
            roomId={roomId}
            username={username}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
