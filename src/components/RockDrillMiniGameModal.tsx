import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../audio/SoundManager';
import { PixelIcon } from './PixelIcon';

interface RockDrillMiniGameModalProps {
  onComplete: (batteryUsed: number) => void;
  onClose: () => void;
}

export const RockDrillMiniGameModal: React.FC<RockDrillMiniGameModalProps> = ({
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<'drill' | 'shield_check'>('drill');
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [needlePos, setNeedlePos] = useState(15);
  const [feedback, setFeedback] = useState<string>('Tap DRILL or press [SPACE] inside the green zone! (Uses Power)');
  const dirRef = useRef(1);

  const batteryUsed = Math.min(25, 3 + misses * 4);

  const sweetMin = 36;
  const sweetMax = 64;
  const inSweetSpot = needlePos >= sweetMin && needlePos <= sweetMax;

  useEffect(() => {
    if (step !== 'drill') return;
    const interval = setInterval(() => {
      setNeedlePos((prev) => {
        let next = prev + dirRef.current * 2.5;
        if (next >= 96) {
          next = 96;
          dirRef.current = -1;
        } else if (next <= 4) {
          next = 4;
          dirRef.current = 1;
        }
        return next;
      });
    }, 24);
    return () => clearInterval(interval);
  }, [step]);

  const attemptDrill = () => {
    if (step !== 'drill') return;
    if (inSweetSpot) {
      sounds.playPickup();
      const nextHits = hits + 1;
      setHits(nextHits);
      if (nextHits >= 3) {
        sounds.playObjectiveStinger();
        setFeedback('ROCK TUBE #14 DRILLED!');
        setStep('shield_check');
      } else {
        setFeedback(`NICE HIT! ${nextHits}/3 layers locked!`);
      }
    } else {
      sounds.playCrash();
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setFeedback(`Oops! Wasted drill power (-${Math.min(25, 3 + nextMisses * 4)}% Power total) — aim for green!`);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (step !== 'drill') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        attemptDrill();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto pixel-box-cyan bg-[#0a1318] p-5 sm:p-6 text-slate-100">
        <div className="flex items-start justify-between pb-3 border-b-2 border-[#164e63]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-hud font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <PixelIcon name="sparkles" className="w-4 h-4" />
              <span>
                {step === 'drill'
                  ? 'STEP 1 OF 2 // CORE DRILL ACTION'
                  : 'STEP 2 OF 2 // TUBE #14 SEALED!'}
              </span>
            </div>
            <h2 className="font-title text-base sm:text-xl font-bold text-white uppercase">
              {step === 'drill'
                ? 'Drill Mars Rock Tube #14!'
                : 'Why This Lava Cave Protects Us'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="pixel-btn p-2 bg-[#0f1f26] hover:bg-[#17303b] text-slate-300 hover:text-white cursor-pointer"
          >
            <PixelIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {step === 'drill' ? (
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((stageNum) => {
                const done = hits >= stageNum;
                return (
                  <div
                    key={stageNum}
                    className={`p-3 border-2 text-center font-mono-hud text-xs font-bold ${
                      done
                        ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300'
                        : 'bg-[#071014] border-[#164e63] text-slate-400'
                    }`}
                  >
                    LAYER {stageNum} {done ? 'DONE!' : '...'}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#071014] border-2 border-[#164e63]">
              <div className="relative h-12 bg-[#03090c] border-2 border-[#164e63] overflow-hidden">
                <div
                  className="absolute inset-y-0 bg-emerald-500/40 border-x-2 border-emerald-400"
                  style={{ left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%` }}
                />
                <div
                  className={`absolute inset-y-0 w-3 -ml-1.5 ${
                    inSweetSpot ? 'bg-emerald-300' : 'bg-white'
                  }`}
                  style={{ left: `${needlePos}%` }}
                />
              </div>
              <p className="mt-3 text-center font-mono-hud text-xs text-cyan-200 font-bold">
                {feedback}
              </p>
            </div>

            <button
              onClick={attemptDrill}
              className={`pixel-btn w-full py-4 font-title text-xs sm:text-sm uppercase flex items-center justify-center gap-2 cursor-pointer ${
                inSweetSpot
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
              }`}
            >
              <PixelIcon name="target" className="w-5 h-5" />
              <span>DRILL NOW! ({hits}/3) [SPACE]</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="border-2 border-[#164e63] bg-black overflow-hidden">
              <img
                src="/assets/nasa/sample_core_tube.jpg"
                alt="Real NASA Mars rock sample core tube"
                style={{ imageRendering: 'auto' }}
                className="w-full h-36 object-cover object-center"
              />
            </div>

            <div className="p-3.5 bg-[#071014] border-2 border-[#164e63] flex flex-col gap-2.5 text-xs font-mono-hud">
              <div className="font-bold text-cyan-300 uppercase">
                CAVE RADIATION CHECK: 95% SPACE RAYS BLOCKED!
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-red-300">Outside Mars Surface</span>
                  <span className="text-red-300 font-bold">0.64 mSv/day</span>
                </div>
                <div className="w-full h-2.5 bg-[#03090c] border border-[#164e63]">
                  <div className="h-full bg-red-500 w-[85%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-emerald-300">Inside This Lava Cave</span>
                  <span className="text-emerald-300 font-bold">0.03 mSv/day</span>
                </div>
                <div className="w-full h-2.5 bg-[#03090c] border border-[#164e63]">
                  <div className="h-full bg-emerald-400 w-[6%]" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playPickup();
                onComplete(batteryUsed);
              }}
              className="pixel-btn w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-title text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <PixelIcon name="check" className="w-4 h-4" />
              <span>Pack Rock Tube #14! (-{batteryUsed}% Power)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
