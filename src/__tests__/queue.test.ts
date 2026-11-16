import { getNextIndex, getPrevIndex, reorderQueueItem } from '@store/queueUtils';
import { Track } from '../types/music';

const mockQueue = [{ id: '1' }, { id: '2' }, { id: '3' }] as Track[];

describe('Queue logic', () => {
  it('advances sequentially and stops at end when repeat is off', () => {
    expect(getNextIndex(0, 3, 'off', false)).toBe(1);
    expect(getNextIndex(2, 3, 'off', false)).toBeNull();
  });

  it('wraps around when repeat is all', () => {
    expect(getNextIndex(2, 3, 'all', false)).toBe(0);
    expect(getPrevIndex(0, 3, 'all')).toBe(2);
  });

  it('repeats current track when repeat is one', () => {
    expect(getNextIndex(1, 3, 'one', false)).toBe(1);
  });

  it('picks a different index when shuffle is enabled', () => {
    const next = getNextIndex(1, 3, 'off', true, () => 0.9);
    expect(next).not.toBe(1);
    expect(next).toBe(2);
  });

  it('reorders tracks cleanly', () => {
    const reordered = reorderQueueItem(mockQueue, 0, 2);
    expect(reordered.map((t) => t.id)).toEqual(['2', '3', '1']);
  });
});
