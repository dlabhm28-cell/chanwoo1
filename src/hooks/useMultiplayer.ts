import { useEffect, useState, useCallback, useRef } from 'react';
import { database } from '../firebase';
import { ref, set, onValue, onDisconnect, remove, update, push, onChildAdded } from 'firebase/database';

export const useMultiplayer = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const playerIdRef = useRef(Math.random().toString(36).substring(2, 10));
  const playerId = playerIdRef.current;

  useEffect(() => {
    const playersRef = ref(database, 'game/players');
    const myPlayerRef = ref(database, `game/players/${playerId}`);

    // Set initial player data
    set(myPlayerRef, {
      id: playerId,
      nickname: `Player-${playerId.substring(0, 4)}`,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      score: 0,
      timestamp: Date.now()
    });

    // Remove on disconnect
    onDisconnect(myPlayerRef).remove();

    // Listen to all players
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerList = Object.keys(data)
          .filter(key => key !== playerId)
          .map(key => data[key]);
        setPlayers(playerList);
      } else {
        setPlayers([]);
      }
    });

    // Listen to chat
    const chatRef = ref(database, 'game/chat');
    const chatUnsub = onChildAdded(chatRef, (snapshot) => {
       const msg = snapshot.val();
       if (msg) {
          window.dispatchEvent(new CustomEvent('chatMessage', { detail: msg }));
       }
    });

    const attacksRef = ref(database, 'game/attacks');
    const attacksUnsub = onChildAdded(attacksRef, (snapshot) => {
       const attack = snapshot.val();
       if (attack && attack.playerId !== playerId) {
          // Time tolerance to ignore old attacks
          if (Date.now() - attack.timestamp < 5000) {
             window.dispatchEvent(new CustomEvent('remoteAttack', { detail: attack }));
          }
       }
    });

    return () => {
      remove(myPlayerRef);
      unsubscribe();
      chatUnsub();
      attacksUnsub();
    };
  }, [playerId]);

  const emitMove = useCallback((position: [number, number, number], rotation: [number, number, number], danceType?: number) => {
    const myPlayerRef = ref(database, `game/players/${playerId}`);
    const updateData: any = { position, rotation, timestamp: Date.now() };
    if (danceType !== undefined) {
      updateData.danceType = danceType;
    }
    update(myPlayerRef, updateData);
  }, [playerId]);

  const emitAttack = useCallback((type: string, data: any) => {
    const attackRef = push(ref(database, 'game/attacks'));
    set(attackRef, { type, ...data, playerId, timestamp: Date.now() });
    setTimeout(() => remove(attackRef), 2000); // clean up
  }, [playerId]);

  const emitUpdateProfile = useCallback((nickname: string) => {
    const myPlayerRef = ref(database, `game/players/${playerId}`);
    update(myPlayerRef, { nickname });
  }, [playerId]);

  const emitUpdateScore = useCallback((scoreToAdd: number) => {
    // Since we don't have the current score right here easily without a transaction,
    // let's just do a small hack: this might be sufficient for a simple game
    // or just listen to our own score somewhere else.
  }, [playerId]);

  const emitChat = useCallback((message: string, nickname?: string) => {
    const chatRef = push(ref(database, 'game/chat'));
    set(chatRef, { playerId, nickname: nickname || playerId, message, timestamp: Date.now() });
  }, [playerId]);

  return { socket: null, players, emitMove, emitAttack, emitUpdateProfile, emitUpdateScore, emitChat };
};

