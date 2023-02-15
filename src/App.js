import './App.css';
import React, { useState, useEffect } from 'react';
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { getSdkError } from '@walletconnect/utils'


const core = new Core({
  projectId: "966bc97b01b8e28008c9e28831317767",
});


function App() {
  const [uri, setUri] = useState('');
  const [Client, setClient] = useState();
  const [Connect, setConnect] = useState(false);
  const [sessions, setSessions] = useState([]);

  // initialize the wallets and wallet connect client
  // this is where the instance to wallet connect is created
  async function createClient() {
    const metadata = {
      name: 'INTU',
      description: 'Multi-sig MPC on-chain powered',
      url: 'https://intu.xyz/',
      icons: ['https://gateway.pinata.cloud/ipfs/QmU5iqpvoVGSHBNajpA4XNngSg2HrC2xrTaubWyaieWxVG']
    }

    try {
      const web3wallet = await Web3Wallet.init({
        core, // <- pass the shared `core` instance
        metadata,
      });
      console.log(web3wallet);
      setClient(web3wallet);
    } catch (e) {
      console.log(e)
    }

  }

  async function handleConnect() {
    if (!Client) throw Error("cannot connect, Client is not defined")
    try {
      const namespaces = {
        "eip155": {
          "accounts": [
            "eip155:5:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
          ],
          "methods": ["eth_sendTransaction"],
          "events": ["connect", "disconnect"]
        }
      };

      Client.on("session_proposal", async (proposal) => {
        // register session
        const session = await Client.approveSession({
          id: proposal.id,
          namespaces,
        });
        onSessionConnect(session);
        const topic = session.topic.slice(9);
        console.log(`Session approved: ${topic}`);
      });

      // Here you can use the "text" state value in a function or pass it to a parent component
      console.log(`You entered: ${uri}`);

      // pairing
      await Client.core.pairing.pair({ uri });
      setConnect(true);
      console.log(`connected`);


      //await subscribeToEvents(Client);

    } catch (error) {
      console.log(error);

    }

  };


  async function onSessionConnect(session) {
    if (!session) throw Error("session doesn't even exist")
    try {
      setSessions(session)
    } catch (e) {
      console.log(e);
    }
  }

  async function handleDisconnect() {
    try {
      const topic = sessions.topic.slice(9);

      await Client.disconnectSession({
        topic: topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    } catch (e) {
      console.log(e);
    }
  }

  async function subscribeToEvents(client, topic) {
    if (!client)
      throw Error("No events to subscribe to b/c client is not defined");

    try {
      await client.emitSessionEvent({
        topic: topic,
        event: {
          name: "disconnect",
          data: ["0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb"],
        },
        chainId: "eip155:5",
      });
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (!Client) {
      createClient();
    }
  }, [Client]);

  return (
    <div className="App">
      <h1> OWNEDConnect </h1>
      {Connect ? (
        <h2> Connected </h2>

      ) : (
        <>
          <h2> Not Connected </h2>
          <input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="Enter some uri"
          />
          <button onClick={handleConnect}>
            Submit
          </button>
        </>
      )
      }

    </div>
  );
}

export default App;
