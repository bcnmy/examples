import { createAccountAndSendTransaction } from "../index";
import React from 'react';
const Home: React.FC = () => {
    const [{address, hash}, setTransactionDetails] = React.useState({address: '', hash: ''});

    React.useEffect(() => {
        const fetchTransactionDetails = async () => {
            const {address, hash} = await createAccountAndSendTransaction();
            setTransactionDetails({address, hash});
        };
        fetchTransactionDetails();
    }, []);

    return (
        <div>
            <h1>Sending gasless transactions!</h1>
            <p>This is an example transaction, transferring 0.001 ETH from the smart account to a random address. </p>
            {address && <p>Smart Account Address: {address}</p>}
            {address && <p>Enter the paymasterUrl in the `index.ts` file. If the smart account doesn't have sufficient funds, transfer to the smart account first. </p>}
            {hash && <p>Transaction Hash: {hash}</p>}
        </div>
    );
};

export default Home;