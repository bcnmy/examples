import { createAccountAndSendTransaction } from "./index";
import React from 'react';
const Home: React.FC = () => {
    const [{address, hash}, setTransactionDetails] = React.useState({address: '', hash: ''});

    React.useEffect(() => {
        const fetchTransactionDetails = async () => {
            const {address, hash} = await createAccountAndSendTransaction();
            if (address && hash) {
              setTransactionDetails({address, hash});
            }
        };
        fetchTransactionDetails();
    }, []);

    return (
        <div>
            <h1>Welcome to Nexus Quickstart!</h1>
            <p>This is an example transaction, transferring 0.001 ETH from the smart account to a random address. </p>
            {address && <p>Smart Account Address: {address}</p>}
            {address && <p> If the smart account doesn't have sufficient funds, transfer to the smart account first. The funds will also cover gas fees for the transaction.</p>}
            {hash && <p>Transaction Hash: {hash}</p>}
        </div>
    );
};

export default Home;