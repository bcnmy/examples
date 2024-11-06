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
            <p>This is an example transaction. Executing..... </p>
            {address && <p>Smart Account Address: {address}</p>}
            {address && <p>Enter the paymasterUrl in the `index.ts` file. </p>}
            {hash && <p>Transaction Hash: {hash}</p>}
        </div>
    );
};

export default Home;
