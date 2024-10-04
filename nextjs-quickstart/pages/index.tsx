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
            {hash && <p>Transaction Hash: {hash}</p>}
        </div>
    );
};

export default Home;