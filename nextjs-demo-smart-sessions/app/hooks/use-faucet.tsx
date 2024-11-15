import React from 'react';
import { useState } from 'react';
import { useToast } from './use-toast'
import { ExternalLink } from 'lucide-react'

export function useFaucet() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { toast } = useToast();

  const claimTokens = async (address?: string) => {
    if (!address) return

    setIsClaiming(true);
    setClaimError(null);
    
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log({ data })

      toast({
        title: "Tokens Claimed! 🎉",
        description: (
          <div className="flex flex-col gap-2">
            <p>You've received 5 USDC and 0.001 WETH</p>
            <div className="flex gap-2">
              <a 
                href={`https://sepolia.basescan.org/tx/${data.hashes[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                USDC Tx <ExternalLink size={14} />
              </a>
              <a 
                href={`https://sepolia.basescan.org/tx/${data.hashes[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                WETH Tx <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ),
        duration: 5000,
      });
    } catch (error) {
      console.error('Claim error details:', error);
      setClaimError(error instanceof Error ? error.message : 'Failed to claim tokens');
      
      toast({
        title: "Failed to claim tokens",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isClaiming,
    claimError,
    claimTokens
  };
} 