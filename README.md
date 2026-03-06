# Xenom Wallet

Self-custodial web wallet for the Xenom network, built with React + Vite and the Xenom WASM SDK.

## Features

- **Create wallet** — generates a fresh 24-word BIP39 mnemonic, confirms backup, then encrypts it locally
- **Import wallet** — restore from any 12 or 24-word phrase
- **AES-256-GCM encryption** — mnemonic encrypted with PBKDF2-derived key; private key never stored raw
- **Send XEN** — full UTXO coin selection via the WASM SDK, Schnorr signing, broadcast
- **Receive** — address display with QR code
- **Live balance** — polls every 15 s + real-time `utxos-changed` subscription
- **Session history** — tracks received/spent UTXO events in-memory

---

## Setup

### 1. Build the web WASM SDK

The wallet loads the Xenom SDK from `public/sdk/`. You must build it first:

```bash
cd ../wasm
./build-web --sdk
# outputs to: wasm/web/kaspa/kaspa.js + kaspa_bg.wasm
```

### 2. Copy the SDK into the wallet

```bash
cd ../xenom-wallet
npm run copy-sdk
```

### 3. Install dependencies & run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Key paths

| Path | Description |
|---|---|
| `src/sdk.js` | WASM loader, `deriveWallet`, `sendXenom`, unit helpers |
| `src/crypto.js` | AES-GCM encrypt/decrypt mnemonic via Web Crypto API |
| `src/context/WalletContext.jsx` | Global wallet state, RPC connection, balance polling |
| `src/pages/Setup.jsx` | Create / import wallet + mnemonic confirmation flow |
| `src/pages/Unlock.jsx` | Password unlock on returning visits |
| `src/pages/Dashboard.jsx` | Balance card, quick actions, UTXO list |
| `src/pages/Send.jsx` | Send form with fee control |
| `src/pages/Receive.jsx` | Address + QR code |
| `src/pages/History.jsx` | Session UTXO event log |

---

## Derivation

BIP44 path: `m/44'/111111'/0'/0/0` (Kaspa/Xenom coin type 111111)

---

## Security notes

- The mnemonic is encrypted with AES-256-GCM + PBKDF2 (200k iterations, SHA-256)
- The private key is derived in-memory at unlock time and never persisted
- Use a strong password — there is no server-side recovery
- This is an MVP wallet — audit before use with significant funds
