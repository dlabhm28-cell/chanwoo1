import { useEffect, useState } from 'react';

export const useControls = () => {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    spiritBomb: false,
    dagger: false,
    bomb: false,
    charge: false,
    sniper: false,
    domain: false,
    fuga: false,
    theWorld: false,
    summon: false,
    barrier: false,
    dashAttack: false,
    blackFlash: false,
    frameFreeze: false,
    unlimitedVoid: false,
    selfEmbodiment: false,
    timeCellMoonPalace: false,
    spaceCleave: false,
    hollowPurple: false,
    weapon1: false,
    weapon2: false,
    weapon3: false,
    weapon4: false,
    weapon5: false,
    weapon6: false,
    weapon7: false,
    weapon8: false,
    weapon9: false,
    weapon0: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.pointerLockElement === null) return;

      switch (e.code) {
        case 'KeyW': setKeys(k => k.forward ? k : { ...k, forward: true }); break;
        case 'KeyS': setKeys(k => k.backward ? k : { ...k, backward: true }); break;
        case 'KeyA': setKeys(k => k.left ? k : { ...k, left: true }); break;
        case 'KeyD': setKeys(k => k.right ? k : { ...k, right: true }); break;
        case 'KeyQ': setKeys(k => k.dagger ? k : { ...k, dagger: true }); break;
        case 'KeyR': setKeys(k => k.charge ? k : { ...k, charge: true }); break;
        case 'KeyX': setKeys(k => k.bomb ? k : { ...k, bomb: true }); break;
        case 'KeyZ': setKeys(k => k.sniper ? k : { ...k, sniper: true }); break;
        case 'KeyF': setKeys(k => k.domain ? k : { ...k, domain: true }); break;
        case 'KeyV': setKeys(k => k.fuga ? k : { ...k, fuga: true }); break;
        case 'KeyT': setKeys(k => k.theWorld ? k : { ...k, theWorld: true }); break;
        case 'KeyN': setKeys(k => k.summon ? k : { ...k, summon: true }); break;
        case 'KeyM': setKeys(k => k.barrier ? k : { ...k, barrier: true }); break;
        case 'KeyG': setKeys(k => k.dashAttack ? k : { ...k, dashAttack: true }); break;
        case 'KeyB': setKeys(k => k.blackFlash ? k : { ...k, blackFlash: true }); break;
        case 'KeyY': setKeys(k => k.frameFreeze ? k : { ...k, frameFreeze: true }); break;
        case 'KeyK': setKeys(k => k.unlimitedVoid ? k : { ...k, unlimitedVoid: true }); break;
        case 'KeyI': setKeys(k => k.selfEmbodiment ? k : { ...k, selfEmbodiment: true }); break;
        case 'KeyL': setKeys(k => k.timeCellMoonPalace ? k : { ...k, timeCellMoonPalace: true }); break;
        case 'KeyO': setKeys(k => k.spaceCleave ? k : { ...k, spaceCleave: true }); break;
        case 'KeyP': setKeys(k => k.hollowPurple ? k : { ...k, hollowPurple: true }); break;
        case 'Digit1': setKeys(k => k.weapon1 ? k : { ...k, weapon1: true }); break;
        case 'Digit2': setKeys(k => k.weapon2 ? k : { ...k, weapon2: true }); break;
        case 'Digit3': setKeys(k => k.weapon3 ? k : { ...k, weapon3: true }); break;
        case 'Digit4': setKeys(k => k.weapon4 ? k : { ...k, weapon4: true }); break;
        case 'Digit5': setKeys(k => k.weapon5 ? k : { ...k, weapon5: true }); break;
        case 'Digit6': setKeys(k => k.weapon6 ? k : { ...k, weapon6: true }); break;
        case 'Digit7': setKeys(k => k.weapon7 ? k : { ...k, weapon7: true }); break;
        case 'Digit8': setKeys(k => k.weapon8 ? k : { ...k, weapon8: true }); break;
        case 'Digit9': setKeys(k => k.weapon9 ? k : { ...k, weapon9: true }); break;
        case 'Digit0': setKeys(k => k.weapon0 ? k : { ...k, weapon0: true }); break;
        case 'Space': setKeys(k => k.jump ? k : { ...k, jump: true }); break;
        case 'Enter': setKeys(k => k.spiritBomb ? k : { ...k, spiritBomb: true }); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.pointerLockElement === null) {
         // Reset all keys if pointer is unlocked to prevent stuck movement
         setKeys({
            forward: false, backward: false, left: false, right: false,
            jump: false, spiritBomb: false, dagger: false, bomb: false,
            charge: false, sniper: false, domain: false, fuga: false,
            theWorld: false, summon: false, barrier: false, dashAttack: false,
            blackFlash: false, frameFreeze: false, unlimitedVoid: false,
            selfEmbodiment: false, timeCellMoonPalace: false, spaceCleave: false, hollowPurple: false,
            weapon1: false, weapon2: false, weapon3: false, weapon4: false, weapon5: false,
            weapon6: false, weapon7: false, weapon8: false, weapon9: false, weapon0: false,
         });
         return;
      }

      switch (e.code) {
        case 'KeyW': setKeys(k => ({ ...k, forward: false })); break;
        case 'KeyS': setKeys(k => ({ ...k, backward: false })); break;
        case 'KeyA': setKeys(k => ({ ...k, left: false })); break;
        case 'KeyD': setKeys(k => ({ ...k, right: false })); break;
        case 'KeyQ': setKeys(k => ({ ...k, dagger: false })); break;
        case 'KeyR': setKeys(k => ({ ...k, charge: false })); break;
        case 'KeyX': setKeys(k => ({ ...k, bomb: false })); break;
        case 'KeyZ': setKeys(k => ({ ...k, sniper: false })); break;
        case 'KeyF': setKeys(k => ({ ...k, domain: false })); break;
        case 'KeyV': setKeys(k => ({ ...k, fuga: false })); break;
        case 'KeyT': setKeys(k => ({ ...k, theWorld: false })); break;
        case 'KeyN': setKeys(k => ({ ...k, summon: false })); break;
        case 'KeyM': setKeys(k => ({ ...k, barrier: false })); break;
        case 'KeyG': setKeys(k => ({ ...k, dashAttack: false })); break;
        case 'KeyB': setKeys(k => ({ ...k, blackFlash: false })); break;
        case 'KeyY': setKeys(k => ({ ...k, frameFreeze: false })); break;
        case 'KeyK': setKeys(k => ({ ...k, unlimitedVoid: false })); break;
        case 'KeyI': setKeys(k => ({ ...k, selfEmbodiment: false })); break;
        case 'KeyL': setKeys(k => ({ ...k, timeCellMoonPalace: false })); break;
        case 'KeyO': setKeys(k => ({ ...k, spaceCleave: false })); break;
        case 'KeyP': setKeys(k => ({ ...k, hollowPurple: false })); break;
        case 'Digit1': setKeys(k => ({ ...k, weapon1: false })); break;
        case 'Digit2': setKeys(k => ({ ...k, weapon2: false })); break;
        case 'Digit3': setKeys(k => ({ ...k, weapon3: false })); break;
        case 'Digit4': setKeys(k => ({ ...k, weapon4: false })); break;
        case 'Digit5': setKeys(k => ({ ...k, weapon5: false })); break;
        case 'Digit6': setKeys(k => ({ ...k, weapon6: false })); break;
        case 'Digit7': setKeys(k => ({ ...k, weapon7: false })); break;
        case 'Digit8': setKeys(k => ({ ...k, weapon8: false })); break;
        case 'Digit9': setKeys(k => ({ ...k, weapon9: false })); break;
        case 'Digit0': setKeys(k => ({ ...k, weapon0: false })); break;
        case 'Space': setKeys(k => ({ ...k, jump: false })); break;
        case 'Enter': setKeys(k => ({ ...k, spiritBomb: false })); break;
      }
    };



    const handlePointerLockChange = () => {
      if (document.pointerLockElement === null) {
         setKeys({
            forward: false, backward: false, left: false, right: false,
            jump: false, spiritBomb: false, dagger: false, bomb: false,
            charge: false, sniper: false, domain: false, fuga: false,
            theWorld: false, summon: false, barrier: false, dashAttack: false,
            blackFlash: false, frameFreeze: false, unlimitedVoid: false,
            selfEmbodiment: false, timeCellMoonPalace: false, spaceCleave: false, hollowPurple: false,
            weapon1: false, weapon2: false, weapon3: false, weapon4: false, weapon5: false,
            weapon6: false, weapon7: false, weapon8: false, weapon9: false, weapon0: false,
         });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  return keys;
};

