import React from 'react';

interface SessionConfirmProps {
    showModal: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const SessionConfirm: React.FC<SessionConfirmProps> = ({ showModal, onConfirm, onCancel }) => {
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-auto max-w-lg">
                <h3 className="text-2xl mb-4 text-orange-400 font-semibold">Confirm Session Creation</h3>
                <p className="text-white mb-4">
                    This session will allow the following actions:
                </p>
                <ul className="list-disc list-inside text-white mb-4">
                    <li className="break-all">Increment counter at address 0x14e4829E655F0b3a1793838dDd47273D5341d416</li>
                    <li>No value limit</li>
                    <li>No time restrictions</li>
                    <li>No expiration date</li>
                    <li>Session id will be stored in local storage</li>
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