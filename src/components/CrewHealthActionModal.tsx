import React, { useState } from 'react';
import { sounds } from '../audio/SoundManager';
import { PixelIcon } from './PixelIcon';

interface CrewHealthActionModalProps {
  onComplete: () => void;
}

export const CrewHealthActionModal: React.FC<CrewHealthActionModalProps> = ({
  onComplete,
}) => {
  const [workoutOn, setWorkoutOn] = useState(false);
  const [sleepLightOn, setSleepLightOn] = useState(false);
  const [veggiesOn, setVeggiesOn] = useState(false);

  const allReady = workoutOn && sleepLightOn && veggiesOn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto pixel-box-emerald bg-[#081510] p-5 sm:p-6 text-slate-100">
        <div className="pb-3 border-b-2 border-[#14532d]">
          <div className="flex items-center gap-2 text-xs font-mono-hud font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <PixelIcon name="shieldCheck" className="w-4 h-4" />
            <span>DOCKED IN ORBIT // ZERO-GRAVITY CREW CHECK</span>
          </div>
          <h2 className="font-title text-base sm:text-xl font-bold text-white uppercase">
            Keep Crew Healthy for the Trip Home!
          </h2>
          <p className="font-mono-hud text-xs text-emerald-200 mt-1">
            Tap all 3 daily zero-gravity health habits before firing thrusters toward Earth:
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playPickup();
              setWorkoutOn(true);
            }}
            className={`p-3.5 text-left border-2 flex items-center justify-between gap-3 cursor-pointer ${
              workoutOn
                ? 'bg-emerald-950/70 border-emerald-400'
                : 'bg-[#0b1f17] border-[#14532d] hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <PixelIcon name="activity" className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-title text-xs font-bold text-white">
                  1. Daily Zero-G Workout (2 Hours)
                </div>
                <div className="font-mono-hud text-[11px] text-slate-300 mt-0.5">
                  Stops astronauts from losing bone &amp; muscle strength in floating space!
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[11px] font-mono-hud font-bold shrink-0 ${
                workoutOn ? 'bg-emerald-400 text-black' : 'bg-[#07120e] border border-emerald-500 text-emerald-300'
              }`}
            >
              {workoutOn ? 'ACTIVE!' : 'TAP TO START'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPickup();
              setSleepLightOn(true);
            }}
            className={`p-3.5 text-left border-2 flex items-center justify-between gap-3 cursor-pointer ${
              sleepLightOn
                ? 'bg-emerald-950/70 border-emerald-400'
                : 'bg-[#0b1f17] border-[#14532d] hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <PixelIcon name="sun" className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="font-title text-xs font-bold text-white">
                  2. Cabin Sleep Clock Lights
                </div>
                <div className="font-mono-hud text-[11px] text-slate-300 mt-0.5">
                  Helps crew sleep well when 16 sunrises happen every day in orbit!
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[11px] font-mono-hud font-bold shrink-0 ${
                sleepLightOn ? 'bg-emerald-400 text-black' : 'bg-[#07120e] border border-sky-500 text-sky-300'
              }`}
            >
              {sleepLightOn ? 'ACTIVE!' : 'TAP TO SET'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPickup();
              setVeggiesOn(true);
            }}
            className={`p-3.5 text-left border-2 flex items-center justify-between gap-3 cursor-pointer ${
              veggiesOn
                ? 'bg-emerald-950/70 border-emerald-400'
                : 'bg-[#0b1f17] border-[#14532d] hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <PixelIcon name="sprout" className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-title text-xs font-bold text-white">
                  3. Fresh Space Veggies Meal
                </div>
                <div className="font-mono-hud text-[11px] text-slate-300 mt-0.5">
                  Hydroponic greens keep astronaut immune shields strong on the flight home!
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[11px] font-mono-hud font-bold shrink-0 ${
                veggiesOn ? 'bg-emerald-400 text-black' : 'bg-[#07120e] border border-amber-500 text-amber-300'
              }`}
            >
              {veggiesOn ? 'ACTIVE!' : 'TAP TO SERVE'}
            </span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t-2 border-[#14532d] flex justify-end">
          <button
            onClick={() => {
              if (!allReady) return;
              sounds.playMissionSuccess();
              onComplete();
            }}
            disabled={!allReady}
            className={`pixel-btn w-full py-3.5 font-title text-xs uppercase flex items-center justify-center gap-2 ${
              allReady
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <PixelIcon name="rocket" className="w-4 h-4" />
            <span>{allReady ? 'Fire Thrusters & Fly Home!' : 'Activate All 3 Habits Above'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
