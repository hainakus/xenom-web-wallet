let _sdk = null;
let _initPromise = null;

export async function initSDK() {
  if (_sdk) return _sdk;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const sdkUrl = `${location.origin}/sdk/kaspa.js`;
      const kaspa = await import(/* @vite-ignore */ sdkUrl);
      await kaspa.default();
      _sdk = kaspa;
      return kaspa;
    } catch (error) {
      _initPromise = null;
      throw error;
    }
  })();

  return _initPromise;
}

export function getSDK() {
  return _sdk;
}

export const NETWORK_ID = 'mainnet';
export const DERIVATION_PATH = "m/44'/111111'/0'/0/0";
export const SOMPI_PER_XENOM = 100_000_000n;
export const CONSOLIDATION_BATCH_SIZE = 80;

export function sompiToXenom(sompi) {
  const s = BigInt(sompi);
  const whole = s / SOMPI_PER_XENOM;
  const frac = s % SOMPI_PER_XENOM;
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export function xenomToSompi(xenom) {
  const [whole, frac = ''] = String(xenom).split('.');
  const fracPadded = frac.padEnd(8, '0').slice(0, 8);
  return BigInt(whole) * SOMPI_PER_XENOM + BigInt(fracPadded);
}

export function deriveWallet(kaspa, mnemonic) {
  const mn = new kaspa.Mnemonic(mnemonic);
  const seed = mn.toSeed('');
  const xprv = new kaspa.XPrv(seed);
  const child = xprv.derivePath(DERIVATION_PATH);
  const privateKey = child.toPrivateKey();
  const address = privateKey.toPublicKey().toAddress(NETWORK_ID).toString();
  const privateKeyHex = privateKey.toString();
  return { address, privateKeyHex };
}

function chunkConsolidationEntries(entries, batchSize = CONSOLIDATION_BATCH_SIZE) {
  const chunks = [];
  let index = 0;

  while (index < entries.length) {
    const remaining = entries.length - index;
    let size = Math.min(batchSize, remaining);

    if (remaining > batchSize && remaining - size === 1) {
      size -= 1;
    }

    if (size < 2) {
      if (chunks.length === 0) return [entries];
      chunks[chunks.length - 1].push(...entries.slice(index));
      break;
    }

    chunks.push(entries.slice(index, index + size));
    index += size;
  }

  return chunks;
}

async function submitConsolidationBatch(kaspa, rpc, privateKeyHex, address, entries) {
  try {
    const privateKey = new kaspa.PrivateKey(privateKeyHex);

    const { transactions, summary } = await kaspa.createTransactions({
      entries,
      changeAddress: address,
      networkId: NETWORK_ID,
    });

    const txids = [];
    for (const pendingTx of transactions) {
      pendingTx.sign([privateKey]);
      const txid = await pendingTx.submit(rpc);
      txids.push(txid);
    }

    return { txids, fees: summary?.fees ?? 0n };
  } catch (e) {
    console.error('[submitConsolidationBatch error]', e);
    throw new Error(String(e));
  }
}

export async function consolidateUtxos(kaspa, rpc, privateKeyHex, address, sourceEntries, batchSize = CONSOLIDATION_BATCH_SIZE) {
  try {
    const entries = sourceEntries ?? (await rpc.getUtxosByAddresses([address])).entries;
    if (!entries || entries.length < 2) return { txids: [], fees: 0n, batches: 0, consolidated: 0 };

    const txids = [];
    let fees = 0n;
    const batches = chunkConsolidationEntries(entries, batchSize);

    for (const batch of batches) {
      if (batch.length < 2) continue;
      const result = await submitConsolidationBatch(kaspa, rpc, privateKeyHex, address, batch);
      txids.push(...result.txids);
      fees += BigInt(result.fees ?? 0n);
    }

    return {
      txids,
      fees,
      batches: batches.filter(batch => batch.length >= 2).length,
      consolidated: entries.length,
    };
  } catch (e) {
    console.error('[consolidateUtxos error]', e);
    throw new Error(String(e));
  }
}

export async function sendXenom(kaspa, rpc, privateKeyHex, fromAddr, toAddr, amountXenom, feeSompi = 0n) {
  try {
    const privateKey = new kaspa.PrivateKey(privateKeyHex);
    const amountSompi = xenomToSompi(amountXenom);

    // Pass array directly (not { addresses: [...] })
    const { entries } = await rpc.getUtxosByAddresses([fromAddr]);
    if (!entries || entries.length === 0) throw 'No UTXOs available — check balance and connection';

    const { transactions, summary } = await kaspa.createTransactions({
      entries,
      outputs: [{ address: toAddr, amount: amountSompi }],
      changeAddress: fromAddr,
      priorityFee: feeSompi,
      networkId: NETWORK_ID,
    });

    const txids = [];
    for (const pendingTx of transactions) {
      pendingTx.sign([privateKey]);            // synchronous
      const txid = await pendingTx.submit(rpc);
      txids.push(txid);
    }

    return { txids, fees: summary.fees };
  } catch (e) {
    console.error('[sendXenom error]', e);
    // WASM throws strings; normalise to an Error so callers get .message
    throw new Error(String(e));
  }
}
