import fs from "fs";
import csv from "csv-parser";
import { CONTRACT, abi } from "ulujs";
import algosdk from "algosdk";
import BigNumber from "bignumber.js";
import * as dotenv from "dotenv";
import { Command } from "commander";

dotenv.config({ path: ".env" });

const program = new Command();

// Define CLI options and arguments
program
  .option("-f, --file <path>", "CSV file to process", "infile.csv")
  .option("-m, --mnemonic <mnemonic>", "Algorand mnemonic")
  .option("-t, --algod-token <token>", "Algorand algod token", "")
  .option(
    "-s, --algod-server <server>",
    "Algorand algod server",
    "https://testnet-api.voi.nodly.io"
  )
  .option("-i, --indexer-token <token>", "Algorand indexer token", "")
  .option(
    "-r, --indexer-server <server>",
    "Algorand indexer server",
    "https://testnet-idx.voi.nodly.io"
  )
  .option("-l, --log-file <path>", "File to log results", "logfile.txt");

program.parse(process.argv);

const options = program.opts();

console.log(options);

const mnemonic = options.mnemonic || process.env.MN || "";
const { addr, sk } = algosdk.mnemonicToSecretKey(mnemonic);

const algodClient = new algosdk.Algodv2(
  options.algodToken,
  options.algodServer,
  process.env.ALGOD_PORT || ""
);

const indexerClient = new algosdk.Indexer(
  options.indexerToken,
  options.indexerServer,
  process.env.INDEXER_PORT || ""
);

const logMessage = (message) => {
  fs.appendFileSync(
    options.logFile,
    `${new Date().toISOString()} - ${message}\n`
  );
};

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

const processFile = async (filePath) => {
  const results = [];
  fs.createReadStream(filePath)
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
        let arc200_transferR;
        arc200_transferR = await ci.arc200_transfer(address, amountBi);
        if (!arc200_transferR.success) {
          ci.setPaymentAmount(285000);
          arc200_transferR = await ci.arc200_transfer(address, amountBi);
        }
        if (!arc200_transferR.success) {
          console.error("Failed to transfer arc200");
          logMessage(
            `Error processing tokenId ${drop.tokenId} for address ${address}: ${error.message}`
          );
          process.exit(1);
        }
        await signSendAndConfirm(arc200_transferR.txns, sk);
        logMessage(
          `Successfully processed tokenId ${tokenId} for address ${address}`
        );
      }
    });
};

processFile(options.file);
