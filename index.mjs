import fs from "fs";
import csv from "csv-parser";
import { CONTRACT, abi } from "ulujs";
import algosdk from "algosdk";
import BigNumber from "bignumber.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const { MN } = process.env;

const mnemonic = MN || "";

const { addr, sk } = algosdk.mnemonicToSecretKey(mnemonic);

const ALGO_SERVER = "https://testnet-api.voi.nodly.io";
const ALGO_INDEXER_SERVER = "https://testnet-idx.voi.nodly.io";

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || "",
  process.env.ALGOD_SERVER || ALGO_SERVER,
  process.env.ALGOD_PORT || ""
);

const indexerClient = new algosdk.Indexer(
  process.env.INDEXER_TOKEN || "",
  process.env.INDEXER_SERVER || ALGO_INDEXER_SERVER,
  process.env.INDEXER_PORT || ""
);

const signSendAndConfirm = async (txns, sk) => {
  const stxns = txns
    .map((t) => new Uint8Array(Buffer.from(t, "base64")))
    .map(algosdk.decodeUnsignedTransaction)
    .map((t) => algosdk.signTransaction(t, sk));
  await algodClient.sendRawTransaction(stxns.map((txn) => txn.blob)).do();
  return await Promise.all(
    stxns.map((res) => algosdk.waitForConfirmation(algodClient, res.txID, 4))
  );
};

// transfer batch
do {
  // break;
  const results = [];
  fs.createReadStream("infile.csv")
    .pipe(csv())
    .on("data", (data) =>
      results.push({
        tokenId: Number(data.tokenId),
        address: data.address,
        amount: Number(data.amount),
      })
    )
    .on("end", async () => {
      for (const drop of results) {
        const { tokenId, address, amount } = drop;
        console.log({ tokenId, address, amount });
        const accountInfo = await indexerClient.lookupAccountByID(address).do();
        const sig = accountInfo.account["sig-type"];
        if (!sig) {
          console.log("Application skipping...");
          continue;
        }
        const ci = new CONTRACT(
          tokenId,
          algodClient,
          indexerClient,
          abi.nt200,
          {
            addr,
            sk: new Uint8Array(0),
          }
        );
        // TODO figure out all decimals before loop
        const arc200_decimalsR = await ci.arc200_decimals();
        if (!arc200_decimalsR.success) {
          console.error("Failed to get arc200_decimals");
          process.exit(1);
        }
        const arc200_decimals = arc200_decimalsR.returnValue;
        const amountBi = BigInt(
          new BigNumber(amount)
            .times(new BigNumber(10).pow(arc200_decimals))
            .toFixed(0)
        );
        // TODO do group packing
        let arc200_transferR;
        arc200_transferR = await ci.arc200_transfer(address, amountBi);
        if (!arc200_transferR.success) {
          ci.setPaymentAmount(285000);
          arc200_transferR = await ci.arc200_transfer(address, amountBi);
        }
        if (!arc200_transferR.success) {
          console.error("Failed to transfer arc200");
          process.exit(1);
        }
        await signSendAndConfirm(arc200_transferR.txns, sk);
      }
    });
  break;
} while (0); // end transfer batch
