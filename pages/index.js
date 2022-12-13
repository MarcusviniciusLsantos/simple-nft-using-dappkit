import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";
import { Erc721Standard, Web3Connection } from "@taikai/dappkit";

export default function Home() {
  const [web3Host, setWeb3Host] = useState("http://localhost:8545");
  const [privateKey, setPrivateKey] = useState("");
  const [web3Connection, setWeb3Connection] = useState(null);
  const [contractAddress, setContractAddress] = useState("");
  const [validToken, setValidToken] = useState({
    name: "",
    symbol: "",
  });
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [nft, setNft] = useState();
  const [nftList, setNftList] = useState([]);
  const [tokenId, setTokenId] = useState(1);

  async function connect() {
    const _web3Connection = new Web3Connection({ web3Host, privateKey });
    _web3Connection.start();
    if (!_web3Connection.options.privateKey) await _web3Connection.connect();
    setAddress(await _web3Connection.getAddress());
    setWeb3Connection(_web3Connection);
  }

  async function deploy() {
    const temp_nft = new Erc721Standard(web3Connection);
    temp_nft.loadAbi();
    const tx = await (
      await temp_nft.deployJsonAbi(name, symbol)
    ).contractAddress;
    setContractAddress(tx);
    const nft = new Erc721Standard(web3Connection, tx);
    const name = await nft.callTx(await nft.contract.methods.name());
    const symbol = await nft.callTx(await nft.contract.methods.symbol());
    setValidToken({ name, symbol });
  }

  async function baseURI() {
    const nft = new Erc721Standard(web3Connection, contractAddress);
    await nft.loadContract();
    await nft.setBaseURI(uri).then((res) => console.log("response", res));
    console.log("baseURI", contractAddress);
  }

  async function mint() {
    const nft2 = new Erc721Standard(web3Connection, contractAddress);
    await nft2.loadContract();
    await nft2.setTokenURI(tokenId, uri);
    setTokenId(tokenId + 1);

  }

  async function validateContractAddress() {
    const nft = new Erc721Standard(web3Connection, contractAddress);
    await nft.loadContract();

    const name = await nft.callTx(await nft.contract.methods.name());
    const symbol = await nft.callTx(await nft.contract.methods.symbol());
    console.log("data", symbol, name);
    setValidToken({ name, symbol });
  }

  useEffect(getNfts, [validToken]);

  async function getNfts() {
    if (!contractAddress && !web3Connection) return;

    const nft = new Erc721Standard(web3Connection, contractAddress);
    await nft.loadContract();

    const balance = await nft.callTx(nft.contract.methods.balanceOf(address));
    console.log("balance", balance);
    const nftsList = await Promise.all(
      Array.from({ length: balance }, (_, i) => i + 1).map(async (_, key) => {
        console.log(key);
        const token = await nft.callTx(
          nft.contract.methods.tokenOfOwnerByIndex(address, key)
        );
        const tokenURI = await nft.callTx(nft.contract.methods.tokenURI(token));
        return { tokenId: token, uri: tokenURI };
      })
    );
    setNftList(nftsList);
    console.log("nftsList", nftsList);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>@taikai/dappkit</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Connect your wallet</h1>

        <div className={styles.simpleCard}>
          <input
            placeholder="Web3 RPC"
            onChange={(e) => setWeb3Host(e.target.value)}
            value={web3Host}
          />
          <input placeholder="Private Key" onChange={(e) => setPrivateKey(e.target.value)}/>
          <button onClick={() => connect()}>connect</button>
        </div>
        {(web3Connection && address && (
          <div className={styles.grid}>
            <div
              href="https://docs.dappkit.dev/"
              target="_blank"
              className={styles.card}
            >
              <h3>Connected address &rarr;</h3>
              <p>{address}</p>
            </div>
          </div>
        )) ||
          ""}

        <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Symbol"
          onChange={(e) => setSymbol(e.target.value)}
        />
        <button onClick={deploy}>Deploy</button>
        {nft && (
          <>
            <input
              placeholder="baseURI"
              onChange={(e) => setUri(e.target.value)}
            />
            <button onClick={baseURI}>BASEURI</button>
          </>
        )}

        {nft && <button onClick={mint}>mint</button>}
        <h3>OR</h3>
        <input
          placeholder="Import contract address"
          onChange={(e) => setContractAddress(e.target.value)}
        />
        <button onClick={validateContractAddress}>Import</button>
        {validToken.name && validToken.symbol && (
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>Current Token</h3>
              <div>
                Name&rarr;<b>{validToken.name}</b>
              </div>
              <div>
                Symbol&rarr;<b>{validToken.symbol}</b>
              </div>
            </div>
          </div>
        )}

        {nftList.length > 0 && (
          <div className={styles.simpleCard}>
            <h3>NFT list</h3>
            <div style={{ display: "flex" }}>
              {nftList?.map(({ tokenId, uri }, key) => (
                <div className={styles.card} key={key}>
                  <h4>NFT</h4>
                  <div>
                    tokenID&rarr;<b>{tokenId}</b>
                  </div>
                  {uri ? (
                    <div>
                      URI&rarr;<b>{uri}</b>
                    </div>
                  ) : (
                    <div>
                      URI&rarr;<b>not found</b>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
