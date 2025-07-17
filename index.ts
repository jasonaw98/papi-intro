import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { createClient, type PolkadotClient, type SS58String } from 'polkadot-api';
import { dot, people, collectives } from '@polkadot-api/descriptors';

function makeClient(endpoint: string): PolkadotClient {
  console.log(`Connecting to endpoint: ${endpoint}`);
  const provider = getWsProvider(endpoint);
  const client = createClient(provider);
  return client;
}

async function printChainInfo(client: PolkadotClient) {
  const chainSpec = await client.getChainSpecData();
  const finalizedBlock = await client.getFinalizedBlock();
  console.log(`Connected to ${chainSpec.name} at block ${finalizedBlock.number}.\n`);
}

async function getBalance(polkadotClient: PolkadotClient, address: SS58String): Promise<BigInt> {
  const dotApi = polkadotClient.getTypedApi(dot);
  const accountInfo = await dotApi.query.System.Account.getValue(address);
  const { free, reserved } = accountInfo.data;
  return free + reserved;
}

async function getDisplayName(
  polkadotClient: PolkadotClient,
  address: SS58String
): Promise<string | undefined> {
  const peopleApi = polkadotClient.getTypedApi(people);
  const accountInfo = await peopleApi.query.Identity.IdentityOf.getValue(address);
  const displayName = accountInfo?.info.display.value?.asText();
  return displayName;
}

interface FelloshipMember {
  address: SS58String;
  rank: number;
}

async function getFelloshipMembers(polkadotClient: PolkadotClient): Promise<FelloshipMember[]> {
  const collectivesApi = polkadotClient.getTypedApi(collectives);
  const rawMembers = await collectivesApi.query.FellowshipCollective.Members.getEntries();
  const fellowshipMembers = rawMembers.map((m) => ({ address: m.keyArgs[0], rank: m.value }));
  return fellowshipMembers;
}

async function main() {
  const polkadotClient = makeClient('wss://rpc.polkadot.io');
  await printChainInfo(polkadotClient);

  const peopleClient = makeClient('wss://polkadot-people-rpc.polkadot.io');
  await printChainInfo(peopleClient);

  const collectivesClient = makeClient('wss://polkadot-collectives-rpc.polkadot.io');
  await printChainInfo(collectivesClient);

  const members = await getFelloshipMembers(collectivesClient);
  const table = []
  for (const member of members) {
    const displayName = await getDisplayName(peopleClient, member.address);
     const balance = await getBalance(polkadotClient, member.address);
    table.push({
      address: member.address,
      rank: member.rank,
      displayName,
      balance,
    })
  }
  table.sort((a, b) => b.rank - a.rank);
  console.table(table);

  const address = process.env.ADDRESS as SS58String;
  const balance = await getBalance(polkadotClient, address);
  const displayName = await getDisplayName(peopleClient, address);
  console.log(`The Balance of Name: ${displayName} Address: ${address} is: ${balance}`);
  console.log(`Done!`);
  process.exit(0);
}

main();
