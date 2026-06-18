import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { EnergyBlast, SpiritBombVisual, Dagger, Bomb, Explosion, WindEffect, LightningStrike, WindStorm, GiantKatana, SniperBullet, DomainExpansion, FireArrow } from './Projectiles';

import { RobloxCharacter } from './RobloxCharacter';

export const OtherPlayer = ({ id, player }: { id: string; player: any }) => {
  const [blasts, setBlasts] = useState<any[]>([]);
  const [daggers, setDaggers] = useState<any[]>([]);
  const [bombs, setBombs] = useState<any[]>([]);
  const [explosions, setExplosions] = useState<any[]>([]);
  const [lightnings, setLightnings] = useState<any[]>([]);
  const [windStorms, setWindStorms] = useState<any[]>([]);
  const [giantKatanas, setGiantKatanas] = useState<any[]>([]);
  const [sniperBullets, setSniperBullets] = useState<any[]>([]);
  const [domainExpansions, setDomainExpansions] = useState<any[]>([]);
  const [fireArrows, setFireArrows] = useState<any[]>([]);
  const [windEffects, setWindEffects] = useState<any[]>([]);
  const [activeSpiritBomb, setActiveSpiritBomb] = useState(false);

  useEffect(() => {
    const handleAttack = (e: any) => {
      const data = e.detail;
      if (data.playerId !== id) return;

      switch (data.type) {
        case 'spiritBomb':
          setActiveSpiritBomb(true);
          setTimeout(() => setActiveSpiritBomb(false), 5000);
          break;
        case 'blast':
          setBlasts(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'dagger':
          setDaggers(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'bomb':
          setBombs(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'lightning':
          setLightnings(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'windStorm':
          setWindStorms(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'katana':
          setGiantKatanas(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'sniper':
          setSniperBullets(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'domain':
          setDomainExpansions(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'fuga':
          setFireArrows(prev => [...prev, { id: Date.now(), ...data }]);
          break;
        case 'theWorld':
          window.dispatchEvent(new CustomEvent('theWorldTrigger'));
          break;
      }
    };

    window.addEventListener('remoteAttack', handleAttack);
    return () => {
      window.removeEventListener('remoteAttack', handleAttack);
    };
  }, [id]);

  const pos = player?.position || [0, 0, 0];
  const rot = player?.rotation || [0, 0, 0];

  return (
    <group position={pos}>
      {/* Player Model Representation */}
      <RobloxCharacter playerId={player?.id} danceType={player?.danceType} position={[0, 0.15, 0]} rotation={[0, rot[1] || 0, 0]} scale={0.65} />
      
      {/* Name Label Placeholder (optional) */}
      {player.nickname && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/60 px-2 py-1 rounded text-white text-xs whitespace-nowrap font-sans font-medium border border-white/10 shadow-lg tracking-wide">
            {player.nickname}
          </div>
        </Html>
      )}
      
      {/* Visual Effects Synced */}
      {blasts.map((b) => (
        <EnergyBlast 
          key={b.id} 
          position={b.pos} 
          direction={b.dir} 
          onFinish={() => setBlasts(prev => prev.filter(item => item.id !== b.id))} 
        />
      ))}

      {daggers.map((d) => (
        <Dagger 
          key={d.id} 
          position={d.pos} 
          direction={d.dir} 
          onFinish={(hitPos) => {
            setDaggers(prev => prev.filter(item => item.id !== d.id));
            setWindEffects(prev => [...prev, { id: Date.now(), pos: hitPos }]);
          }} 
        />
      ))}

      {bombs.map((bm) => (
        <Bomb 
          key={bm.id} 
          position={bm.pos} 
          direction={bm.dir} 
          onExplode={(explodePos) => {
            setBombs(prev => prev.filter(item => item.id !== bm.id));
            setExplosions(prev => [...prev, { id: Date.now(), pos: explodePos }]);
          }} 
        />
      ))}

      {explosions.map((e) => (
        <Explosion 
          key={e.id} 
          position={e.pos} 
          onFinish={() => setExplosions(prev => prev.filter(item => item.id !== e.id))} 
        />
      ))}

      {lightnings.map((l) => (
        <LightningStrike 
          key={l.id} 
          position={l.pos} 
          isPowerful={l.isPowerful}
          isUltimate={l.isUltimate}
          isRainbow={l.isRainbow}
          onFinish={() => setLightnings(prev => prev.filter(item => item.id !== l.id))} 
        />
      ))}

      {windStorms.map((ws) => (
        <WindStorm 
          key={ws.id} 
          position={ws.pos} 
          onFinish={() => setWindStorms(prev => prev.filter(item => item.id !== ws.id))} 
        />
      ))}

      {giantKatanas.map((gk) => (
        <GiantKatana 
          key={gk.id} 
          position={gk.pos} 
          rotation={gk.rot} 
          onFinish={() => setGiantKatanas(prev => prev.filter(item => item.id !== gk.id))} 
        />
      ))}

      {sniperBullets.map((sb) => (
        <SniperBullet 
          key={sb.id} 
          position={sb.pos} 
          direction={sb.dir} 
          onFinish={(hitPos, hitSomething, isFinal) => {
            if (isFinal) {
              setSniperBullets(prev => prev.filter(item => item.id !== sb.id));
            }
          }} 
        />
      ))}
      
      {domainExpansions.map((de) => (
        <DomainExpansion 
          key={de.id} 
          position={de.pos} 
          rotation={de.rot} 
          onFinish={() => setDomainExpansions(prev => prev.filter(item => item.id !== de.id))} 
        />
      ))}
      
      {fireArrows.map((fa) => (
        <FireArrow 
          key={fa.id} 
          position={fa.pos} 
          direction={fa.dir} 
        />
      ))}
      
      {activeSpiritBomb && <SpiritBombVisual position={[0, 10, 0]} />}

      {windEffects.map((w) => (
        <WindEffect 
          key={w.id} 
          position={w.pos} 
          onFinish={() => setWindEffects(prev => prev.filter(item => item.id !== w.id))} 
        />
      ))}
    </group>
  );
};
