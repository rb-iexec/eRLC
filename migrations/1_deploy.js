/******************************************************************************
 * Copyright 2020 IEXEC BLOCKCHAIN TECH                                       *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/

// CONFIG
const CONFIG = require('../config/config.json')
// FactoryDeployer
const { TruffleDeployer } = require('../utils/FactoryDeployer')
// Token
var ERLCTokenSwap  = artifacts.require('ERLCTokenSwap')
var ERLCNativeSwap = artifacts.require('ERLCNativeSwap')
var ERLCBridge     = artifacts.require('ERLCBridge')

/*****************************************************************************
 *                                   Main                                    *
 *****************************************************************************/
module.exports = async function(deployer, network, accounts)
{
	console.log('# web3 version:', web3.version);
	const chainid   = await web3.eth.net.getId();
	const chaintype = await web3.eth.net.getNetworkType();
	console.log('Chainid is:', chainid);
	console.log('Chaintype is:', chaintype);
	console.log('Deployer is:', accounts[0]);

	const { token, decimals, softcap } = CONFIG.chains[chainid] || CONFIG.chains.default;
	if (process.env.SALT)
	{
		deployer = new TruffleDeployer(web3, accounts[0], { salt: process.env.SALT });
	}
	if (token)
	{
		await deployer.deploy(ERLCTokenSwap, token, 'iExec eRLC Token', 'eRLC', softcap || 0, [ accounts[0] ], []);
	}
	else
	{
		throw "Native & Bridge options not available yet";
		// await deployer.deploy(ERLCBridge,     'iExec eRLC Token', 'eRLC', decimals, softcap, [ accounts[0] ], []);
		// await deployer.deploy(ERLCNativeSwap, 'iExec eRLC Token', 'eRLC', decimals, softcap, [ accounts[0] ], []);
	}
};
