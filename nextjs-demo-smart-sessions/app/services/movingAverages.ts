export class MovingAverageCalculator {
  private values: number[] = [];
  private period: number;
  
  constructor(period: number) {
    this.period = period;
  }

  update(value: number): number | null {
    this.values.push(value);
    
    // Keep only the needed amount of values
    if (this.values.length > this.period) {
      this.values.shift();
    }

    // Calculate MA when we have enough values
    if (this.values.length >= this.period) {
      return this.calculate();
    }
    
    return null;
  }

  private calculate(): number {
    const sum = this.values.reduce((acc, val) => acc + val, 0);
    return sum / this.values.length;
  }

  clear() {
    this.values = [];
  }
} 