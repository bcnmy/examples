import { SessionInfo } from '@/app/types/smartSessions';
import { MOCK_EXCHANGE_ABI } from '@/utils/constants/abis/mockExchange';
import React from 'react';
import { decodeFunctionData, toFunctionSelector } from 'viem';

interface SessionConfirmProps {
    showModal: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    sessionInfo: SessionInfo;
}

const SessionConfirm: React.FC<SessionConfirmProps> = ({ showModal, onConfirm, onCancel, sessionInfo }) => {
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-auto max-w-lg">
                <h3 className="text-2xl mb-4 text-orange-400 font-semibold">Confirm Session Creation</h3>
                <p className="text-white mb-4">
                    You are granting the following permissions to the AI Agent:
                </p>
                <ul className="list-disc list-inside text-white mb-4">
                    <li className="break-all">Call buyApple on {`${sessionInfo?.actionPoliciesInfo[0].contractAddress}`}</li>
                    <li>Value limit: {`${sessionInfo?.actionPoliciesInfo[0].valueLimit}`}</li>
                    <li>Valid until: {`${sessionInfo?.actionPoliciesInfo[0].validUntil}`}</li>
                    <li>{sessionInfo?.actionPoliciesInfo[0].rules?.length == 0 ?? "No rules"}</li>
                </ul>
                <div className="flex justify-between">
                    <button
                        onClick={onConfirm}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionConfirm;