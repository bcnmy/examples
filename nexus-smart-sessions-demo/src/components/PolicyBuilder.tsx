import React, { useState, useEffect } from 'react';
import { Hex, toFunctionSelector, toHex } from 'viem';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SessionConfirm from './SessionConfirm';
import { COUNTER_ADDRESS } from '../utils/constants/contracts';
import { counterABI } from '../utils/constants/abis/counter';

interface SessionCreationFormProps {
    onSubmit: (sessionInfo: any) => void;
}

const PolicyBuilder: React.FC<SessionCreationFormProps> = ({ onSubmit }) => {
    const [sessionValidAfter, setSessionValidAfter] = useState<Date | undefined>(undefined);
    const [sessionValidUntil, setSessionValidUntil] = useState<Date | undefined>(undefined);
    const [functionSelector, setFunctionSelector] = useState<string>('incrementNumber');
    const [validAfter, setValidAfter] = useState<Date | undefined>(undefined);
    const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
    const [valueLimit, setValueLimit] = useState<string>('0');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [contractABI, setContractABI] = useState<string>('');
    const [availableMethods, setAvailableMethods] = useState<string[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [sessionRequestedInfo, setSessionRequestedInfo] = useState<any>(null);
    const [useBuiltInContract, setUseBuiltInContract] = useState<boolean>(false);

    useEffect(() => {
        if (useBuiltInContract) {
            setContractAddress(COUNTER_ADDRESS);
            setContractABI(JSON.stringify(counterABI));
        } else {
            setContractAddress('');
            setContractABI('');
        }
    }, [useBuiltInContract]);

    useEffect(() => {
        if (contractABI) {
            try {
                const parsedABI = JSON.parse(contractABI);
                const methods = parsedABI
                    .filter((item: any) => item.type === 'function')
                    .map((item: any) => item.name);
                setAvailableMethods(methods);
                if (methods.length > 0) {
                    setFunctionSelector(methods[0]);
                }
            } catch (error) {
                console.error('Error parsing ABI:', error);
                setAvailableMethods([]);
            }
        }
    }, [contractABI]);


    console.log(toHex("incrementNumber"), "toHex");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sessionInfo = {
            sessionPublicKey: "0x4B8306128AEd3D49A9D17B99BF8082d4E406fa1F",
            sessionValidatorAddress: "0xAAAdFd794A1781e4Fd3eA64985F107a7Ac2b3872",
            sessionKeyData: "0x4B8306128AEd3D49A9D17B99BF8082d4E406fa1F",
            sessionValidAfter: sessionValidAfter ? Math.floor(sessionValidAfter.getTime() / 1000) : 0,
            sessionValidUntil: sessionValidUntil ? Math.floor(sessionValidUntil.getTime() / 1000) : 0,
            actionPoliciesInfo: [
                {
                    contractAddress: contractAddress,
                    functionSelector: toFunctionSelector("incrementNumber()"),
                    validUntil: validUntil ? Math.floor(validUntil.getTime() / 1000) : 0,
                    validAfter: validAfter ? Math.floor(validAfter.getTime() / 1000) : 0,
                    rules: [],
                    valueLimit: BigInt(valueLimit)
                }
            ]
        };
        setSessionRequestedInfo(sessionInfo);
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        onSubmit(sessionRequestedInfo);
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    if (showConfirmation) {
        return (
            <SessionConfirm
                showModal={showConfirmation}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg space-y-4">
            <h2 className="text-2xl mb-4 text-orange-400 font-semibold">Create Custom Session</h2>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id="useBuiltInContract"
                    checked={useBuiltInContract}
                    onChange={(e) => setUseBuiltInContract(e.target.checked)}
                    className="mr-2"
                />
                <label htmlFor="useBuiltInContract" className="text-white">
                    Use built-in Counter contract
                </label>
            </div>

            {!useBuiltInContract && (
                <>
                    <div className="flex flex-col">
                        <label className="text-white mb-1">Contract Address:</label>
                        <input
                            type="text"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            className="bg-gray-600 text-white p-2 rounded"
                            placeholder="Enter contract address"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-white mb-1">Contract ABI:</label>
                        <textarea
                            value={contractABI}
                            onChange={(e) => setContractABI(e.target.value)}
                            className="bg-gray-600 text-white p-2 rounded h-32"
                            placeholder="Paste contract ABI here"
                        />
                    </div>
                </>
            )}

            <div className="flex flex-col">
                <label className="text-white mb-1">Function:</label>
                <select
                    value={functionSelector}
                    onChange={(e) => setFunctionSelector(e.target.value)}
                    className="bg-gray-600 text-white p-2 rounded"
                >
                    {availableMethods.map((method) => (
                        <option key={method} value={method}>{method}()</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Session Valid After:</label>
                <DatePicker
                    selected={sessionValidAfter}
                    onChange={(date: Date) => setSessionValidAfter(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="bg-gray-600 text-white p-2 rounded w-full"
                    isClearable
                    placeholderText="Select date and time or leave empty for no limit"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Session Valid Until:</label>
                <DatePicker
                    selected={sessionValidUntil}
                    onChange={(date: Date) => setSessionValidUntil(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="bg-gray-600 text-white p-2 rounded w-full"
                    isClearable
                    placeholderText="Select date and time or leave empty for no limit"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Valid After:</label>
                <DatePicker
                    selected={validAfter}
                    onChange={(date: Date) => setValidAfter(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="bg-gray-600 text-white p-2 rounded w-full"
                    isClearable
                    placeholderText="Select date and time or leave empty for no limit"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Valid Until:</label>
                <DatePicker
                    selected={validUntil}
                    onChange={(date: Date) => setValidUntil(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="bg-gray-600 text-white p-2 rounded w-full"
                    isClearable
                    placeholderText="Select date and time or leave empty for no limit"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Value Limit:</label>
                <input
                    type="text"
                    value={valueLimit}
                    onChange={(e) => setValueLimit(e.target.value)}
                    className="bg-gray-600 text-white p-2 rounded"
                />
            </div>

            <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105"
            >
                Create Session
            </button>
        </form>
    );
};

export default PolicyBuilder;
