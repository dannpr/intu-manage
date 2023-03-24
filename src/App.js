import './App.css';
import React, { useState, useEffect } from 'react';
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";

import { getSdkError } from '@walletconnect/utils';
import { utils } from 'ethers';

const core = new Core({
  projectId: "3d0441c30b03bdcd68ac95d412630808",
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
      //console.log(core);
      const web3wallet = await Web3Wallet.init({
        core, // <- pass the shared `core` instance
        metadata,
      });
      setClient(web3wallet);
    } catch (e) {
      console.log(e)
    }

  }

  async function handleConnect() {
    if (!Client) throw Error("cannot connect, Client is not defined")
    try {
      // set the wallet connect client
      // you need to put in the namespace all of the cases possible to be used correctly
      /*       const namespaces = {
              "eip155": {
                "accounts": ["eip155:5:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"],
                "methods": [
                  "eth_sendTransaction",
                  "personal_sign",
                  "eth_sign",
                  "eth_signTransaction",
                  "eth_signTypedData",
                  "eth_signTypedData_v3",
                  "eth_signTypedData_v4"
                ],
                "events": [
                  "chainChanged",
                  "accountsChanged",
                  "disconnect",
                  "connect",
                ],
              }
            }; */

      Client.on("session_proposal", async (proposal) => {

        console.log(proposal);
        const { params } = proposal
        const { requiredNamespaces } = params;
        const { eip155 } = requiredNamespaces;
        const { methods, events } = eip155;

        console.log("required namespace ", requiredNamespaces);
        console.log("eip 155", eip155);
        console.log("methods ", methods);
        console.log("events", events);

        const namespaces = {
          "eip155": {
            "accounts": [
              "eip155:5:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"
            ],
            methods,
            events,
          }
        };

        console.log("namespace ", namespaces);


        // register session
        const session = await Client.approveSession({
          id: proposal.id,
          namespaces,
        });

        onSessionConnect(session);
        const { topic } = session;
        const { pairingTopic } = session;

        console.log(`pairing topic : ${pairingTopic}`);
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

  /*  async function handleSendTransaction() {
     if (!Client) throw Error("cannot send transaction, Client is not defined")
     try {
 
       Client.on("session_request", async (event) => {
         const { topic, params, id } = event;
         const { request } = params;
         const requestParamsMessage = request.params[0];
 
         console.log(requestParamsMessage);
 
         // convert `requestParamsMessage` by using a method like hexToUtf8
         const message = utils.toUtf8String(requestParamsMessage);
 
         // sign the message
         // process of signing transaction link to intu
         const signedMessage = await wallet.signMessage(message);
 
         const response = {
           id,
           result: signedMessage,
           jsonrpc: "2.0"
         };
 
         await Client.respondSessionRequest({
           topic,
           response
         });
 
       });
     } catch (e) {
       console.log(e);
     }
   }
  */


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
