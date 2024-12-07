export enum CrossType {
  GOLDEN = 'GOLDEN',
  DEATH = 'DEATH'
}

export interface CrossSignal {
  type: CrossType | null;
  timestamp: number;
}

export class CrossDetector {
  private lastShortMA: number | null = null;
  private lastLongMA: number | null = null;
  private goldenCrossDetected: boolean = false;
  private deathCrossDetected: boolean = false;

  update(shortMA: number | null, longMA: number | null, timestamp: number): CrossSignal | null {
    if (shortMA === null || longMA === null) {
      return null;
    }

    let signal: CrossSignal | null = null;

    // Check for golden cross
    if (this.lastShortMA !== null && this.lastLongMA !== null) {
      // Golden Cross: Short MA crosses above Long MA
      if (!this.goldenCrossDetected && 
          this.lastShortMA <= this.lastLongMA && 
          shortMA > longMA) {
        this.goldenCrossDetected = true;
        this.deathCrossDetected = false;
        signal = { type: CrossType.GOLDEN, timestamp };
      }
      // Death Cross: Short MA crosses below Long MA
      else if (!this.deathCrossDetected &&
               this.lastShortMA >= this.lastLongMA &&
               shortMA < longMA) {
        this.deathCrossDetected = true;
        this.goldenCrossDetected = false;
        signal = { type: CrossType.DEATH, timestamp };
      }
    }

    this.lastShortMA = shortMA;
    this.lastLongMA = longMA;
    return signal;
  }

  clear() {
    this.lastShortMA = null;
    this.lastLongMA = null;
    this.goldenCrossDetected = false;
    this.deathCrossDetected = false;
  }
} 