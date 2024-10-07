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
            <h1>Welcome to Nexus Quickstart!</h1>
            <p>This is a simple example sending transaction using Nexus Smart Account.</p>
            {address && <p>Smart Account Address: {address}</p>}
            {address && <p>Next, we'll execute a simple transaction, where we will transfer funds from smart account to another account. 
                If the smart account doesn't have sufficient funds, please transfer to the smart account first. The funds will also cover gas fees for the transaction.</p>}
            {hash && <p>Transaction Hash: {hash}</p>}
        </div>
    );
};

export default Home;