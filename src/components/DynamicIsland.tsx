import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IslandState } from '../types';
import { DIMENSIONS, AUTO_COLLAPSE_DELAY } from '../utils/constants';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { useProgress } from '../hooks/useProgress';
import { CompactView } from './CompactView';
import { MusicView } from './MusicView';
import { Expandable } from './ui/expandable';

export function DynamicIsland() {
  const [state, setState] = useState<IslandState>(IslandState.COMPACT);
  const [autoCollapseTimeout, setAutoCollapseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);

  const { currentTrack, playPause, next, previous } = useMusicPlayer();
  const position = useProgress(currentTrack);

  // Removed console.log to reduce noise

  // Handle state changes
  const changeState = useCallback(
    (newState: IslandState) => {
      if (state === newState) return;

      // Clear auto-collapse timer
      if (autoCollapseTimeout) {
        clearTimeout(autoCollapseTimeout);
        setAutoCollapseTimeout(null);
      }

      setState(newState);
    },
    [state, autoCollapseTimeout]
  );

  // Auto-expand when music starts playing (unless manually collapsed)
  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.playing && state !== IslandState.MUSIC && !manuallyCollapsed) {
      changeState(IslandState.MUSIC);
      setManuallyCollapsed(false);
    } else if (!currentTrack.playing && state === IslandState.MUSIC) {
      // Auto-collapse after delay when paused
      const timeout = setTimeout(() => {
        changeState(IslandState.COMPACT);
        setManuallyCollapsed(false);
      }, AUTO_COLLAPSE_DELAY);
      setAutoCollapseTimeout(timeout);
    }
  }, [currentTrack, state, changeState, manuallyCollapsed]);

  // Click handler to toggle states
  const handleClick = useCallback(() => {
    if (state === IslandState.COMPACT && currentTrack) {
      changeState(IslandState.MUSIC);
      setManuallyCollapsed(false);
    } else if (state === IslandState.MUSIC) {
      changeState(IslandState.COMPACT);
      setManuallyCollapsed(true); // Mark as manually collapsed
    }
  }, [state, currentTrack, changeState]);

  const isExpanded = state !== IslandState.COMPACT;

  return (
    <div className="w-full h-full flex items-start justify-center">
      <Expandable
        isExpanded={isExpanded}
        collapsedSize={DIMENSIONS[IslandState.COMPACT]}
        expandedSize={DIMENSIONS[IslandState.MUSIC]}
        className="bg-black shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10 cursor-pointer relative overflow-hidden"
        onClick={handleClick}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === IslandState.COMPACT && (
            <CompactView key="compact" track={currentTrack} isVisible={true} />
          )}

          {state === IslandState.MUSIC && currentTrack && (
            <MusicView
              key="music"
              track={currentTrack}
              position={position}
              isVisible={true}
              onPlayPause={playPause}
              onPrevious={previous}
              onNext={next}
            />
          )}
        </AnimatePresence>
      </Expandable>
    </div>
  );
}
