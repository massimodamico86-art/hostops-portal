import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Shared media playback hook for unified media system
 *
 * This hook provides centralized media playback logic used by:
 * - Main Preview
 * - ALL 4 layout preview cards
 *
 * MUST be used once and shared - DO NOT create multiple instances
 *
 * @param {import('../types/media').UnifiedMediaState} unifiedMediaState
 * @returns {{
 *   activeType: 'image' | 'video',
 *   items: Array<import('../types/media').MediaItem>,
 *   currentItem: import('../types/media').MediaItem | null,
 *   currentIndex: number,
 *   onVideoEnded: () => void
 * }}
 */
export function useMediaPlayback(unifiedMediaState) {
  const { activeType, imageItems, videoItems, imageRotationIntervalSeconds } = unifiedMediaState;

  // Determine which items array to use
  const items = activeType === 'image' ? imageItems : videoItems;

  // Current playback index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref to store interval ID for cleanup
  const intervalRef = useRef(null);

  // Reset index when items change or activeType changes
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [items.length, activeType, currentIndex]);

  // IMAGE ROTATION LOGIC
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up rotation for images with more than 1 item
    if (activeType === 'image' && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
      }, imageRotationIntervalSeconds * 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeType, items.length, imageRotationIntervalSeconds]);

  // VIDEO PLAYLIST LOGIC
  // Callback for when a video ends (used by video elements)
  const onVideoEnded = useCallback(() => {
    if (activeType === 'video' && items.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    } else if (activeType === 'video' && items.length === 1) {
      // Single video loops automatically via loop attribute
      setCurrentIndex(0);
    }
  }, [activeType, items.length]);

  // Get current item
  const currentItem = items.length > 0 ? items[currentIndex] : null;

  return {
    activeType,
    items,
    currentItem,
    currentIndex,
    onVideoEnded
  };
}
