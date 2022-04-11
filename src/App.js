// CSS
import './App.css';

// Images
import logo from './images/logo.png';
import btnIg from './images/buttonIg.png';
import btnTw from './images/buttonTw.png';
import btnDc from './images/buttonDc.png';

import React, { useEffect, useState } from 'react';
import { getCookie, hasher, setCookie } from './General';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import c from './constants';

import NamiWalletApi, { Cardano } from './nami-js';

let nami;

const sessionCookieBump = () => {
    const cookieValue = getCookie(c.COOKIE_KEY);
    if (cookieValue.length === 0) {
        const uuid = uuidv4();
        setCookie(c.COOKIE_KEY, uuid, 1)
    }
    else {
        setCookie(c.COOKIE_KEY, cookieValue, 1)
    }
}

const AppState = {
    NeedLogIn: 1,
    LoggedIn: 2,
    ProcessingClaim: 3,
    Done: 4
};
Object.freeze(AppState);

export default function App() {
    const [namiConnected, setNamiConnected] = useState(false);

    // My States
    const [mobileNavIsOpen, setMobileNavIsOpen] = useState(false);
    const [appState, setAppState] = useState(AppState.NeedLogIn);
    const [discordInfo, setDiscordInfo] = useState(null);
    const [databaseResponse1, setDatabaseResponse1] = useState(null);
    const [databaseResponse3, setDatabaseResponse3] = useState(null);
    const [mouseOverNft, setMouseOverNft] = useState(false);
    const [error, setError] = useState(null);

    const mouseNftEnter = (e) => { setMouseOverNft(true); }
    const mouseNftLeave = (e) => { setMouseOverNft(false); }

    var errorToDisplay = error;
    if (errorToDisplay == null && databaseResponse1?.error != null) errorToDisplay = databaseResponse1.error;

    const mainContents = () => {
        if (discordInfo !== null)
            return (
                <div className="flex flex-col items-stretch">
                    <div className="flex flex-row items-stretch mb-5">
                        <div className="flex flex-col w-2/3">
                            <div className="flex-1 bg-black/10 rounded-md text-center flex flex-col justify-center relative overflow-clip">
                                <img src="https://gw3.easy-ipfs.com/ipfs/Qmc8HUhSEYegtQP5GCCjJmPA793ML5E7b2uTDtC74hxu3E" alt="Airdrop for the week"></img>
                            </div>
                        </div>
                        <div className="p-2"></div>
                        <div className="flex flex-col w-1/3">
                            <div className="flex-1 bg-black/10 rounded-md flex flex-col justify-center relative h-full w-full">
                                <div className="bg-black/50 p-3 flex flex-col justify-center rounded-md h-full w-full">
                                    <p className="text-xl">{c.NFT_TITLE}</p>
                                    <p>by <a className="text-yellow-300 font-bold underline" href="https://twitter.com/SSlugs74">The Voyager</a></p>
                                    <br/>
                                    <p>{c.NFT_DESCRIPTION}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row items-stretch">
                        <div className="flex flex-col flex-1 w-1/2">
                            <div className="bg-gray-400 rounded-md justify-center relative flex flex-row overflow-clip">
                                <span className="my-auto text-black/50 font-bold inline bg-yellow-300 py-1 px-3">Discord User </span>
                                <img className="avatar" src={'https://cdn.discordapp.com/avatars/' + discordInfo.id + '/' + discordInfo.avatar}/>
                                <span className="text-black font-normal flex-1 py-1 px-3">{discordInfo.username}</span>
                            </div>
                            <div className="p-2"></div>
                            <div className="bg-white flex-1 rounded-md text-center relative overflow-clip flex flex-col">
                                <p className="text-black/50 font-bold bg-yellow-300 p-1">WALLET CONTENTS</p>
                                <div className="p-2 flex-1">
                                    {
                                        errorToDisplay != null && <div className="flex flex-col justify-center h-full"><p className='text-red-800'>
                                            Error: <span>{errorToDisplay}</span>
                                        </p></div>
                                    }
                                    {
                                        (errorToDisplay != null) ? (<></>) :
                                            (databaseResponse1 == null) ? <p className="text-black">Loading...</p> :
                                                <table className="text-black w-full">
                                                    <thead className="border-b-2 border-gray-400">
                                                        <tr>
                                                            <th className="p-1">Kairoscore Edition</th>
                                                            <th className="p-1">Quantity</th>
                                                            <th className="p-1">Probability</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            c.EDITIONS.filter((v, i, arr) => databaseResponse1[v.toLowerCase()] !== 0).map((v, i, arr) => {
                                                                return (
                                                                    <tr className="transition-all-fast" key={i}>
                                                                        <td className="p-1">{v}</td>
                                                                        <td className="p-1">{databaseResponse1[v.toLowerCase()]}</td>
                                                                        <td className="p-1">{c.AIRDROP_PROBABILITIES[v.toUpperCase()] * 100}%</td>
                                                                    </tr>
                                                                );
                                                            })
                                                        }
                                                    </tbody>
                                                </table>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="p-2"></div>
                        <div className="flex flex-col w-1/2">
                            <div className="flex-1 bg-black/10 rounded-md flex flex-col justify-center relative h-full w-full">
                                <div className="bg-black/50 px-20 pt-20 pb-5 flex flex-col justify-center rounded-md h-full w-full">
                                    <p>You have {databaseResponse1 ? databaseResponse1.airdrop : 0} NFT{databaseResponse1 && databaseResponse1.airdrop === 1 ? '' : 's'} that you can claim. This was determined probabilistically on the backend and will be reset for each drop.</p>
                                    <br/>
                                    {getMainButtonLoggedIn()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        return (<div className="flex flex-col justify-center h-full">
            <p className="my-32 text-center">Login Discord to connect your wallet</p>
        </div>);
    }

    const getMainButton = () => {
        switch (appState) {
            case AppState.NeedLogIn:
                return <button className="animated-all bg-white disabled:opacity-25 p-4 shadow-md rounded-md w-60 m-4 mx-auto" onClick={logInCallback}>Log In</button>
            default:
                return <></>;
        }
    }

    const getMainButtonLoggedIn = () => {
        switch (appState) {
            case AppState.LoggedIn:
                if (databaseResponse1 == null || errorToDisplay != null)
                    return <></>;
                if (databaseResponse1.airdrop === 0)
                    return <button disabled className="animated-all bg-white disabled:opacity-50 p-4 shadow-md rounded-md w-60 m-4 mx-auto text-black">No Eligible Cores!<br />Try Again Next Week!</button>
                if (databaseResponse1.airdrop === databaseResponse1.airdrop_taken)
                    return <button disabled className="animated-all bg-white disabled:opacity-25 p-4 shadow-md rounded-md w-60 m-4 mx-auto text-black">Already Claimed!</button>
                if (error == null)                    
                    return <button onClick={claimCallback} className="animated-all bg-white disabled:opacity-25 p-4 shadow-md rounded-md hover:bg-yellow-100 w-60 m-4 mx-auto text-black">Claim ({databaseResponse1.airdrop} NFTS!)</button>
                return <></>;
            case AppState.ProcessingClaim:
                if (error == null)
                    return <button disabled className="animated-all bg-white disabled:opacity-25 p-4 shadow-md rounded-md w-60 m-4 mx-auto text-black">Processing...</button>
                return <></>;
            case AppState.Done:
                return <p className="p-4 text-white text-center">Airdrop Complete! Please use the following transaction hash to confirm on cardanoscan:<br/><br/>{databaseResponse3.txHash}</p>
            default:
                return <></>;
        }
    }

    const logInCallback = async (e) => {
        e.preventDefault();

        sessionCookieBump();
        const sessionCookie = getCookie(c.COOKIE_KEY)
        const hashedSessionCookie = hasher(sessionCookie);

        window.location.href = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=${c.CLIENT_ID}&scope=identify&state=${hashedSessionCookie}`;
    }

    const connectNami = async () => {
        const S = await Cardano();
        nami = new NamiWalletApi(
            S,
            window.cardano,
            c.BLOCKFROST_API_KEY
        )

        if (!await nami.isInstalled()){
            setError("Nami is not installed.");
            return;
        }

        await nami.enable();

        if (await nami.isEnabled()){
            return true;
        }
        else{
            setError(`Nami is not enabled.`);
            return false;
        }
    }

    const claimCallback = async (e) => { // Endpoint 2
        e.preventDefault();

        setAppState(AppState.ProcessingClaim);

        const endpoint2Url = `https://demons-api.herokuapp.com/Kairos/Airdrop/RandomGet/${databaseResponse1.airdrop}/${c.CURRENT_NFT_TYPE}`;

        // Connects nami wallet to current website 
        const connectNamiResult = await connectNami();
        if (!connectNamiResult)
            return;

        let preData;
        let myAddress = await nami.getAddress();

        axios.get(endpoint2Url).then(async (res2) => {

            preData = res2;
            let mintedAssetsArray = [];
            for (let i = 0; i < preData.data.nftName.length; i++) {
                mintedAssetsArray.push({
                    assetName: preData.data.nftName[i],
                    quantity: "1",
                    policyId: c.POLICY_ID,
                    policyScript: c.POLICY_SCRIPT,
                });
            }

            const recipients = [{               
                address: myAddress,
                amount: "0",
                mintedAssets: mintedAssetsArray
            }];
    
            buildTransaction(recipients, preData.data, myAddress, databaseResponse1.airdrop);
        }).catch((e) => {
            console.log(JSON.stringify(e));
            setError(JSON.stringify(e));
        });
    }

    async function buildTransaction(recipients, preData, myAddress, buyingAmount) {    
        const dummyMetadata = makeDummyMetadata(preData);


        const type = c.CURRENT_NFT_TYPE;
        try {
            let utxos = await nami.getUtxosHex();
            let netId = await nami.getNetworkId();
            const transaction = await nami.transaction({
                PaymentAddress: myAddress,
                recipients: recipients,
                metadataHash: preData.metaDataHash,
                metadata: dummyMetadata,
                utxosRaw: utxos,
                networkId: netId.id,
                ttl: 3600,
                addMetadata: false,
                multiSig: true,
            });

            const witnessBuyer = await nami.signTx(transaction, true);
        
            let nftNames = '';
            for (let i = 0; i < preData.nftName.length; i++){
                if (i === 0) {
                    nftNames = nftNames + preData.nftName[i];
                }
                else {
                    nftNames = nftNames + ',' + preData.nftName[i];
                }
            }

            const endpoint3Url = `https://demons-api-test.herokuapp.com/Kairos/Airdrop/MultiSig/${transaction}/${witnessBuyer}/${nftNames}/${myAddress}/${type}/${buyingAmount}/${discordInfo.id}`
            axios.get(endpoint3Url).then((response) => {
                if (response.data.error) {
                    console.log(response.data.error)
                    setError(response.data.error);
                    return;
                }

                setDatabaseResponse3(response.data);
                setAppState(AppState.Done);

            })
            .catch((e) => {
                console.log("(buildTransaction, get catch) setting error:")
                console.log(e)
                setError(JSON.stringify(e));
            })
        } catch (e) {
            console.log("(buildTransaction, catch) setting error:")
            console.log(e)
            console.log(JSON.stringify(e))
            setError(JSON.stringify(e));
        }
      };



    // Code when being redirected back from discord
    useEffect(() => {
        sessionCookieBump();

        const fragmentMap = {}
        window.location.hash.substring(1).split("&").forEach((v, i, arr) => {
            const equalsIndex = v.indexOf("=")
            fragmentMap[v.substring(0, equalsIndex)] = v.substring(equalsIndex + 1)
        })
        window.location.hash = "";

        if (fragmentMap.access_token == null){
            connectNami(); // Debug connect
            return;
        }

        setAppState(AppState.LoggedIn);

        const meUrl = `${c.API_ENDPOINT}/users/@me`;
        const body = {
            'headers': {
                'authorization': `${fragmentMap.token_type} ${fragmentMap.access_token}`,
            }
        }
        axios.get(meUrl, body).then((res) => {
            setDiscordInfo(res.data)
        })
    }, [])

    // Code to run when discord info has been retrieved (Endpoint 1)
    useEffect(() => {
        if (discordInfo == null)
            return;
        console.log(discordInfo);
        const discordIdToUse = discordInfo.id;
        axios.get(`https://demons-api.herokuapp.com/Kairos/Airdrop/Info/${discordIdToUse}`).then((res) => {
            setDatabaseResponse1(res.data)
        }).catch((e) => {
            console.log(JSON.stringify(e))
            setError(JSON.stringify(e.response.data.error))
        })
    }, [discordInfo])

    function makeDummyMetadata(preData) { // TODO: check again
        let dummyMetadata = 
        {
            "721":{
                "9d53f82c2ee0a83bd724d90dd74109766035204b0d30a82b96c4c99e":{
                }
            }
        };
        const dummyAsset = {
            "name": "New dummyAsset by The dummyAsset #0002",
            "image": "ipfs://dummyAssetdummyAssetdummyAssetdummyAssetdummyAsset",
            "dummyAsset": "dummyAsset/gif",
            "files": [
                {
                    "dummyAsset": "video/mp4",
                    "src": "ipfs://dummyAssetdummyAssetdummyAssetdummyAsset"
                }
            ],
            "Description": "dummyAsset Airdrop dummyAsset #1",
            "Artist": "dummyAsset Slugs/ The dummyAsset/ Vic"
        };
        for (let i = 0; i < preData.nftName.length; i++) {
            const nftName = preData.nftName[i];
            dummyMetadata['721']["9d53f82c2ee0a83bd724d90dd74109766035204b0d30a82b96c4c99e"][nftName] = dummyAsset;
        }
        return dummyMetadata;
    }

    return (
        <div>
            <section className="sectionStyle">
                <div className="flex flex-row justify-center">
                    <div className="flex flex-row justify-start w-full items-center -mt-6 max-w-screen-lg">
                        <a href="https://www.kairoscore.xyz/"><img src={logo} alt="Logo" target="_blank" className="object-contain mt-5 h-28" /></a>
                        <p className="grow"></p>
                        <div className="hidden md:flex flex-row items-center">
                            <a className="text-white mx-4 hover:text-linkhighlight" href="https://www.kairoscore.xyz/#FAQs-Section">FAQs</a>
                            <a className="text-white mx-4 hover:text-linkhighlight" href="https://www.kairoscore.xyz/#Roadmap-Section">Roadmap</a>
                            <a className="yellowButtonEffect" href="https://twitter.com/kairos_core"><img src={btnTw} alt="Twitter" className="object-contain w-10 mx-2" /></a>
                            <a className="yellowButtonEffect" href="https://discord.com/invite/kairoscore"><img src={btnDc} alt="Discord" className="object-contain w-10 mx-2" /></a>
                            <a className="yellowButtonEffect" href="https://www.instagram.com/kairos_core/"><img src={btnIg} alt="Instagram" className="object-contain w-10 ml-2 mr-10" /></a>
                        </div>
                        <div>
                            <button className={"mr-10 md:hidden p-2 rounded-t" + (mobileNavIsOpen ? "  text-myblue-normal bg-white" : " text-white")} onClick={() => {
                                setMobileNavIsOpen(!mobileNavIsOpen);
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="relative mr-10 ">
                                <div className={"md:hidden flex flex-col items-start absolute anim origin-top right-0 -top-0 rounded-b rounded-tl" + (mobileNavIsOpen ? " bg-white" : " xFlat")}>
                                    <a className="text-myblue-normal mx-4 hover:text-linkhighlight py-2" href="https://www.kairoscore.xyz/#FAQs-Section">FAQs</a>
                                    <a className="text-myblue-normal mx-4 hover:text-linkhighlight py-2" href="https://www.kairoscore.xyz/#Roadmap-Section">Roadmap</a>
                                    <a className="text-myblue-normal mx-4 hover:text-linkhighlight py-2" href="https://twitter.com/kairos_core">Twitter</a>
                                    <a className="text-myblue-normal mx-4 hover:text-linkhighlight py-2" href="https://discord.com/invite/kairoscore">Discord</a>
                                    <a className="text-myblue-normal mx-4 hover:text-linkhighlight py-2" href="https://www.instagram.com/kairos_core/">Instagram</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-full flex flex-col justify-center max-w-screen-lg mx-auto px-5 pb-20">
                    <p style={{ color: "#4DFCC7" }} className="text-3xl font-bold text-center mb-4">Kairos Artist Revelry</p>
                    <p className="text-white mb-5">The <b>Kairos Artist Revelry</b> is an initiative by the <b>Kairos Core</b> to collaborate with different independent artists in order to feature their art and share their vision to the Cardano Community. The community chose to develop a vending machine in order to minimize costs. This vending machine will be used throughout the coming months where Kairos will be featuring a growing list of artists.</p>
                    {/* <p className="text-white mb-3 text-center">{c.VERSION}</p> */}
                    <div className="bg-white/10 p-6 rounded-lg text-white">
                        <div className="h-full w-full flex flex-col">
                            {mainContents()}
                        </div>
                    </div>
                    {getMainButton()}
                </div>
            </section>
        </div>
    );
}