import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const SPEED = 5;

export default function PixiCanvas({ socket }) {
  const containerRef = useRef(null);
  const usersMapRef = useRef(new Map());
  const myIdRef = useRef(null);
  
  const keys = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    let app;
    let isDestroyed = false;

    // Keyboard listeners
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) keys.current[key] = true;
    };
    const onKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) keys.current[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    async function initPixi() {
      app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundColor: 0x0B0E14,
        antialias: true,
      });

      if (isDestroyed) {
        if (app.renderer) {
          app.destroy(true);
        }
        return;
      }

      containerRef.current.appendChild(app.canvas);

      // Camera container to hold all world objects
      const world = new PIXI.Container();
      app.stage.addChild(world);

      // Draw grid
      const grid = new PIXI.Graphics();
      const gridSize = 100;
      for (let i = -5000; i <= 5000; i += gridSize) {
        grid.moveTo(i, -5000);
        grid.lineTo(i, 5000);
        grid.moveTo(-5000, i);
        grid.lineTo(5000, i);
      }
      grid.stroke({ width: 1, color: 0x4a4a8a, alpha: 0.15 });
      world.addChild(grid);

      // Socket listeners
      socket.on('initUsers', (userList) => {
        userList.forEach(u => addOrUpdateUser(u, world));
      });

      socket.on('userJoined', (u) => {
        addOrUpdateUser(u, world);
      });

      socket.on('positionsUpdate', (userList) => {
        userList.forEach(u => addOrUpdateUser(u, world));
      });

      socket.on('userLeft', (socketId) => {
        removeUser(socketId, world);
      });

      const addOrUpdateUser = (userData, container) => {
        if (!usersMapRef.current.has(userData.id)) {
          // Create new sprite/graphic
          const userGroup = new PIXI.Container();
          
          const colorHex = userData.color.replace('#', '0x');

          // Glow effect
          const glow = new PIXI.Graphics();
          glow.circle(0, 0, 24);
          glow.fill({ color: colorHex, alpha: 0.3 });
          
          const circle = new PIXI.Graphics();
          circle.circle(0, 0, 16);
          circle.fill({ color: colorHex });
          circle.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });

          const text = new PIXI.Text({
            text: userData.name,
            style: {
              fontFamily: 'Outfit',
              fontSize: 12,
              fontWeight: '500',
              fill: 0xffffff,
              align: 'center',
            }
          });
          text.anchor.set(0.5, 2.5);

          userGroup.addChild(glow);
          userGroup.addChild(circle);
          userGroup.addChild(text);
          
          userGroup.x = userData.x;
          userGroup.y = userData.y;

          container.addChild(userGroup);
          usersMapRef.current.set(userData.id, {
            group: userGroup,
            targetX: userData.x,
            targetY: userData.y
          });
        } else {
          const u = usersMapRef.current.get(userData.id);
          // Only update target if it's not my own user
          if (userData.id !== socket.id) {
            u.targetX = userData.x;
            u.targetY = userData.y;
          }
        }
      }

      function removeUser(socketId, container) {
        const u = usersMapRef.current.get(socketId);
        if (u) {
          container.removeChild(u.group);
          u.group.destroy({ children: true });
          usersMapRef.current.delete(socketId);
        }
      }

      // Game loop
      let lastEmit = 0;
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;
        const myUser = usersMapRef.current.get(socket.id);
        
        // Update local movement immediately
        if (myUser) {
          let moved = false;
          if (keys.current.w) { myUser.group.y -= SPEED * delta; moved = true; }
          if (keys.current.s) { myUser.group.y += SPEED * delta; moved = true; }
          if (keys.current.a) { myUser.group.x -= SPEED * delta; moved = true; }
          if (keys.current.d) { myUser.group.x += SPEED * delta; moved = true; }

          if (moved) {
            // Throttled emit
            const now = Date.now();
            if (now - lastEmit > 50) {
              socket.emit('move', { x: myUser.group.x, y: myUser.group.y });
              lastEmit = now;
            }
          }

          if (app.screen) {
            // Camera follow
            world.x = (app.screen.width / 2) - myUser.group.x;
            world.y = (app.screen.height / 2) - myUser.group.y;
          }
        }

        // Interpolate other users
        for (const [id, u] of usersMapRef.current.entries()) {
          if (id !== socket.id) {
            u.group.x += (u.targetX - u.group.x) * 0.1 * delta;
            u.group.y += (u.targetY - u.group.y) * 0.1 * delta;
          }
        }
      });
    }

    initPixi();

    return () => {
      isDestroyed = true;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      socket.off('initUsers');
      socket.off('userJoined');
      socket.off('positionsUpdate');
      socket.off('userLeft');

      if (app && app.renderer) {
        try {
          if (containerRef.current && app.canvas) {
            containerRef.current.removeChild(app.canvas);
          }
          app.destroy(true);
        } catch (err) {
          console.error("PIXI destroy error:", err);
        }
      }
    };
  }, [socket]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-crosshair overflow-hidden" style={{ touchAction: 'none' }} />;
}
