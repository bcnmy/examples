import { useAccount, useBalance, type UseBalanceReturnType } from 'wagmi'
import { NexusClient } from "@biconomy/sdk-canary"
import { useEffect, useState } from 'react'
import { getInstalledValidators } from '@/utils/actions/getInstalledValidators'
import { Module } from '@/app/types/module'
import { validationModules } from '@/utils/constants/modules'
import { parseEther, WalletClient } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'

const AccountInfo = ({ nexusClient, setActiveValidationModule, activeValidationModule, walletClient }: { nexusClient: NexusClient, setActiveValidationModule: (module: Module) => void, activeValidationModule: Module | null, walletClient: WalletClient }) => {
    const account = useAccount()
    const [installedValidators, setInstalledValidators] = useState<Module[]>([validationModules[0]]);
    const [topUpAmount, setTopUpAmount] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isLoadingTopUp, setIsLoadingTopUp] = useState(false);

    const { data: balance }: UseBalanceReturnType = useBalance({
        address: nexusClient?.account.address,
    })

    useEffect(() => {
        async function fetchData() {
            const isDeployed = await nexusClient.account.isDeployed();
            if (isDeployed) {
                setIsDeployed(isDeployed);
            }
        }
        fetchData();
    }, [nexusClient])

    useEffect(() => {
        async function fetchData() {
            if (isDeployed) {
                const installedValidators = await getInstalledValidators(nexusClient);
                setInstalledValidators(installedValidators);
            }
        }
        fetchData();
    }, [nexusClient, isDeployed])

    useEffect(() => {
        async function fetchData() {
            if (isDeployed) {
                const activeModule = nexusClient.account.getActiveModule();
                const foundModule = validationModules.find(module => module.address === activeModule.address);
                setActiveValidationModule(foundModule as Module);
            }
        }
        fetchData();
    }, [nexusClient, isDeployed])

    const topUpSmartAccount = async () => {
        if (!nexusClient || !account.address) return;
        try {
            setIsLoadingTopUp(true);
            const tx = await walletClient.sendTransaction({
                account: account.address,
                to: nexusClient.account.address,
                value: parseEther(topUpAmount ?? "0"),
                from: account.address,
            });
            const receipt = await waitForTransactionReceipt(walletClient, { hash: tx });
        } catch (error) {
            console.error('Error topping up smart account:', error);
        } finally {
            setIsLoadingTopUp(false);
        }
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg">
            <h2 className="text-2xl mb-4 text-orange-400 font-semibold">Account Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div><strong className="text-orange-300">Status:</strong> <span className="text-white">{account.status}</span></div>
                    <div><strong className="text-orange-300">Chain:</strong> <span className="text-white">{account?.chain?.name ?? "Unknown"}</span></div>
                </div>
                <div></div>
                <div className="col-span-2"><strong className="text-orange-300">EOA Address:</strong> <span className="text-white break-all">{account.addresses?.[0]}</span></div>
                <div className="col-span-2"><strong className="text-orange-300">SA Address:</strong> <span className="text-white break-all">{nexusClient?.account.address}</span></div>
                <div className="col-span-2 space-y-2">
                    <div className="flex items-center">
                        <strong className="text-orange-300">Balance: {balance?.formatted ?? 0} ETH</strong>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Amount in ETH"
                            className="flex-grow p-2 bg-gray-600 rounded"
                            value={topUpAmount ?? "0"}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                        <button
                            onClick={topUpSmartAccount}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out whitespace-nowrap"
                            disabled={isLoadingTopUp}
                        >
                            {isLoadingTopUp ? "Funding..." : "Fund Account"}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 whitespace-nowrap">
                    {isDeployed ?
                        <>
                            <p className="text-lg mb-2 text-orange-400 font-semibold whitespace-nowrap">Smart Account Info</p>
                            <div className="col-span-2 flex items-center justify-between">
                                <div>
                                    <strong className="text-orange-300">Active Validation Module:</strong> <span className="text-white">{activeValidationModule?.name}</span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <strong className="text-orange-300">Installed Validators:</strong>
                                <ul className="list-disc list-inside text-white">
                                    {installedValidators.map((validator, index) => (
                                        <li key={index}>{validator.name}</li>
                                    ))}
                                </ul>
                            </div>
                            {activeValidationModule?.name === 'Ownable Validator' && (
                                <>
                                    <div className="col-span-2">
                                        <strong className="text-orange-300">Owners:</strong>
                                    </div>
                                </>
                            )}
                        </>
                        : <p>Smart Account not deployed</p>}
                </div>
            </div>
        </div>
    )
}

export default AccountInfo