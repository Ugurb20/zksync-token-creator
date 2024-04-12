import './App.css';
import logo from './assets/logo.svg';
import { useEffect, useState } from 'react';
import Web3 from 'web3';
import data from './data.json';

function App() {
  const [account, setAccount] = useState(null);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [tokenCreated, setTokenCreated] = useState(false);

  const [itokenName, setiTokenName] = useState('');
  const [itokenSymbol, setiTokenSymbol] = useState('');
  const [itotalSupply, setiTotalSupply] = useState('');

  function handleTokenNameChange(event) {
    setiTokenName(event.target.value);
  }

  function handleTokenSymbolChange(event) {
    setiTokenSymbol(event.target.value);
  }

  function handleTotalSupplyChange(event) {
    setiTotalSupply(event.target.value);
  }

  function handleInitialSupplyChange(event) {
    setiInitialSupply(event.target.value);
  }

  const connectWalletHandler = async () => {
    if (account) return;
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const account = accounts[0];
        setAccount(account);
      } catch (error) {
        console.error('Connection to MetaMask failed', error);
      }
    } else {
      console.log('Install MetaMask.');
    }
  };

  const handleTokenAdd = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: 18,
            },
          },
        });
      } catch (error) {
        console.error('Error adding token to MetaMask', error);
      }
    } else {
      console.log('Install MetaMask.');
    }
  };

  const createTokenHandler = async (tokenName, tokenSymbol, tokenSupply) => {
    setTokenCreated(false);
    const web3 = new Web3(window.ethereum);
    const tempContract = new web3.eth.Contract(data.abi, data.contractAddress);

    const deployFee = web3.utils.toWei('0.001', 'ether');

    const estimatedGas = await tempContract.methods
      .deploy(tokenName, tokenSymbol, tokenSupply)
      .estimateGas({ from: account, value: deployFee });

    const gasPrice = await web3.eth.getGasPrice();

    tempContract.methods
      .deploy(tokenName, tokenSymbol, tokenSupply)
      .send({
        from: account,
        value: deployFee,
        gas: estimatedGas, // Use the estimated gas for the transaction
        gasPrice: gasPrice, // Use the fetched gas price
      })
      .on('transactionHash', function (hash) {
        console.log('Transaction Hash: ', hash);
        setTransactionHash(hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        console.log('Confirmation: ', confirmationNumber, receipt);
      })
      .on('receipt', function (receipt) {
        if (receipt.events.TokenCreated) {
          const event = receipt.events.TokenCreated.returnValues;
          setTokenAddress(event.tokenAddress);
          setTokenName(event.name);
          setTokenSymbol(event.symbol);
          setTokenCreated(true);
        }
      })
      .on('error', function (error, receipt) {
        console.error('Error: ', error, receipt);
      });
  };

  return (
    <>
      <div className="header">
        <div className="logo">
          <img src={logo} alt="Token Creator Logo" />
          <p>ZK-Sync Token Creator</p>
        </div>
        <button className="connect-btn" onClick={connectWalletHandler}>
          {account
            ? `Connected: ${account.substring(0, 6)}...${account.substring(
                account.length - 4,
              )}`
            : 'Connect Wallet'}
        </button>
      </div>

      <div className="form-wrapper">
        <h1>Create and Mint your Own Token</h1>
        <input
          type="text"
          placeholder="Token Name"
          value={itokenName}
          onChange={handleTokenNameChange}
        />
        <input
          type="text"
          placeholder="Token Symbol"
          value={itokenSymbol}
          onChange={handleTokenSymbolChange}
        />
        <input
          type="number"
          placeholder="Total Supply"
          value={itotalSupply}
          onChange={handleTotalSupplyChange}
        />
        <button
          onClick={() => {
            createTokenHandler(itokenName, itokenSymbol, itotalSupply);
          }}
        >
          Create and Mint Token
        </button>
        {tokenCreated && (
          <button
            onClick={handleTokenAdd}
            style={{ marginTop: '20px', background: '#7F00FF' }}
          >
            Click to add your token to Wallet
          </button>
        )}
      </div>

      <div className="token-details-wrapper">
        {tokenCreated && (
          <div className="token-details">
            <h2>Token Details</h2>
            <p>Token Name: {tokenName}</p>
            <p>Token Symbol: {tokenSymbol}</p>
            <p>Token Address: {tokenAddress}</p>
            <p>Transaction Hash: {transactionHash}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
