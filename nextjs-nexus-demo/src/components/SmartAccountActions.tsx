import { useState } from 'react'
import { NexusClient } from "@biconomy/sdk"
import { Module } from '@/app/types/module'

const SmartAccountActions = ({ nexusClient, setShowUserOpPopup }: { nexusClient: NexusClient, setShowUserOpPopup: (show: boolean) => void }) => {
    const [topUpAmount, setTopUpAmount] = useState('')

    const topUpSmartAccount = async () => {
        if (!nexusClient) return;
        // await nexusClient.account.topUpSmartAccount(topUpAmount);
    }

    const handleModuleAction = async (action: 'install' | 'uninstall') => {
        if (!nexusClient) return;
        // await nexusClient.account.handleModuleAction(action);
    }

    const setActiveModule = async (module: Module) => {
        if (!nexusClient) return;
        // await nexusClient.account.setActiveValidationModule(module.address);
    }

    return (
        <div className="bg-gray-700 p-4 rounded-lg">
            <h2 className="text-2xl mb-4 text-orange-400 font-semibold">Smart Account Actions</h2>
            <div className="flex space-x-4 flex-wrap">
                <button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                    onClick={() => setShowUserOpPopup(true)}
                >
                    Send User Op 🚀
                </button>
                <button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                    onClick={() => handleModuleAction('install')}
                >
                    Install Module
                </button>
                <button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 mb-2"
                    onClick={() => handleModuleAction('uninstall')}
                >
                    Uninstall Module
                </button>
            </div>
            <div className="flex-1 flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Amount in wei"
                    className="flex-grow p-2 bg-gray-600 rounded"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                />
                <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105"
                    onClick={topUpSmartAccount}
                >
                    Top Up
                </button>
            </div>
        </div>
    )
}

export default SmartAccountActions