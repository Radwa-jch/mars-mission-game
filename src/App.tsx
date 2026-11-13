import React, { useState, useRef, useCallback } from 'react';
import { MarsGameCanvas } from './game/MarsGameCanvas';
import { SceneCallbacks } from './game/scenes/Mission1Scene';
import { HUD } from './components/HUD';
import { DialogueOverlay } from './components/DialogueOverlay';
import { EducationalModal } from './components/EducationalModal';
import { MissionCompleteModal } from './components/MissionCompleteModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseMenu } from './components/PauseMenu';
import { NasaFieldGuide } from './components/NasaFieldGuide';
import { MainMenu } from './components/MainMenu';
import { PowerBusConsoleModal } from './components/PowerBusConsoleModal';
import { DisasterCinematicModal } from './components/DisasterCinematicModal';
import { DamagedShipStatusModal } from './components/DamagedShipStatusModal';
import { RadioRepairMiniGameModal } from './components/RadioRepairMiniGameModal';
import { RockDrillMiniGameModal } from './components/RockDrillMiniGameModal';
import { CrewHealthActionModal } from './components/CrewHealthActionModal';
import HomePage from './components/HomePage';
import LoadingScreen from './components/LoadingScreen';
import CrewSelectionPage from './components/CrewSelectionPage';
import CrewDetailsPage from './components/CrewDetailsPage';
import RotateDevice from './components/RotateDevice';
import { CrewMember } from './data/CrewData';
import { DIALOGUE_SCRIPTS, NASA_FACTS } from './data/nasaContent';
import { getSolScenarioById, pickRandomSolScenario } from './data/nasaDatasets';
import { fetchSpaceWeather, SpaceWeatherData } from './services/nasaApi';
import {
  BreakerAllocationChoice,
  CinematicEventType,
  GameResources,
  MarsSolScenario,
  MissionStage,
  Waypoint,
  DialogueLine,
  EducationalFact,
  MissionStats,
  MissionId,
} from './types/game';
import { sounds } from './audio/SoundManager';

type GameScreenState =
  | 'home'
  | 'loading'
  | 'crew_selection'
  | 'crew_details'
  | 'menu'
  | 'playing'
  | 'mission_complete'
  | 'mission_failed';

const COMPLETED_STORAGE_KEY = 'mars_mission_completed_v1';

function loadCompletedMissions(): MissionId[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is MissionId => id === 'mission_1' || id === 'mission_2' || id === 'mission_3'
    );
  } catch {
    return [];
  }
}

function isMissionUnlocked(missionId: MissionId, completed: MissionId[]): boolean {
  if (missionId === 'mission_1') return true;
  if (missionId === 'mission_2') return completed.includes('mission_1');
  if (missionId === 'mission_3') return completed.includes('mission_2');
  return false;
}

export default function App() {
  const [activeMission, setActiveMission] = useState<MissionId>('mission_1');
  const [completedMissions, setCompletedMissions] = useState<MissionId[]>(loadCompletedMissions);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [screenState, setScreenState] = useState<GameScreenState>('home');
  const [stage, setStage] = useState<MissionStage>('stage_0_opening_explore');

  const [resources, setResources] = useState<GameResources>({
    oxygen: 100,
    battery: 100,
    condition: 100,
    hasCoupler: false,
    isInRover: false,
    isInsideHabitat: true,
    isDustStormActive: false,
    elapsedSeconds: 0,
    rockCollisions: 0,
    signalStrength: 20,
    beaconsPlaced: 0,
    totalBeacons: 2,
    hasCoreSample: false,
    isInLavaTube: false,
    seismicTremor: false,
  });

  const [activeDialogue, setActiveDialogue] = useState<DialogueLine[] | null>(null);
  const [factQueue, setFactQueue] = useState<EducationalFact[]>([]);
  const activeEducationalFact = factQueue[0] ?? null;
  const [unlockedFactIds, setUnlockedFactIds] = useState<string[]>([]);
  const [waypoint, setWaypoint] = useState<Waypoint | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isFieldGuideOpen, setIsFieldGuideOpen] = useState(false);
  const [isBreakerConsoleOpen, setIsBreakerConsoleOpen] = useState(false);
  const [isRadioMiniGameOpen, setIsRadioMiniGameOpen] = useState(false);
  const [isDrillMiniGameOpen, setIsDrillMiniGameOpen] = useState(false);
  const [isCrewHealthModalOpen, setIsCrewHealthModalOpen] = useState(false);
  const [factToastTitle, setFactToastTitle] = useState<string | null>(null);
  const [activeEventCinematic, setActiveEventCinematic] = useState<CinematicEventType | null>(null);
  const [isDamagedStatusOpen, setIsDamagedStatusOpen] = useState(false);

  const [spaceWeather, setSpaceWeather] = useState<SpaceWeatherData | null>(null);
  const [replaySolOverride, setReplaySolOverride] = useState<MarsSolScenario | null>(null);
  const [healthScienceBonus, setHealthScienceBonus] = useState(0);

  React.useEffect(() => {
    fetchSpaceWeather().then((data) => {
      if (data) setSpaceWeather(data);
    });
  }, []);

  const activeSolScenario: MarsSolScenario = React.useMemo(() => {
    if (replaySolOverride) return replaySolOverride;

    const base =
      spaceWeather?.severity === 'HIGH'
        ? getSolScenarioById('sol_419_solar_storm')
        : spaceWeather?.severity === 'MODERATE'
        ? getSolScenarioById('sol_288_dusty')
        : getSolScenarioById('sol_142_clear');

    if (!spaceWeather) return base;
    const radMsv = spaceWeather.solarRadiationMsvDay ?? base.radiationMsvPerDay;
    const scaledShieldDrain = Number(
      (0.08 * Math.max(0.8, Math.min(4.5, radMsv / 0.64))).toFixed(3)
    );
    return {
      ...base,
      radiationMsvPerDay: radMsv,
      shieldingDrainPerSec: scaledShieldDrain,
      solLabel: `${base.solLabel.split(' · ')[0]} · ${spaceWeather.stormTitle}`,
    };
  }, [spaceWeather, replaySolOverride]);

  const gameRef = useRef<{
    resetMission: (waitForPlan?: boolean) => void;
    solveBreakerTriage?: (choice?: BreakerAllocationChoice) => void;
    startPostDisasterMission?: () => void;
    startPostQuakeEvacuation?: () => void;
    startMavAscentAfterEvent?: () => void;
    completeRadioRepairMiniGame?: (choice?: 'auto' | 'wait_earth') => void;
    completeDrillMiniGame?: (batteryUsed?: number) => void;
    setReadingPaused?: (paused: boolean) => void;
    setSolScenario?: (sol: MarsSolScenario) => void;
    setCrewSpecialty?: (crewId?: string) => void;
  } | null>(null);

  const isReplayingCutsceneRef = useRef(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const factToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markMissionComplete = useCallback((missionId: MissionId) => {
    setCompletedMissions((prev) => {
      if (prev.includes(missionId)) return prev;
      const next = [...prev, missionId];
      try {
        window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  }, []);

  const handleWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
  }, []);

  const handleDialogueTrigger = useCallback((dialogueKey: string) => {
    const lines = DIALOGUE_SCRIPTS[dialogueKey];
    if (lines && lines.length > 0) {
      setActiveDialogue(lines);
    }
  }, []);

  const handleFactUnlock = useCallback((factId: string) => {
    setUnlockedFactIds((prev) => {
      if (prev.includes(factId)) return prev;
      const fact = NASA_FACTS.find((f) => f.id === factId);
      if (fact) {
        const isStickyHazardFact =
          factId === 'space_communications' || factId === 'martian_lava_tubes';
        if (isStickyHazardFact) {
          setFactQueue((queue) =>
            queue.some((item) => item.id === fact.id) ? queue : [...queue, fact]
          );
        } else {
          setFactToastTitle(fact.title);
          if (factToastTimeoutRef.current) clearTimeout(factToastTimeoutRef.current);
          factToastTimeoutRef.current = setTimeout(() => {
            setFactToastTitle(null);
          }, 3600);
        }
      }
      return [...prev, factId];
    });
  }, []);

  const handleStageChange = useCallback((newStage: MissionStage) => {
    setStage(newStage);
  }, []);

  const handleMissionEnd = useCallback(
    (success: boolean) => {
      if (success) {
        markMissionComplete(activeMission);
        if (activeMission === 'mission_3') {
          setActiveEventCinematic('mission_3_final_home');
        } else {
          setScreenState('mission_complete');
        }
      } else {
        setScreenState('mission_failed');
      }
    },
    [activeMission, markMissionComplete]
  );

  const callbacks: SceneCallbacks = {
    onResourceUpdate: (res) => {
      setResources(res);
      if (res.oxygen <= 0 && screenState === 'playing') {
        setScreenState('mission_failed');
      }
    },
    onStageChange: handleStageChange,
    onPromptChange: (prompt) => setInteractionPrompt(prompt),
    onDialogueTrigger: handleDialogueTrigger,
    onFactUnlock: handleFactUnlock,
    onWarning: handleWarning,
    onWaypointUpdate: (wp) => setWaypoint(wp),
    onMissionEnd: handleMissionEnd,
    onOpenBreakerConsole: () => setIsBreakerConsoleOpen(true),
    onOpenRadioMiniGame: () => setIsRadioMiniGameOpen(true),
    onOpenDrillMiniGame: () => setIsDrillMiniGameOpen(true),
    onOpenCrewHealthModal: () => {
      setActiveDialogue(null);
      setIsCrewHealthModalOpen(true);
    },
    onTriggerDisasterCinematic: (eventType: CinematicEventType = 'mission_1_explosion') => {
      isReplayingCutsceneRef.current = false;
      setActiveDialogue(null);
      setIsPaused(false);
      setIsDamagedStatusOpen(false);
      setActiveEventCinematic(eventType);
    },
  };

  const resetUiForMissionStart = (
    missionId: MissionId,
    solOverride: MarsSolScenario = activeSolScenario
  ) => {
    setIsPaused(false);
    setHealthScienceBonus(0);
    setIsBreakerConsoleOpen(false);
    setIsRadioMiniGameOpen(false);
    setIsDrillMiniGameOpen(false);
    setIsCrewHealthModalOpen(false);
    setFactToastTitle(null);
    setActiveEventCinematic(null);
    setIsDamagedStatusOpen(false);
    setActiveDialogue(null);
    setFactQueue([]);
    setInteractionPrompt(null);
    setWarningMessage(null);
    setStage(
      missionId === 'mission_3'
        ? 'm3_stage_1_grid_triage'
        : missionId === 'mission_2'
        ? 'm2_stage_1_canyon_transit'
        : 'stage_0_opening_explore'
    );
    setResources({
      oxygen: 100,
      battery: 100,
      condition: 100,
      hasCoupler: false,
      isInRover: false,
      isInsideHabitat: true,
      isDustStormActive: false,
      elapsedSeconds: 0,
      rockCollisions: 0,
      signalStrength: 20,
      beaconsPlaced: 0,
      totalBeacons: 2,
      hasCoreSample: missionId === 'mission_3',
      isInLavaTube: false,
      seismicTremor: false,
      breakersConfigured: false,
      solId: solOverride.id,
      solLabel: solOverride.solLabel,
      radiationMsvPerDay: solOverride.radiationMsvPerDay,
    });
  };

  const handleSelectMission = (missionId: MissionId) => {
    if (!isMissionUnlocked(missionId, completedMissions)) return;
    setActiveMission(missionId);
    setStage(
      missionId === 'mission_3'
        ? 'm3_stage_1_grid_triage'
        : missionId === 'mission_2'
        ? 'm2_stage_1_canyon_transit'
        : 'stage_0_opening_explore'
    );
  };

  const handleStartGame = () => {
    if (!isMissionUnlocked(activeMission, completedMissions)) return;
    setReplaySolOverride(null);
    resetUiForMissionStart(activeMission);
    setScreenState('playing');
    sounds.playObjectiveStinger();
  };

  const handleRestartMission = () => {
    const nextSol = pickRandomSolScenario(activeSolScenario.id);
    setReplaySolOverride(nextSol);
    resetUiForMissionStart(activeMission, nextSol);
    setScreenState('playing');
    gameRef.current?.setSolScenario?.(nextSol);
    gameRef.current?.resetMission(false);
  };

  const handleContinueToMission2 = () => {
    if (!completedMissions.includes('mission_1')) return;
    setReplaySolOverride(null);
    setActiveMission('mission_2');
    resetUiForMissionStart('mission_2');
    setScreenState('playing');
  };

  const handleContinueToMission3 = () => {
    if (!completedMissions.includes('mission_2')) return;
    setReplaySolOverride(null);
    setActiveMission('mission_3');
    resetUiForMissionStart('mission_3');
    setScreenState('playing');
  };

  const handleReturnToMenu = () => {
    sounds.stopCinematicAudio();
    setReplaySolOverride(null);
    setIsPaused(false);
    setIsBreakerConsoleOpen(false);
    setIsRadioMiniGameOpen(false);
    setIsDrillMiniGameOpen(false);
    setIsCrewHealthModalOpen(false);
    setFactToastTitle(null);
    setActiveEventCinematic(null);
    setIsDamagedStatusOpen(false);
    setActiveDialogue(null);
    setFactQueue([]);
    setScreenState('menu');
  };

  React.useEffect(() => {
    if (screenState !== 'playing') {
      gameRef.current?.setReadingPaused?.(false);
      return;
    }
    const shouldPauseScene = Boolean(
      activeEducationalFact ||
        isPaused ||
        isBreakerConsoleOpen ||
        isRadioMiniGameOpen ||
        isDrillMiniGameOpen ||
        isCrewHealthModalOpen ||
        isDamagedStatusOpen ||
        activeEventCinematic ||
        isFieldGuideOpen
    );
    gameRef.current?.setReadingPaused?.(shouldPauseScene);
  }, [
    screenState,
    activeEducationalFact,
    isPaused,
    isBreakerConsoleOpen,
    isRadioMiniGameOpen,
    isDrillMiniGameOpen,
    isCrewHealthModalOpen,
    isDamagedStatusOpen,
    activeEventCinematic,
    isFieldGuideOpen,
  ]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        screenState !== 'playing' ||
        activeEventCinematic !== null ||
        isDamagedStatusOpen ||
        isCrewHealthModalOpen
      ) {
        return;
      }
      if (e.code === 'Escape') {
        if (isBreakerConsoleOpen) {
          setIsBreakerConsoleOpen(false);
        } else if (isRadioMiniGameOpen) {
          setIsRadioMiniGameOpen(false);
        } else if (isDrillMiniGameOpen) {
          setIsDrillMiniGameOpen(false);
        } else {
          setIsPaused((prev) => !prev);
        }
      } else if (e.code === 'KeyM') {
        setIsFieldGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screenState,
    isBreakerConsoleOpen,
    isRadioMiniGameOpen,
    isDrillMiniGameOpen,
    isCrewHealthModalOpen,
    activeEventCinematic,
    isDamagedStatusOpen,
  ]);

  const missionStats: MissionStats = {
    missionId: activeMission,
    elapsedSeconds: resources.elapsedSeconds,
    finalOxygen: resources.oxygen,
    finalBattery: resources.battery,
    finalCondition: resources.condition,
    factsDiscovered: unlockedFactIds.length,
    totalFacts: NASA_FACTS.length,
    rockCollisions: resources.rockCollisions,
    beaconsPlaced: resources.beaconsPlaced,
    hasCoreSample: resources.hasCoreSample,
    solScenario: activeSolScenario,
    breakerChoice: resources.breakerChoice,
    scienceScore: (resources.scienceScore ?? 10) + healthScienceBonus,
  };

  const isOverlayBlockingHud = activeEventCinematic !== null || isDamagedStatusOpen;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0706] font-display crt-overlay">
      <RotateDevice />

      {screenState === 'home' && (
        <HomePage onStart={() => setScreenState('loading')} />
      )}

      {screenState === 'loading' && (
        <LoadingScreen onComplete={() => setScreenState('crew_selection')} />
      )}

      {screenState === 'crew_selection' && (
        <CrewSelectionPage
          onContinue={(crew) => {
            setSelectedCrew(crew);
            setScreenState('crew_details');
          }}
          onBack={() => setScreenState('home')}
        />
      )}

      {screenState === 'crew_details' && selectedCrew && (
        <CrewDetailsPage
          crew={selectedCrew}
          onBack={() => setScreenState('crew_selection')}
          onContinue={() => setScreenState('menu')}
        />
      )}

      {screenState === 'menu' && (
        <MainMenu
          selectedMission={activeMission}
          completedMissions={completedMissions}
          selectedCrew={selectedCrew}
          onSelectMission={handleSelectMission}
          onStartGame={handleStartGame}
          onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
          onChangeCrew={() => setScreenState('crew_selection')}
          onBackToHome={() => setScreenState('home')}
        />
      )}

      {(screenState === 'playing' || screenState === 'mission_complete' || screenState === 'mission_failed') && (
        <div className="relative w-full h-full">
          <MarsGameCanvas
            callbacks={callbacks}
            activeMission={activeMission}
            solScenario={activeSolScenario}
            crewId={selectedCrew?.id}
            gameRef={gameRef}
          />

          {resources.isDustStormActive && (
            <div
              className="pointer-events-none absolute inset-0 z-25 border-[12px] border-red-600/60 storm-vignette"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.16) 0 4px, transparent 4px 12px)',
              }}
            />
          )}

          {resources.seismicTremor && (
            <div
              className="pointer-events-none absolute inset-0 z-25 border-[12px] border-amber-500/60 storm-vignette"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, rgba(245, 158, 11, 0.14) 0 4px, transparent 4px 12px)',
              }}
            />
          )}

          {screenState === 'playing' && !isOverlayBlockingHud && (
            <HUD
              resources={resources}
              stage={stage}
              activeMission={activeMission}
              waypoint={waypoint}
              interactionPrompt={interactionPrompt}
              warningMessage={warningMessage}
              discoveredFactsCount={unlockedFactIds.length}
              totalFactsCount={NASA_FACTS.length}
              factToastTitle={factToastTitle}
              onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
              onOpenPauseMenu={() => setIsPaused(true)}
            />
          )}

          {activeDialogue && screenState === 'playing' && !isOverlayBlockingHud && (
            <DialogueOverlay
              dialogues={activeDialogue}
              blockSpaceKey={stage === 'm3_stage_4_mav_ascent'}
              paused={Boolean(
                activeEducationalFact ||
                  isBreakerConsoleOpen ||
                  isRadioMiniGameOpen ||
                  isDrillMiniGameOpen ||
                  isCrewHealthModalOpen ||
                  isFieldGuideOpen
              )}
              onComplete={() => {
                setActiveDialogue(null);
                if (stage === 'm3_cinematic_ending') {
                  markMissionComplete('mission_3');
                  setActiveEventCinematic('mission_3_final_home');
                } else if (stage === 'cinematic_ending' || stage === 'm2_cinematic_ending') {
                  markMissionComplete(activeMission);
                  setScreenState('mission_complete');
                }
              }}
            />
          )}

          {activeEducationalFact && !isOverlayBlockingHud && (
            <EducationalModal
              fact={activeEducationalFact}
              onClose={() => setFactQueue((prev) => prev.slice(1))}
            />
          )}

          {activeEventCinematic && (screenState === 'playing' || activeEventCinematic === 'mission_3_final_home') && (
            <DisasterCinematicModal
              eventType={activeEventCinematic}
              onComplete={() => {
                const finishedEvent = activeEventCinematic;
                const wasPauseReplay = isReplayingCutsceneRef.current;
                isReplayingCutsceneRef.current = false;
                setActiveEventCinematic(null);
                if (wasPauseReplay) {
                  return;
                }
                if (finishedEvent === 'mission_1_explosion') {
                  if (stage === 'stage_0_opening_explore') {
                    setIsDamagedStatusOpen(true);
                  }
                } else if (finishedEvent === 'mission_2_marsquake') {
                  gameRef.current?.startPostQuakeEvacuation?.();
                } else if (finishedEvent === 'mission_3_launch_crisis') {
                  gameRef.current?.startMavAscentAfterEvent?.();
                } else if (finishedEvent === 'mission_3_final_home') {
                  setScreenState('mission_complete');
                }
              }}
            />
          )}

          {isDamagedStatusOpen && screenState === 'playing' && (
            <DamagedShipStatusModal
              onReplayCutscene={() => {
                isReplayingCutsceneRef.current = false;
                setIsDamagedStatusOpen(false);
                setActiveEventCinematic('mission_1_explosion');
              }}
              onStartMission={() => {
                setIsDamagedStatusOpen(false);
                gameRef.current?.startPostDisasterMission?.();
              }}
            />
          )}

          {isBreakerConsoleOpen && screenState === 'playing' && (
            <PowerBusConsoleModal
              onSolved={(choice) => {
                gameRef.current?.solveBreakerTriage?.(choice);
                setIsBreakerConsoleOpen(false);
              }}
              onClose={() => setIsBreakerConsoleOpen(false)}
            />
          )}

          {isRadioMiniGameOpen && screenState === 'playing' && (
            <RadioRepairMiniGameModal
              solScenario={activeSolScenario}
              currentOxygen={resources.oxygen}
              onComplete={(choice) => {
                setIsRadioMiniGameOpen(false);
                setUnlockedFactIds((prev) =>
                  prev.includes('martian_dust_storms') ? prev : [...prev, 'martian_dust_storms']
                );
                gameRef.current?.completeRadioRepairMiniGame?.(choice);
              }}
              onClose={() => setIsRadioMiniGameOpen(false)}
            />
          )}

          {isDrillMiniGameOpen && screenState === 'playing' && (
            <RockDrillMiniGameModal
              onComplete={(batteryUsed) => {
                setIsDrillMiniGameOpen(false);
                gameRef.current?.completeDrillMiniGame?.(batteryUsed);
              }}
              onClose={() => setIsDrillMiniGameOpen(false)}
            />
          )}

          {isCrewHealthModalOpen && screenState === 'playing' && (
            <CrewHealthActionModal
              onComplete={() => {
                setIsCrewHealthModalOpen(false);
                setHealthScienceBonus(15);
                setUnlockedFactIds((prev) =>
                  prev.includes('astronaut_health_microgravity')
                    ? prev
                    : [...prev, 'astronaut_health_microgravity']
                );
                markMissionComplete('mission_3');
                setActiveEventCinematic('mission_3_final_home');
              }}
            />
          )}

          {isPaused && !isOverlayBlockingHud && (
            <PauseMenu
              onResume={() => setIsPaused(false)}
              onRestart={handleRestartMission}
              onReturnToMenu={handleReturnToMenu}
              onOpenFieldGuide={() => {
                setIsPaused(false);
                setIsFieldGuideOpen(true);
              }}
              onReplayCutscene={
                (activeMission === 'mission_1' && stage !== 'stage_0_opening_explore') ||
                (activeMission === 'mission_2' &&
                  (stage === 'm2_stage_5_seismic_evacuation' || stage === 'm2_cinematic_ending')) ||
                (activeMission === 'mission_3' &&
                  (stage === 'm3_stage_4_mav_ascent' ||
                    stage === 'm3_stage_5_orbital_dock' ||
                    stage === 'm3_cinematic_ending'))
                  ? () => {
                      setIsPaused(false);
                      isReplayingCutsceneRef.current = true;
                      const eventForMission: CinematicEventType =
                        activeMission === 'mission_3'
                          ? 'mission_3_launch_crisis'
                          : activeMission === 'mission_2'
                          ? 'mission_2_marsquake'
                          : 'mission_1_explosion';
                      setActiveEventCinematic(eventForMission);
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {screenState === 'mission_complete' && activeEventCinematic === null && (
        <MissionCompleteModal
          stats={missionStats}
          onReplay={handleRestartMission}
          onContinueToMission2={
            completedMissions.includes('mission_1') ? handleContinueToMission2 : undefined
          }
          onContinueToMission3={
            completedMissions.includes('mission_2') ? handleContinueToMission3 : undefined
          }
          onWatchFinalHomeVideo={
            activeMission === 'mission_3'
              ? () => setActiveEventCinematic('mission_3_final_home')
              : undefined
          }
          onSelectMission={(m) => {
            if (isMissionUnlocked(m, completedMissions)) {
              handleSelectMission(m);
            } else {
              setActiveMission('mission_1');
            }
            setScreenState('menu');
          }}
          onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
        />
      )}

      {screenState === 'mission_failed' && (
        <GameOverModal
          onRestart={handleRestartMission}
          onReturnToMenu={handleReturnToMenu}
          reason={
            resources.oxygen <= 0
              ? 'Your suit air ran out before you got back to the safe base!'
              : resources.condition <= 0
              ? 'The rover bumped into too many rocks and broke!'
              : 'Something went wrong outside on Mars.'
          }
        />
      )}

      {isFieldGuideOpen && (
        <NasaFieldGuide
          unlockedFactIds={unlockedFactIds}
          onClose={() => setIsFieldGuideOpen(false)}
        />
      )}
    </div>
  );
}
