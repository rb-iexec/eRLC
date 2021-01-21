import * as _ from 'lodash';
import { Provider                            } from '@ethersproject/abstract-provider';
import { Signer                              } from '@ethersproject/abstract-signer';
import { Contract                            } from '@ethersproject/contracts';
import { LedgerSigner                        } from '@ethersproject/hardware-wallets';
import { isValidMnemonic, defaultPath        } from '@ethersproject/hdnode';
import { getDefaultProvider                  } from '@ethersproject/providers';
import { Wallet                              } from '@ethersproject/wallet';
import { createInterface                     } from 'readline';
import yargs                                   from 'yargs';

const { abi } = require('../build/contracts/KYC.json');

(async () => {
	const argv = yargs
		.option('network', {
			type:        'string',
			describe:    'select blockchain to connect to by name or endpoint',
			default:     process.env.CHAIN ?? 'mainnet',
		})
		.option('address', {
			type:        'string',
			describe:    'select whitelist contract to operate on contract (hex or ENS address)',
			default:     process.env.PROXY ?? 'erlc.iexec.eth',
		})
		.option('ledger', {
			type:        'boolean',
			describe:    'Use a ledger hardware provider to sign transaction',
			conflicts:   [ 'mnemonic', 'privatekey' ],
		})
		.option('mnemonic', {
			type:        'string',
			describe:    'Use a mnemonic to sign transaction',
			requiresArg: true,
			coerce:    mn => {
				if (!isValidMnemonic(mn)) throw new Error('invalid mnemonic format');
				return mn;
			},
			conflicts:   [ 'ledger', 'privatekey' ],
		})
		.option('privatekey', {
			type:        'string',
			describe:    'Use a privatekey to sign transaction',
			requiresArg: true,
			conflicts:   [ 'ledger', 'mnemonic' ],
		})
		.option('path', {
			type:        'string',
			describe:    'HD path to use when connecting with a ledger or a mnemonic',
			default:     defaultPath,
		})
		.help()
		.argv;

	let provider : Provider = getDefaultProvider(argv.network);
	let wallet   : Signer;

	if (argv.ledger) {
		wallet = new LedgerSigner(provider, 'hid', argv.path);
	} else if (argv.mnemonic) {
		wallet = Wallet.fromMnemonic(argv.mnemonic, argv.path).connect(provider);
	} else if (argv.privatekey) {
		wallet = new Wallet(argv.privatekey, provider);
	} else {
		console.error('Error: no connection mechanism specified');
		process.exit(1);
	}

	let contract = new Contract(argv.address, abi, wallet);
	let entries  = new Array();

	createInterface({
		input:    process.stdin,
		output:   process.stdout,
		terminal: false,
	})
	.on('line', (entry) => {
		entries.push(entry);
	})
	.on('close', () => {
		_.chunk(entries, 32).reduce(
			(promise, chunk, i, { length }) => new Promise((resolve, reject) => {
				Promise.resolve(promise)
				.then(() => {
					console.log(`Processing chunk ${i+1}/${length} ...`);
					console.log(chunk);
					contract.grantKYC(chunk)
					.then(({ wait }) => wait().then(resolve).catch(reject))
					.catch(reject)
				})
				.catch(reject);
			}),
			Promise.resolve(null)
		).then(() => console.log(`Processed ${entries.length} addresses`));
	});

})().catch(console.error);
