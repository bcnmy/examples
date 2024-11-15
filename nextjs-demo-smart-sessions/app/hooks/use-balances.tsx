import { useAccount, useBalance } from 'wagmi';
import { MOCK_USDC_ADDRESS, MOCK_WETH_ADDRESS } from '@/lib/constants';

export type UseBalancesPayload = {
  wethBalance: string;
  usdcBalance: string;
  isLoading: boolean;
  hasZeroBalance: boolean;
}

export function useBalances(): UseBalancesPayload {
  const { address } = useAccount();
  
  const { 
    data: wethBalance,
    isLoading: isLoadingWeth 
  } = useBalance({
    address,
    token: MOCK_WETH_ADDRESS,
  });

  const { 
    data: usdcBalance,
    isLoading: isLoadingUsdc 
  } = useBalance({
    address,
    token: MOCK_USDC_ADDRESS,
  });

  return {
    wethBalance: wethBalance?.formatted || '0',
    usdcBalance: usdcBalance?.formatted || '0',
    isLoading: isLoadingWeth || isLoadingUsdc,
    hasZeroBalance: wethBalance?.formatted === '0' && usdcBalance?.formatted === '0'
  };
}
