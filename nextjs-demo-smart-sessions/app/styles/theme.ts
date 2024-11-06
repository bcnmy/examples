import { useMarketStore } from '../stores/marketStore';
import { DeepPartial, ChartOptions, LineStyle, CandlestickSeriesOptions } from 'lightweight-charts';

export const bullishTheme = {
  positive: '#10B981', // emerald-500
  hover: '#34D399',   // emerald-400
  glow: 'rgba(16,185,129,0.5)',
  background: 'rgba(6,78,59,0.9)', // emerald-950/90
};

export const bearishTheme = {
  negative: '#EF4444', // red-500
  hover: '#F87171',   // red-400
  glow: 'rgba(239,68,68,0.5)',
  background: 'rgba(127,29,29,0.9)', // red-950/90
};

export const animations = {
  keyframes: {
    'flash-glow': {
      '0%': { 
        opacity: '1',
        filter: 'brightness(1)',
      },
      '15%': { 
        opacity: '1',
        filter: 'brightness(2)',
      },
      '30%': { 
        opacity: '1',
        filter: 'brightness(1.3)',
      },
      '45%': { 
        opacity: '1',
        filter: 'brightness(1.8)',
      },
      '60%': { 
        opacity: '1',
        filter: 'brightness(1.4)',
      },
      '75%': { 
        opacity: '1',
        filter: 'brightness(1.6)',
      },
      '100%': { 
        opacity: '1',
        filter: 'brightness(1)',
      },
    },
  },
  duration: '2.5s',
};

export const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { 
      color: 'transparent' 
    },
    textColor: '#FFFFFF',
  },
  grid: {
    vertLines: {
      visible: false,
    },
    horzLines: {
      visible: false,
    },
  },
  timeScale: {
    borderColor: 'transparent',
    borderVisible: false,
    timeVisible: true,
    secondsVisible: false,
  },
  crosshair: {
    vertLine: {
      visible: true,
      color: 'rgba(255, 255, 255, 0.2)',
      width: 1,
      style: 3,
      labelVisible: false,
    },
    horzLine: {
      visible: true,
      color: 'rgba(255, 255, 255, 0.2)',
      width: 1,
      style: 3,
      labelVisible: false,
    }
  },
  rightPriceScale: {
    visible: true,
    borderVisible: false,
    borderColor: 'transparent',
    textColor: 'rgba(255, 255, 255, 0.6)',
  },
  leftPriceScale: {
    visible: false,  // Keep left scale hidden
    borderVisible: false,
    borderColor: 'transparent',
  },
};

export const chartContainerStyles = {
  fade: '',
};

export const buttonStyles = {
  base: `w-full h-full flex flex-col items-center justify-center p-4 rounded-lg 
    transform transition-all duration-500 hover:scale-110 hover:rotate-1 text-white font-bold`,
  input: `w-full bg-black/50 text-white px-3 py-2 rounded-lg 
    border-2 border-white/20 focus:outline-none focus:border-white/40`,
};

export const theme = () => {
  const isBullish = useMarketStore(state => state.isBullish);
  
  const activeTheme = isBullish ? bullishTheme : bearishTheme;
  
  return {
    colors: activeTheme,
    chart: {
      options: {
        ...chartOptions,
        rightPriceScale: {
          visible: true,
          borderVisible: false,
          borderColor: 'transparent',
          textColor: 'rgba(255, 255, 255, 0.6)',
        },
      },
      series: {
        candlestick: {
          upColor: bullishTheme.positive,
          downColor: bearishTheme.negative,
          borderUpColor: bullishTheme.positive,
          borderDownColor: bearishTheme.negative,
          wickUpColor: bullishTheme.positive,
          wickDownColor: bearishTheme.negative,
          priceScaleId: 'right',
        },
        shortMA: {
          color: bullishTheme.positive,
          lineWidth: 2,
          priceScaleId: 'right',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        },
        longMA: {
          color: bearishTheme.negative,
          lineWidth: 2,
          priceScaleId: 'right',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        },
        volumeSeries: {
          upColor: bullishTheme.positive,
          downColor: bearishTheme.negative,
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',  // Empty string removes from price scale
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        },
      }
    }
  };
}; 


export const chartConfig: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: 'transparent' },
    textColor: '#666666',
  },
  grid: {
    vertLines: { visible: false },
    horzLines: { visible: false },
  },
  crosshair: {
    vertLine: {
      visible: true,
      color: 'rgba(255, 255, 255, 0.2)',
      width: 1,
      style: 3,  // Dotted line
      labelVisible: false,
    },
    horzLine: {
      visible: true,
      color: 'rgba(255, 255, 255, 0.2)',
      width: 1,
      style: 3,  // Dotted line
      labelVisible: false,
    }
  },
  leftPriceScale: {
    visible: false,
    borderVisible: false,
    borderColor: 'transparent',
  },
  rightPriceScale: {
    visible: true,
    borderVisible: false,
    borderColor: 'transparent',
    textColor: 'rgba(255, 255, 255, 0.6)',
  },
  timeScale: {
    borderColor: 'transparent',
    borderVisible: false,
    timeVisible: true,
    secondsVisible: true,
  },
};

export const candlestickSeriesOptions: DeepPartial<CandlestickSeriesOptions> = {
  upColor: '#4ADE80',         // Neon green
  downColor: '#FF4444',       // Neon red
  borderUpColor: '#4ADE80',   // Neon green
  borderDownColor: '#FF4444', // Neon red
  wickUpColor: '#4ADE80',     // Neon green
  wickDownColor: '#FF4444',   // Neon red
};

export const shortMAOptions = {
  color: '#4ADE80',    // Neon green
  lineWidth: 2,
  title: '',
  priceScaleId: '',  // Change from 'right' to empty string
  priceLineVisible: false,
  lastValueVisible: false
};

export const longMAOptions = {
  color: '#FF4444',    // Neon red
  lineWidth: 2,
  title: '',
  priceScaleId: '',  // Change from 'right' to empty string
  priceLineVisible: false,
  lastValueVisible: false
}; 