import { useEffect, useState } from 'react';
import { socket } from './socket';
import PixiCanvas from './components/PixiCanvas';
import ChatPanel from './components/ChatPanel';
import { Wifi, WifiOff } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    // Sync initial state in case connection happened before useEffect ran
    setIsConnected(socket.connected);

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
      setActiveRoom(null);
    }

    function onUserConnected(data) {
      console.log('Proximity connected:', data);
      setActiveRoom(data.roomCode);
    }

    function onUserDisconnected(data) {
      console.log('Proximity disconnected:', data);
      if (activeRoom === data.roomCode) {
        setActiveRoom(null);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('userConnected', onUserConnected);
    // User disconnected is sent per room when someone leaves radius
    socket.on('userDisconnected', (data) => {
      // It's possible we are in multiple rooms in a complex logic, but here we just leave
      if (activeRoom === data.roomCode) {
        setActiveRoom(null);
      }
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('userConnected', onUserConnected);
      socket.off('userDisconnected');
    };
  }, [activeRoom]);


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050510] font-['Outfit']">
      {/* 2D Canvas */}
      <PixiCanvas socket={socket} />

      {/* Top Right Connection Status */}
      <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/[0.03] backdrop-blur-3xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)] z-50 transition-all duration-500 animate-slide-up">
        {isConnected ? (
          <>
            <div className="relative flex items-center justify-center w-6 h-6">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
              <Wifi className="w-4 h-4 text-emerald-400 z-10" />
            </div>
            <span className="text-sm font-medium text-white/90 tracking-wide">Connected</span>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-6 h-6">
              <WifiOff className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-sm font-medium text-white/70 tracking-wide">Connecting...</span>
          </>
        )}
      </div>

      {/* Intro Overlay */}
      {!activeRoom && (
         <div className="absolute top-6 left-6 flex flex-col gap-2 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-3xl px-6 py-5 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 animate-float">
           <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
             Virtual Cosmos
           </h1>
           <div className="w-full h-[1px] bg-gradient-to-r from-white/20 to-transparent my-1" />
           <p className="text-sm font-light text-white/80 leading-relaxed max-w-[200px]">
             Use <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs mx-1">W A S D</kbd> to explore the void.
           </p>
           <p className="text-xs text-blue-300 font-medium mt-2 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Find players to connect.
           </p>
         </div>
      )}

      {/* Chat Panel - Only active when connected to someone */}
      {activeRoom && <ChatPanel socket={socket} activeRoom={activeRoom} />}
    </div>
  );
}

export default App;
