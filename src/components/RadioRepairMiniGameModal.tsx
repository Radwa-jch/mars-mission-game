import React, { useMemo, useState } from 'react';
import { MarsSolScenario } from '../types/game';
import { sounds } from '../audio/SoundManager';
import { PixelIcon } from './PixelIcon';

interface RadioRepairMiniGameModalProps {
  solScenario: MarsSolScenario;
  currentOxygen?: number;
  onComplete: (choice: 'auto' | 'wait_earth') => void;
  onClose: () => void;
}

export const RadioRepairMiniGameModal: React.FC<RadioRepairMiniGameModalProps> = ({
  solScenario,
  currentOxygen = 100,
  onComplete,
  onClose,
}) => {
  const { targetMin, targetMax, targetCenter, initialFreq } = useMemo(() => {
    const min = 24 + Math.floor(Math.random() * 46); // 24..69
    const max = min + 8;
    const center = min + 4;
    const start = center > 50 ? 16 : 84;
    return { targetMin: min, targetMax: max, targetCenter: center, initialFreq: start };
  }, []);

  const [step, setStep] = useState<'tune' | 'storm_slider'>('tune');
  const [frequencyMhz, setFrequencyMhz] = useState(initialFreq);
  const [comparePercent, setComparePercent] = useState(50);

  const distFromCenter = Math.abs(frequencyMhz - targetCenter);
  const isLocked = frequencyMhz >= targetMin && frequencyMhz <= targetMax;
  const signalStrength = Math.max(10, Math.min(100, Math.round(100 - distFromCenter * 2.1)));
  const canWaitForEarth = currentOxygen > 22;

  const handleLockSignal = () => {
    if (!isLocked) return;
    sounds.playObjectiveStinger();
    setStep('storm_slider');
  };

  const handleFinish = (choice: 'auto' | 'wait_earth') => {
    if (choice === 'wait_earth' && !canWaitForEarth) return;
    sounds.playPickup();
    onComplete(choice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto pixel-box-amber bg-[#120b09] p-5 sm:p-6 text-slate-100">
        <div className="flex items-start justify-between pb-3 border-b-2 border-[#49302b]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-hud font-bold text-amber-400 uppercase tracking-wider mb-1">
              <PixelIcon name="radio" className="w-4 h-4" />
              <span>
                {step === 'tune'
                  ? 'STEP 1 OF 2 // TUNE THE EARTH RADIO'
                  : 'STEP 2 OF 2 // SPOT THE DUST STORM'}
              </span>
            </div>
            <h2 className="font-title text-base sm:text-xl font-bold text-white uppercase">
              {step === 'tune'
                ? 'Line Up the Dish Signal!'
                : 'Slide to Compare Before & Storm!'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="pixel-btn p-2 bg-[#1e1412] hover:bg-[#2a1b18] text-slate-300 hover:text-white cursor-pointer"
            title="Close"
          >
            <PixelIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {step === 'tune' ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="p-4 bg-[#1a100e] border-2 border-[#49302b]">
              <div className="flex items-center justify-between text-xs font-mono-hud mb-2">
                <span className="text-slate-300 font-bold">EARTH SIGNAL BARS</span>
                <span className={isLocked ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {signalStrength}% {isLocked ? 'LOCKED ON EARTH!' : 'MOVE SLIDER TO GREEN ZONE'}
                </span>
              </div>

              <div className="grid grid-cols-10 gap-1.5 h-10 p-1.5 bg-[#0a0605] border-2 border-[#49302b]">
                {Array.from({ length: 10 }, (_, i) => {
                  const active = signalStrength >= (i + 1) * 10;
                  return (
                    <div
                      key={i}
                      className={`h-full transition-colors ${
                        active
                          ? isLocked
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                          : 'bg-[#211512]'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="relative h-8 bg-[#0a0605] border-2 border-[#49302b] mb-2 overflow-hidden">
                  <div
                    className="absolute inset-y-0 bg-emerald-500/35 border-x-2 border-emerald-400"
                    style={{
                      left: `${targetMin}%`,
                      width: `${targetMax - targetMin}%`,
                    }}
                  />
                  <div
                    className={`absolute inset-y-0 w-2 -ml-1 ${
                      isLocked ? 'bg-emerald-300' : 'bg-white'
                    }`}
                    style={{ left: `${frequencyMhz}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={frequencyMhz}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    setFrequencyMhz(nextVal);
                    if (nextVal >= targetMin && nextVal <= targetMax) {
                      sounds.playRadioBeep();
                    }
                  }}
                  aria-label="Tune Mars radio frequency"
                  className="w-full accent-amber-400 cursor-pointer h-6"
                />

                <div className="flex justify-between text-[11px] font-mono-hud text-slate-400 mt-1">
                  <span>0 MHz</span>
                  <span className="text-emerald-400 font-bold">
                    EARTH LOCK ZONE ({targetMin}-{targetMax})
                  </span>
                  <span>100 MHz</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono-hud">
              <div className="p-3 bg-[#0d0807] border-2 border-[#49302b]">
                <div className="text-slate-400 text-[10px]">DISTANCE TO EARTH</div>
                <div className="text-sky-300 font-bold text-sm mt-0.5">
                  {solScenario.earthDistanceMillionKm}M km
                </div>
              </div>
              <div className="p-3 bg-[#0d0807] border-2 border-[#49302b]">
                <div className="text-slate-400 text-[10px]">RADIO WAIT TIME</div>
                <div className="text-amber-300 font-bold text-sm mt-0.5">
                  {solScenario.roundTripDelayMin} min round-trip
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t-2 border-[#49302b]">
              <button
                onClick={handleLockSignal}
                disabled={!isLocked}
                className={`pixel-btn w-full sm:w-auto px-7 py-3 font-title text-xs uppercase flex items-center justify-center gap-2 ${
                  isLocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <PixelIcon name="satellite" className="w-4 h-4" />
                <span>Lock Earth Dish!</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full h-56 sm:h-64 bg-black border-3 border-[#49302b] overflow-hidden select-none">
              <img
                src="/assets/nasa/mars_dust_storm.jpg"
                alt="Mars Dust Storm satellite view"
                style={{ imageRendering: 'auto' }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <img
                src="/assets/nasa/jezero_crater.jpg"
                alt="Clear Mars Jezero Crater view"
                style={{
                  imageRendering: 'auto',
                  clipPath: `inset(0 ${100 - comparePercent}% 0 0)`,
                }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />

              <div
                className="absolute inset-y-0 w-1 bg-amber-400 shadow-[0_0_0_2px_#000]"
                style={{ left: `${comparePercent}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-amber-400 border-2 border-black text-black flex items-center justify-center font-bold text-xs">
                  ↔
                </div>
              </div>

              <div className="absolute top-2 left-2 px-2 py-1 bg-black/85 border border-emerald-400 text-[10px] font-mono-hud font-bold text-emerald-300">
                BEFORE: CLEAR SKY
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/85 border border-red-500 text-[10px] font-mono-hud font-bold text-red-300">
                NOW: DUST STORM COMING!
              </div>
            </div>

            <div>
              <input
                type="range"
                min={5}
                max={95}
                value={comparePercent}
                onChange={(e) => setComparePercent(Number(e.target.value))}
                aria-label="Compare before and during Mars dust storm"
                className="w-full accent-amber-400 cursor-pointer h-6"
              />
              <p className="text-xs font-mono-hud text-amber-200 mt-1">
                Earth is {solScenario.roundTripDelayMin} radio-minutes away! Pick how to send your storm signal before racing to base:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t-2 border-[#49302b]">
              <button
                onClick={() => handleFinish('auto')}
                className="pixel-btn p-3 bg-amber-500 hover:bg-amber-400 text-black text-left flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between font-title text-[11px] uppercase">
                  <span>Auto-Send &amp; Race!</span>
                  <span className="font-mono-hud text-[10px] font-bold">-12% Battery</span>
                </div>
                <span className="font-mono-hud text-[11px] text-black/85 leading-snug">
                  No Earth wait! Saves Suit Air for the storm (+20 Science).
                </span>
              </button>

              <button
                onClick={() => handleFinish('wait_earth')}
                disabled={!canWaitForEarth}
                className={`pixel-btn p-3 text-left flex flex-col gap-1 ${
                  canWaitForEarth
                    ? 'bg-sky-400 hover:bg-sky-300 text-black cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between font-title text-[11px] uppercase">
                  <span>Wait Earth ({solScenario.roundTripDelayMin}m)</span>
                  <span className="font-mono-hud text-[10px] font-bold">-14% Suit Air</span>
                </div>
                <span className="font-mono-hud text-[11px] leading-snug">
                  {canWaitForEarth
                    ? 'Keeps Battery full & earns +35 Science from Earth check!'
                    : 'Not enough Suit Air (<23%) to wait safely!'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
