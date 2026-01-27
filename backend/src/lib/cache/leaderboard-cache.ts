/**
 * Leaderboard Cache
 * 
 * Provides in-memory caching for leaderboard data to prevent race conditions
 * during rank calculations and improve read performance.
 */

interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  r1_score: number | null;
  r2_score: number | null;
  round3_1_score: number | null;
  round3_2_score: number | null;
  round3_3_score: number | null;
  rank: number | null;
  r1_submission_time: string | null;
  r2_submission_time: string | null;
  round3_1_timestamp: string | null;
  round3_2_timestamp: string | null;
  round3_3_timestamp: string | null;
}

interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
}

class LeaderboardCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 5000; // 5 seconds cache TTL
  private readonly MAX_CACHE_SIZE = 10; // Max number of cached queries

  /**
   * Generate cache key for a specific query
   */
  private generateKey(round?: number): string {
    return `leaderboard:${round || 'all'}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.TTL;
  }

  /**
   * Get cached leaderboard data
   */
  get(round?: number): LeaderboardEntry[] | null {
    const key = this.generateKey(round);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) {
      // Clean up expired entry
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return entry.data;
  }

  /**
   * Set leaderboard data in cache
   */
  set(data: LeaderboardEntry[], round?: number): void {
    const key = this.generateKey(round);

    // Implement simple LRU: Remove oldest entry if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: [...data], // Create copy to prevent mutations
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all cached leaderboard data
   * Call this after rank recalculation or score updates
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Invalidate specific round cache
   */
  invalidate(round?: number): void {
    const key = this.generateKey(round);
    this.cache.delete(key);
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const leaderboardCache = new LeaderboardCache();
