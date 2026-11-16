import { Track } from '../types/music';

export type RepeatMode = 'off' | 'all' | 'one';

export function getNextIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
  shuffle: boolean,
  randomFn: () => number = Math.random
): number | null {
  if (queueLength === 0) return null;
  if (repeatMode === 'one') return currentIndex;

  if (shuffle && queueLength > 1) {
    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(randomFn() * queueLength);
    }
    return next;
  }

  const next = currentIndex + 1;
  if (next < queueLength) return next;
  return repeatMode === 'all' ? 0 : null;
}

export function getPrevIndex(currentIndex: number, queueLength: number, repeatMode: RepeatMode): number | null {
  if (queueLength === 0) return null;
  if (currentIndex > 0) return currentIndex - 1;
  return repeatMode === 'all' ? queueLength - 1 : 0;
}

export function reorderQueueItem(queue: Track[], fromIndex: number, toIndex: number): Track[] {
  const copy = [...queue];
  const [moved] = copy.splice(fromIndex, 1);
  if (!moved) return queue;
  copy.splice(toIndex, 0, moved);
  return copy;
}
