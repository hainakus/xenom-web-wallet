let _sdk = null;
let _initPromise = null;

export async function initSDK() {
  if (_sdk) return _sdk;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Use a computed URL — Vite 5 blocks static string imports from public/
    const sdkUrl = `${location.origin}/sdk/kaspa.js`;
    const kaspa = await import(/* @vite-ignore */ sdkUrl);
    await kaspa.default('/sdk/kaspa_bg.wasm');
    _sdk = kaspa;
    return kaspa;
  })();

  return _initPromise;
}

export function getSDK() {
  return _sdk;
}

export const NETWORK_ID = 'mainnet';
export const DERIVATION_PATH = "m/44'/111111'/0'/0/0";
export const SOMPI_PER_XENOM = 100_000_000n;

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
