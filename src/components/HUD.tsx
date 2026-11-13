import React, { useEffect, useState } from 'react';
import { GameResources, MissionStage, Waypoint, MissionId } from '../types/game';
import { sounds } from '../audio/SoundManager';
import { PixelIcon } from './PixelIcon';

interface HUDProps {
  resources: GameResources;
  stage: MissionStage;
  activeMission: MissionId;
  waypoint: Waypoint | null;
  interactionPrompt: string | null;
  warningMessage: string | null;
  discoveredFactsCount: number;
  totalFactsCount: number;
  factToastTitle?: string | null;
  onOpenFieldGuide: () => void;
  onOpenPauseMenu: () => void;
}

const PixelMeterBar: React.FC<{ value: number; colorClass: string; segments?: number }> = ({
  value,
  colorClass,
  segments = 10,
}) => {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  return (
    <div className="grid grid-cols-10 gap-[2px] w-full h-2.5 p-[2px] bg-[#0a0605] border border-[#49302b]">
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={i < filled ? colorClass : 'bg-[#211512]'}
        />
      ))}
    </div>
  );
};

export const HUD: React.FC<HUDProps> = ({
  resources,
  stage,
  activeMission,
  waypoint,
  interactionPrompt,
  warningMessage,
  discoveredFactsCount,
  totalFactsCount,
  factToastTitle,
  onOpenFieldGuide,
  onOpenPauseMenu,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [lastObjective, setLastObjective] = useState<string>('');
  const [showObjectiveBanner, setShowObjectiveBanner] = useState(false);

  const getObjectiveText = (): string => {
    switch (stage) {
      case 'stage_0_opening_explore':
        return 'Walk to the blue pad next to the ship and press [E] to check it!';
      case 'stage_1_leave_habitat':
        return 'Walk out of base to grab the power part!';
      case 'stage_2_collect_coupler':
        return 'Go to the orange box and press [E] to get the power part!';
      case 'stage_3_drive_rover':
        return 'Walk to the rover and press [E] to get in!';
      case 'stage_4_repair_relay':
        return resources.hasCoupler
          ? 'Drive past the rocks to the radio tower and press [E] to fix it!'
          : 'Get the power part from the orange box first!';
      case 'stage_5_escape_storm':
        return 'DUST STORM! Hurry back to the safe base!';
      case 'cinematic_ending':
        return 'Mission 1 Done! You are safe at base!';

      case 'm2_stage_1_canyon_transit':
        return 'Drive to the first yellow spot and press [E] to drop Sensor 1!';
      case 'm2_stage_2_deploy_beacons':
        return 'Drive north to drop Sensor 2!';
      case 'm2_stage_3_lava_tube_entry':
        return 'Go to the cave hole and press [E] to go underground!';
      case 'm2_stage_4_sample_extraction':
        return 'Go to the glowing blue rock and press [E] to drill!';
      case 'm2_stage_5_seismic_evacuation':
        return 'GROUND SHAKE! Hurry back to the blue cave exit!';
      case 'm2_cinematic_ending':
        return 'Mission 2 Done! You saved the Mars rock!';

      case 'm3_stage_1_grid_triage':
        return 'Walk to the rover and press [E] to fix the power switches!';
      case 'm3_stage_2_scarp_traverse':
        return 'Drive east to the Mars Rocket! Watch out for dust tornadoes!';
      case 'm3_stage_3_mav_transfer':
        return 'Go to the yellow pad by the rocket and press [E] to get in!';
      case 'm3_stage_4_mav_ascent':
        return 'FLY THE ROCKET! Press [A] or [D] to stay in the green box!';
      case 'm3_stage_5_orbital_dock':
        return 'DOCK IN SPACE! Use [WASD] or Arrows to steer into the spaceship ring!';
      case 'm3_cinematic_ending':
        return 'You did it! Heading back home to Earth!';

      default:
        return 'Explore Mars!';
    }
  };

  const currentObjective = getObjectiveText();

  useEffect(() => {
    if (currentObjective !== lastObjective && currentObjective !== '') {
      setLastObjective(currentObjective);
      setShowObjectiveBanner(true);
      const timer = setTimeout(() => setShowObjectiveBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentObjective, lastObjective]);

  useEffect(() => {
    if (!showObjectiveBanner) return;

    const dismissOnMove = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        setShowObjectiveBanner(false);
      }
    };

    const dismissOnTouchMove = () => setShowObjectiveBanner(false);

    window.addEventListener('keydown', dismissOnMove);
    window.addEventListener('touchmove', dismissOnTouchMove, { passive: true });
    return () => {
      window.removeEventListener('keydown', dismissOnMove);
      window.removeEventListener('touchmove', dismissOnTouchMove);
    };
  }, [showObjectiveBanner]);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const isLowOxygen = resources.oxygen < 25 && !resources.isInsideHabitat;
  const isLowBattery = resources.battery < 20 && resources.isInRover;
  const isDamagedRover = resources.condition < 30;

  const missionTitle =
    activeMission === 'mission_3'
      ? 'Mission 3: Rocket Home'
      : activeMission === 'mission_2'
      ? 'Mission 2: Underground Cave'
      : 'Mission 1: Fix the Radio';

  const sectorBadge =
    activeMission === 'mission_3'
      ? stage === 'm3_stage_4_mav_ascent'
        ? `ROCKET UP // HEIGHT: ${resources.mavAltitudeKm ?? 0} KM // SPEED: ${resources.mavVelocityMs ?? 0}`
        : stage === 'm3_stage_5_orbital_dock'
        ? 'IN SPACE // MEET THE HOME SPACESHIP'
        : 'ROCKY ROAD TO ROCKET PAD'
      : activeMission === 'mission_2'
      ? resources.isInLavaTube
        ? 'UNDERGROUND LAVA CAVE'
        : 'OLD RIVER VALLEY'
      : stage === 'stage_0_opening_explore'
      ? 'LANDING SITE — ALL SYSTEMS CALM'
      : resources.isInsideHabitat
      ? 'SAFE AT DAMAGED SHIP (AIR FILLING)'
      : resources.isDustStormActive
      ? 'DUST STORM OUTSIDE!'
      : 'OUTSIDE ON MARS';

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">

      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 ${
                resources.seismicTremor ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="font-mono-hud text-xs tracking-wider text-red-400 font-bold uppercase">
              MARS ADVENTURE //{' '}
              {activeMission === 'mission_3'
                ? 'ROCKET LAUNCH'
                : activeMission === 'mission_2'
                ? 'CAVE EXPLORER'
                : 'RADIO RESCUE'}
            </span>
          </div>
          <h1 className="font-title text-base sm:text-xl font-bold tracking-wider text-slate-100 uppercase drop-shadow-[3px_3px_0_#020302]">
            {missionTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-hud text-slate-300">
            <span className={resources.seismicTremor ? 'text-amber-400 font-bold animate-pulse' : 'text-amber-300'}>
              {resources.seismicTremor ? 'CAVE IS SHAKING! HURRY OUT!' : sectorBadge}
            </span>
            {resources.solLabel && stage !== 'stage_0_opening_explore' && (
              <span className="px-2 py-0.5 bg-[#120b09] border-2 border-[#49302b] text-[10px] text-sky-300">
                {resources.solLabel} · {resources.radiationMsvPerDay ?? 0.64} mSv/day
              </span>
            )}
            {resources.caveRadiationBlocked && (
              <span className="px-2 py-0.5 bg-emerald-950 border-2 border-emerald-500 text-[10px] font-bold text-emerald-300 animate-pulse">
                CAVE SHIELD: 95% RAYS BLOCKED!
              </span>
            )}
          </div>

          <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 pixel-box-amber bg-[#0d0807] text-xs font-mono-hud text-amber-200 max-w-lg">
            <span className="font-bold text-amber-400 shrink-0">GOAL:</span>
            <span className="truncate">{currentObjective}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onOpenFieldGuide}
            className="pixel-btn flex items-center gap-2 px-3 py-2 bg-[#160f0d] hover:bg-[#241613] text-xs font-mono-hud text-slate-200 cursor-pointer"
            title="Open NASA Space Facts Book"
          >
            <PixelIcon name="book" className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Space Facts</span>
            <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500 text-amber-300 text-[10px] font-bold">
              {discoveredFactsCount}/{totalFactsCount}
            </span>
          </button>

          <button
            onClick={handleToggleSound}
            className="pixel-btn p-2 bg-[#160f0d] hover:bg-[#241613] text-slate-300 cursor-pointer"
            title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
          >
            {isMuted ? (
              <PixelIcon name="volumeOff" className="w-4 h-4 text-red-400" />
            ) : (
              <PixelIcon name="volumeOn" className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={onOpenPauseMenu}
            className="pixel-btn p-2 bg-[#160f0d] hover:bg-[#241613] text-slate-300 cursor-pointer"
            title="Pause Game"
          >
            <PixelIcon name="menu" className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {factToastTitle && (
        <div className="pointer-events-auto self-end mt-1 px-3 py-1.5 pixel-box-cyan bg-[#0a1419]/95 text-cyan-200 font-mono-hud text-[11px] flex items-center gap-2">
          <PixelIcon name="book" className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>FACT ADDED: <b className="text-white">{factToastTitle}</b> [M]</span>
        </div>
      )}

      <div className="w-full flex flex-col items-center justify-center my-auto">
        {showObjectiveBanner && (
          <div className="flex flex-col items-center bg-[#0d0807]/95 border-y-4 border-amber-500 px-6 sm:px-10 py-3 shadow-[4px_4px_0_#020302] max-w-2xl text-center">
            <span className="font-mono-hud text-xs tracking-widest text-amber-400 font-bold uppercase mb-1">
              NEW GOAL!
            </span>
            <span className="font-title text-sm sm:text-base font-bold tracking-wide text-white uppercase">
              {currentObjective}
            </span>
          </div>
        )}

        {warningMessage && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2 pixel-box-red bg-red-950 text-red-200 font-mono-hud text-xs animate-bounce">
            <PixelIcon name="alert" className="w-4 h-4 text-red-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center mb-2">
        {interactionPrompt && (
          <div className="pointer-events-auto px-5 py-2.5 pixel-box-amber bg-[#120b09] text-white font-mono-hud text-xs sm:text-sm font-bold tracking-wider flex items-center gap-2.5 animate-pulse">
            <span className="inline-block w-2.5 h-2.5 bg-amber-400" />
            <span>{interactionPrompt}</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between w-full">

        {/* Pixel Radar Minimap */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 pixel-box bg-[#0b0706] overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(220,101,71,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(220,101,71,0.35) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="absolute inset-3 border border-[#49302b] pointer-events-none" />
          <div className="absolute inset-8 border border-[#3a221c] pointer-events-none" />
          <div className="absolute w-full h-[2px] bg-[#49302b]" />
          <div className="absolute h-full w-[2px] bg-[#49302b]" />

          <span className="absolute top-1 text-[9px] font-mono-hud font-bold text-slate-300">N</span>
          <span className="absolute bottom-1 text-[9px] font-mono-hud font-bold text-slate-500">S</span>
          <span className="absolute left-1.5 text-[9px] font-mono-hud font-bold text-slate-500">W</span>
          <span className="absolute right-1.5 text-[9px] font-mono-hud font-bold text-slate-500">E</span>

          <div className="w-3 h-3 bg-white border-2 border-black z-10 flex items-center justify-center">
            <div className="w-1 h-1 bg-sky-400" />
          </div>

          {waypoint && (
            <div
              className="absolute z-20 flex flex-col items-center justify-center animate-pulse"
              style={{
                transform: `translate(${Math.min(52, Math.max(-52, Math.round((waypoint.x - 1000) / 30)))}px, ${Math.min(
                  52,
                  Math.max(-52, Math.round((waypoint.y - 1000) / 30))
                )}px)`,
              }}
            >
              <div className="w-3 h-3 bg-amber-400 border-2 border-black" />
            </div>
          )}

          {waypoint && (
            <div className="absolute bottom-1.5 px-2 py-0.5 bg-black border-2 border-amber-500 text-[10px] font-mono-hud font-bold text-amber-300">
              {waypoint.distanceMeters}m
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end">

          {activeMission === 'mission_2' && (
            <div className="flex items-center gap-3 px-3 py-2 pixel-box-cyan bg-[#0a1419]">
              <div className="flex items-center justify-center w-8 h-8 bg-cyan-950 border-2 border-cyan-500 text-cyan-400">
                <PixelIcon name="activity" className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col w-28 sm:w-36">
                <div className="flex justify-between items-center text-[10px] font-mono-hud mb-1">
                  <span className="text-cyan-300 font-bold uppercase">Cave Signal</span>
                  <span className="text-cyan-400 font-bold">{resources.signalStrength ?? 20}%</span>
                </div>
                <PixelMeterBar value={resources.signalStrength ?? 20} colorClass="bg-cyan-400" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 p-2.5 pixel-box bg-[#0d0807]">

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-7 h-7 bg-sky-950 border-2 text-sky-400 ${
                  isLowOxygen ? 'border-red-500 animate-pulse' : 'border-sky-500'
                }`}
              >
                <PixelIcon name="wind" className="w-4 h-4" />
              </div>
              <div className="flex flex-col w-28 sm:w-36">
                <div className="flex justify-between items-center text-[10px] font-mono-hud mb-0.5">
                  <span className="text-slate-300 font-bold uppercase">Life Support</span>
                  <span className={isLowOxygen ? 'text-red-400 font-bold' : 'text-sky-300 font-bold'}>
                    {Math.round(resources.oxygen)}%
                  </span>
                </div>
                <PixelMeterBar
                  value={resources.oxygen}
                  colorClass={
                    resources.oxygen > 50
                      ? 'bg-sky-400'
                      : resources.oxygen > 25
                      ? 'bg-amber-400'
                      : 'bg-red-500'
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 bg-amber-950 border-2 border-amber-500 text-amber-400">
                <PixelIcon name="battery" className="w-4 h-4" />
              </div>
              <div className="flex flex-col w-28 sm:w-36">
                <div className="flex justify-between items-center text-[10px] font-mono-hud mb-0.5">
                  <span className="text-slate-300 font-bold uppercase">Power</span>
                  <span className={isLowBattery ? 'text-red-400 font-bold' : 'text-amber-300 font-bold'}>
                    {Math.round(resources.battery)}%
                  </span>
                </div>
                <PixelMeterBar
                  value={resources.battery}
                  colorClass={resources.battery > 40 ? 'bg-amber-400' : 'bg-red-500'}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 bg-emerald-950 border-2 border-emerald-500 text-emerald-400">
                <PixelIcon name="shieldAlert" className="w-4 h-4" />
              </div>
              <div className="flex flex-col w-28 sm:w-36">
                <div className="flex justify-between items-center text-[10px] font-mono-hud mb-0.5">
                  <span className="text-slate-300 font-bold uppercase">Shielding</span>
                  <span className={isDamagedRover ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>
                    {Math.round(resources.condition)}%
                  </span>
                </div>
                <PixelMeterBar
                  value={resources.condition}
                  colorClass={
                    resources.condition > 50
                      ? 'bg-emerald-400'
                      : resources.condition > 25
                      ? 'bg-amber-400'
                      : 'bg-red-500'
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            {activeMission === 'mission_1' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 pixel-box bg-[#0d0807]">
                <PixelIcon name="zap" className={`w-3.5 h-3.5 ${resources.hasCoupler ? 'text-cyan-400' : 'text-slate-600'}`} />
                <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-300">
                  Power Part:
                </span>
                <span
                  className={`text-[10px] font-mono-hud font-bold px-1.5 py-0.5 ${
                    resources.hasCoupler ? 'bg-cyan-950 border border-cyan-400 text-cyan-300' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {resources.hasCoupler ? 'GOT IT!' : 'NOT YET'}
                </span>
              </div>
            ) : activeMission === 'mission_2' ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 pixel-box bg-[#0d0807]">
                  <PixelIcon name="layers" className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-300">
                    Sensors:
                  </span>
                  <span className="text-[10px] font-mono-hud font-bold px-1.5 py-0.5 bg-amber-950 border border-amber-500 text-amber-300">
                    {resources.beaconsPlaced ?? 0}/{resources.totalBeacons ?? 2} Dropped
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 pixel-box bg-[#0d0807]">
                  <PixelIcon name="sparkles" className={`w-3.5 h-3.5 ${resources.hasCoreSample ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-300">
                    Mars Rock:
                  </span>
                  <span
                    className={`text-[10px] font-mono-hud font-bold px-1.5 py-0.5 ${
                      resources.hasCoreSample ? 'bg-cyan-950 border border-cyan-400 text-cyan-300' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {resources.hasCoreSample ? 'TUBE #14 SAVED' : 'NOT YET'}
                  </span>
                </div>
              </>
            ) : (
              <>
                {stage === 'm3_stage_4_mav_ascent' ? (
                  <div className="flex flex-col gap-1 p-2.5 pixel-box-amber bg-[#0d0807]">
                    <div className="flex justify-between items-center text-[10px] font-mono-hud text-amber-400 font-bold">
                      <span>MARS ROCKET</span>
                      <span>PART {resources.mavStage ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono-hud">
                      <span className="text-slate-300">HEIGHT: <b className="text-white">{resources.mavAltitudeKm ?? 0} km</b></span>
                      <span className="text-slate-300">SPEED: <b className="text-sky-400">{resources.mavVelocityMs ?? 0}</b></span>
                    </div>
                    <PixelMeterBar value={((resources.mavAltitudeKm ?? 0) / 120) * 100} colorClass="bg-amber-400" />
                  </div>
                ) : stage === 'm3_stage_5_orbital_dock' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 pixel-box-cyan bg-[#0a1419]">
                    <PixelIcon name="sparkles" className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-mono-hud uppercase tracking-wider text-cyan-300 font-bold">
                      {resources.mavDocked ? 'DOCKED SAFE!' : 'STEER TO SPACESHIP!'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 pixel-box bg-[#0d0807]">
                      <PixelIcon name="zap" className={`w-3.5 h-3.5 ${resources.breakersConfigured ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`} />
                      <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-300">
                        Heater #2:
                      </span>
                      <span
                        className={`text-[10px] font-mono-hud font-bold px-1.5 py-0.5 ${
                          resources.breakersConfigured ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-red-950 border border-red-500 text-red-300'
                        }`}
                      >
                        {resources.breakersConfigured ? 'FIXED!' : 'BROKEN!'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 pixel-box bg-[#0d0807]">
                      <PixelIcon name="sparkles" className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-300">
                        Bag:
                      </span>
                      <span className="text-[10px] font-mono-hud font-bold px-1.5 py-0.5 bg-cyan-950 border border-cyan-500 text-cyan-300">
                        MARS ROCK #14
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
