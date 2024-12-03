import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

const Header = () => {
    const { connectors, connect } = useConnect()
    const { disconnect } = useDisconnect()
    const account = useAccount()

    return (
        <div className="bg-orange-600 p-4 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-white">Nexus Action Dashboard</h1>
            <div>
                {account.status === 'connected' ? (
                    <button
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105"
                        onClick={() => disconnect()}
                    >
                        Disconnect
                    </button>
                ) : (
                    <div className="flex space-x-2">
                        <button
                            key={connectors[0].uid}
                            onClick={() => connect({ connector: injected() })}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Connect
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Header