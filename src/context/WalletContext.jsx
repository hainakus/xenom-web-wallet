import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import { initSDK, sompiToXenom, NETWORK_ID } from '../sdk.js';

const WalletContext = createContext(null);
const DEFAULT_NODE_URL = 'wss://wallet.xenom.space/wrpc/';

const initialState = {
  sdkReady: false,
  address: null,
  privateKeyHex: null,
  balance: '0',
  pendingBalance: '0',
  utxos: [],
  txHistory: [],
  rpc: null,
  connected: false,
  dagHeight: null,
  networkId: NETWORK_ID,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SDK_READY':
      return { ...state, sdkReady: true };
    case 'SET_WALLET':
      return { ...state, address: action.address, privateKeyHex: action.privateKeyHex };
    case 'SET_RPC':
      return { ...state, rpc: action.rpc };
    case 'SET_CONNECTED':
      return { ...state, connected: action.connected };
    case 'SET_DAG_HEIGHT':
      return { ...state, dagHeight: action.height };
    case 'SET_BALANCE':
      return { ...state, balance: action.balance, pendingBalance: action.pending };
    case 'SET_UTXOS':
      return { ...state, utxos: action.utxos };
    case 'ADD_TX': {
      const exists = state.txHistory.find(t => t.id === action.tx.id);
      if (exists) return state;
      return { ...state, txHistory: [action.tx, ...state.txHistory].slice(0, 100) };
    }
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...initialState, sdkReady: state.sdkReady };
    default:
      return state;
  }
}

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const kaspaRef = useRef(null);
  const pollRef = useRef(null);
  const subscribed = useRef(false);

  const ensureSDK = useCallback(async () => {
    if (kaspaRef.current) return kaspaRef.current;
    try {
      const kaspa = await initSDK();
      kaspaRef.current = kaspa;
      dispatch({ type: 'SDK_READY' });
      dispatch({ type: 'CLEAR_ERROR' });
      return kaspa;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to load SDK: ${err.message}. Run: npm run copy-sdk` });
      throw err;
    }
  }, []);

  const connect = useCallback(async (_url) => {
    const kaspa = await ensureSDK();
    if (!kaspa) return;

    try {
      if (state.rpc) {
        try { await state.rpc.disconnect(); } catch {}
      }
      const targetUrl = DEFAULT_NODE_URL;
      const rpc = new kaspa.RpcClient({
        url: targetUrl,
        encoding: kaspa.Encoding.Borsh,
        networkId: NETWORK_ID,
      });
      rpc.addEventListener('connect', () => dispatch({ type: 'SET_CONNECTED', connected: true }));
      rpc.addEventListener('disconnect', () => dispatch({ type: 'SET_CONNECTED', connected: false }));
      await rpc.connect();
      dispatch({ type: 'SET_RPC', rpc });
      try {
        const info = await rpc.getServerInfo();
        if (info?.virtualDaaScore) dispatch({ type: 'SET_DAG_HEIGHT', height: info.virtualDaaScore.toString() });
      } catch {}
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Connection failed: ${String(err)}` });
    }
  }, [state.rpc]);

  const refreshBalance = useCallback(async () => {
    if (!state.rpc || !state.address || !state.connected) return;
    try {
      const bal = await state.rpc.getBalanceByAddress({ address: state.address });
      dispatch({
        type: 'SET_BALANCE',
        balance: sompiToXenom(bal.balance ?? 0n),
        pending: sompiToXenom(bal.pendingBalance ?? 0n),
      });
      const { entries } = await state.rpc.getUtxosByAddresses([state.address]);
      dispatch({ type: 'SET_UTXOS', utxos: entries ?? [] });
    } catch {}
  }, [state.rpc, state.address, state.connected]);

  const fetchInitialHistory = useCallback(async () => {
    if (!state.rpc || !state.address || !state.connected) return;
    try {
      const { entries } = await state.rpc.getUtxosByAddresses([state.address]);
      if (!entries || entries.length === 0) return;

      // Sort newest first by blockDaaScore, take top 10
      const sorted = [...entries].sort((a, b) =>
        b.blockDaaScore > a.blockDaaScore ? 1 : b.blockDaaScore < a.blockDaaScore ? -1 : 0
      ).slice(0, 10);

      // Estimate real timestamps from DAA scores
      const daaScores = sorted.map(u => u.blockDaaScore);
      let timestamps;
      try {
        const res = await state.rpc.getDaaScoreTimestampEstimate({ daaScores });
        timestamps = res.timestamps;
      } catch {
        timestamps = sorted.map(() => BigInt(Date.now()));
      }

      sorted.forEach((u, i) => {
        dispatch({
          type: 'ADD_TX',
          tx: {
            id: u.outpoint?.transactionId ?? Math.random().toString(),
            type: 'received',
            amount: sompiToXenom(u.amount ?? 0n),
            timestamp: Number(timestamps[i] ?? BigInt(Date.now())),
          },
        });
      });
    } catch {}
  }, [state.rpc, state.address, state.connected]);

  const subscribeUtxos = useCallback(async () => {
    if (!state.rpc || !state.address || subscribed.current) return;
    subscribed.current = true;
    try {
      state.rpc.addEventListener('utxos-changed', (e) => {
        const added = e.data?.added ?? [];
        const removed = e.data?.removed ?? [];

        added.forEach(u => {
          dispatch({
            type: 'ADD_TX',
            tx: {
              id: u.outpoint?.transactionId ?? Math.random().toString(),
              type: 'received',
              amount: sompiToXenom(u.amount ?? 0n),
              timestamp: Date.now(),
            },
          });
        });
        removed.forEach(u => {
          dispatch({
            type: 'ADD_TX',
            tx: {
              id: 'spent-' + (u.outpoint?.transactionId ?? Math.random().toString()),
              type: 'sent',
              amount: sompiToXenom(u.amount ?? 0n),
              timestamp: Date.now(),
            },
          });
        });
        refreshBalance();
      });
      await state.rpc.subscribeUtxosChanged([state.address]);
    } catch {}
  }, [state.rpc, state.address, refreshBalance]);

  useEffect(() => {
    if (state.connected && state.address) {
      refreshBalance();
      fetchInitialHistory();
      subscribeUtxos();
      pollRef.current = setInterval(refreshBalance, 15_000);
    }
    return () => clearInterval(pollRef.current);
  }, [state.connected, state.address]);

  const unlock = useCallback((address, privateKeyHex) => {
    subscribed.current = false;
    dispatch({ type: 'SET_WALLET', address, privateKeyHex });
  }, []);

  const logout = useCallback(async () => {
    clearInterval(pollRef.current);
    subscribed.current = false;
    if (state.rpc) {
      try { await state.rpc.disconnect(); } catch {}
    }
    dispatch({ type: 'LOGOUT' });
  }, [state.rpc]);

  const value = {
    ...state,
    kaspa: kaspaRef.current,
    ensureSDK,
    connect,
    unlock,
    logout,
    refreshBalance,
    dispatch,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
