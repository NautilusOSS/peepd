# Token Transfer CLI

A Command-Line Interface (CLI) tool for transferring tokens on the Algorand blockchain. This script processes a CSV file containing token transfer details and executes transactions on the Algorand network.

## Features

- Reads token transfer details from a CSV file.
- Supports Algorand testnet transactions.
- Provides a dry-run mode for simulating transactions without execution.
- Logs processing results and errors to a specified file.
- Prompts for user confirmation before processing.

## Requirements

- Node.js (>= 14.0.0)
- npm (Node Package Manager)

## Installation

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Create a `.env` File:**

    Create a `.env` file in the root directory of the project and add your Algorand mnemonic and optional configuration. Example:

    ```env
    MN=your-algorand-mnemonic
    ALGOD_TOKEN=your-algod-token
    ALGOD_SERVER=https://testnet-api.voi.nodly.io
    INDEXER_TOKEN=your-indexer-token
    INDEXER_SERVER=https://testnet-idx.voi.nodly.io
    ```

3. **Source cli shell function (optional):**

    Makes `cli` command available in shell environment.

    ```env
    source command.sh # 
    ```

## Usage

Run the CLI script using Node.js:

```bash
node cli.js [options]
```

### Options

```
-f, --file <path>
Path to the CSV file containing token transfer details. Default: infile.csv

-m, --mnemonic <mnemonic>
Algorand mnemonic for the account to use for transactions. If not provided, it will use the value from the .env file.

-t, --algod-token <token>
Algorand algod token. If not provided, it will use the value from the .env file.

-s, --algod-server <server>
Algorand algod server URL. Default: https://testnet-api.voi.nodly.io

-i, --indexer-token <token>
Algorand indexer token. If not provided, it will use the value from the .env file.

-r, --indexer-server <server>
Algorand indexer server URL. Default: https://testnet-idx.voi.nodly.io

-l, --log-file <path>
Path to the log file where results and errors will be recorded. Default: logfile.txt

--dry-run
Simulate the run without executing transactions. This option is used for testing and verification purposes.

Example
To run the script with real transactions:

node cli.js --file transfers.csv --mnemonic your-algorand-mnemonic --log-file transactions.log

node cli.js --file transfers.csv --mnemonic your-algorand-mnemonic --log-file transactions.log --dry-run
```

## How It Works

Prompt for Confirmation:
The script will prompt you to confirm if you want to proceed with processing the CSV file.

Process CSV File:
The script reads the CSV file and processes each transfer record.

Execute or Simulate Transactions:

In regular mode, the script signs and sends transactions to the Algorand network.
In dry-run mode, the script logs the simulated actions without sending transactions.
Log Results:
All actions, successes, and errors are logged to the specified log file.

## Troubleshooting

**Missing .env Configuration:**

Ensure that your .env file contains the required environment variables or provide them via command-line options.

**Permission Errors:**

Make sure you have permission to read the CSV file and write to the log file.

**Network Issues:**

Verify the network URLs and your internet connection.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
If you would like to contribute to this project, please fork the repository and submit a pull request with your changes. For detailed instructions, refer to our CONTRIBUTING guidelines.

## Contact

For questions or support, please open an issue in the repository or contact the project maintainers.



