import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { createClient, type PolkadotClient, type SS58String } from 'polkadot-api';
import { dot, people } from '@polkadot-api/descriptors';

function makeClient(endpoint: string): PolkadotClient {
  console.log(`Connecting to endpoint: ${endpoint}`);
  const provider = getWsProvider(endpoint);
  const client = createClient(provider);
  return client;
}

async function printChainInfo(client: PolkadotClient) {
  const chainSpec = await client.getChainSpecData();
  const finalizedBlock = await client.getFinalizedBlock();
  console.log(chainSpec);
  console.log(`Connected to ${chainSpec.name} at block ${finalizedBlock.number}.\n`);
}

async function getBalance(polkadotClient: PolkadotClient, address: SS58String): Promise<BigInt> {
  const dotApi = polkadotClient.getTypedApi(dot);
  const accountInfo = await dotApi.query.System.Account.getValue(address);
  const { free, reserved } = accountInfo.data;
  return free + reserved;
}

async function getDisplayName(polkadotClient: PolkadotClient, address: SS58String): Promise<string | undefined> {
  const peopleApi = polkadotClient.getTypedApi(people);
  const accountInfo = await peopleApi.query.Identity.IdentityOf.getValue(address);
  const displayName = accountInfo?.info.display.value?.toString();
  return displayName
}

async function main() {
  const polkadotClient = makeClient("wss://rpc.polkadot.io");
  await printChainInfo(polkadotClient);

  const peopleClient = makeClient("wss://polkadot-people-rpc.polkadot.io");
  await printChainInfo(peopleClient);

  const address = process.env.ADDRESS as SS58String;
  const balance = await getBalance(polkadotClient, address);
  const displayName = await getDisplayName(peopleClient, address);
  console.log(`Address: ${address}`);
  console.log(`Balance: ${balance}`);
  console.log(`DisplayName: ${displayName}`);
  console.log(`Done!`);
  process.exit(0);
}

main();
