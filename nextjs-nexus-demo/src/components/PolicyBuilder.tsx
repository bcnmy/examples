import React, { useState, useEffect } from 'react';
import { Hex, parseEther, toFunctionSelector, toHex } from 'viem';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SessionConfirm from './SessionConfirm';
import { counterABI } from '../utils/constants/abis/counter';
import { AGENT, COUNTER_ADDRESS, MOCK_EXCHANGE, SESSION_VALIDATOR } from '@/utils/constants/addresses';
import { SessionInfo } from '@/app/types/smartSessions';

interface SessionCreationFormProps {
    onSubmit: (sessionInfo: any) => void;
}

const PolicyBuilder: React.FC<SessionCreationFormProps> = ({ onSubmit }) => {
    const [sessionValidAfter, setSessionValidAfter] = useState<Date | undefined>(undefined);
    const [sessionValidUntil, setSessionValidUntil] = useState<Date | undefined>(undefined);
    const [functionSelector, setFunctionSelector] = useState<string>('incrementNumber');
    const [validAfter, setValidAfter] = useState<Date | undefined>(undefined);
    const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
    const [method, setMethod] = useState<string>('');
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
                    .map((item: any) => `function ${item.name}(${item.inputs.map((input: any) => `${input.type} ${input.name}`)})`);
                setAvailableMethods(methods);
                if (methods.length > 0) {
                    setMethod(methods[0]);
                }
            } catch (error) {
                console.error('Error parsing ABI:', error);
                setAvailableMethods([]);
            }
        }
    }, [contractABI]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sessionInfo: SessionInfo = {
            sessionPublicKey: AGENT,
            sessionValidAfter: sessionValidAfter ? Math.floor(sessionValidAfter.getTime() / 1000) : 0,
            sessionValidUntil: sessionValidUntil ? Math.floor(sessionValidUntil.getTime() / 1000) : 0,
            actionPoliciesInfo: [
                {
                    contractAddress,
                    functionSelector: toFunctionSelector(method),
                    validUntil: 0,
                    validAfter: 0,
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
                sessionInfo={sessionRequestedInfo}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg space-y-4">
            <h2 className="text-2xl mb-4 text-orange-400 font-semibold">Grant permissions to the AGENT</h2>

            {/* <div className="flex items-center mb-4">
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
            </div> */}

            {!useBuiltInContract && (
                <>
                    <div className="flex flex-col">
                        <label className="text-white mb-1">Allow it to interact with:</label>
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
                <label className="text-white mb-1">Allow it to call:</label>
                <select
                    value={method}
                    onChange={(e) => {
                        setMethod(
                            e.target.value
                        )
                    }}
                    className="bg-gray-600 text-white p-2 rounded"
                >
                    {availableMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-white mb-1">Permission Valid After:</label>
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
                <label className="text-white mb-1">Permission Valid Until:</label>
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

            {/* <div className="flex flex-col">
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
            </div> */}

            <div className="flex flex-col">
                <label className="text-white mb-1">Can send value up to:</label>
                <input
                    type="text"
                    value={valueLimit}
                    onChange={(e) => setValueLimit(e.target.value)}
                    className="bg-gray-600 text-white p-2 rounded"
                />
            </div>

            <button
                type="submit"
                disabled={!contractAddress || !contractABI}
                className={`text-white px-4 py-2 rounded transition duration-300 ease-in-out transform ${contractAddress && contractABI
                    ? 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
                    : 'bg-gray-500 cursor-not-allowed'
                    }`}
            >
                Grant permissions to AI Agent
            </button>
        </form>
    );
};

export default PolicyBuilder;
