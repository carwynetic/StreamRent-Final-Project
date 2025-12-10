'use client';

import { useState } from 'react';
import { 
  ConnectButton, 
  useSignAndExecuteTransaction, 
  useCurrentAccount 
} from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';

// --- CONFIGURATION ---
// Latest Package ID: 0x7552655ef315af56605c7b6139ce217f9bad8847035fcd3da4afca6856de8497
const PACKAGE_ID = '0x7552655ef315af56605c7b6139ce217f9bad8847035fcd3da4afca6856de8497'; 
const MODULE_NAME = 'rental';
// EXPLORER CONFIG: Adjusted to point to the correct network and Object/Transaction
const EXPLORER_BASE_URL = 'https://explorer.rebased.iota.org'; 
const EXPLORER_OBJECT_URL = `${EXPLORER_BASE_URL}/object`;
const EXPLORER_TX_URL = `${EXPLORER_BASE_URL}/txblock`;

// Device Data Type (Still needed for declaration but not for display)
interface DeviceItem {
  id: string; 
  name: string;
  pricePerMs: number;
}

export default function Home() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // States
  const [deviceName, setDeviceName] = useState('');
  const [pricePerMs, setPricePerMs] = useState('');
  const [targetDeviceId, setTargetDeviceId] = useState('');
  
  // No longer tracking myDevices state as the table was removed.

  // Status state
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg: string, txId?: string, objectId?: string }>({
    type: 'idle',
    msg: ''
  });

  // Helper: Flash Message Notification
  const flashMessage = (type: 'success' | 'error', msg: string, txId?: string, objectId?: string) => {
    // Only set objectId if it is a valid hex string (starts with 0x)
    const validObjectId = objectId && objectId.startsWith('0x') ? objectId : undefined;
    setStatus({ type, msg, txId, objectId: validObjectId });
    // Auto-hide messages after 6 seconds
    if (type === 'error' || type === 'success') setTimeout(() => setStatus({ type: 'idle', msg: '' }), 6000);
  };

  // Helper: Calculate IOTA per Hour (still kept for reference if needed)
  const calculatePricePerHour = (pricePerMs: number) => {
    const nanosPerHour = pricePerMs * 3600000;
    const iotaPerHour = nanosPerHour / 1000000000;
    return iotaPerHour.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  // --- SMART CONTRACT LOGIC ---

  const handleCreateDevice = async () => {
    if (!account) return flashMessage('error', '⚠️ Wallet not connected!');
    if (!deviceName || !pricePerMs) return flashMessage('error', '⚠️ Missing input fields!');
    setStatus({ type: 'loading', msg: 'Creating device...' });

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_device`,
        arguments: [tx.pure.string(deviceName), tx.pure.u64(BigInt(pricePerMs))],
      });

      signAndExecuteTransaction(
        { 
          transaction: tx,
          options: { showObjectChanges: true } 
        }, 
        {
          onSuccess: (result) => {
            
            // --- Logic to extract the new Object ID ---
            const createdObject = result.objectChanges?.find(
              (change) => change.type === 'created'
            );
            
            const newId = createdObject?.objectId || "ID Not Found"; 
            
            // Log ID to Console (F12) for easy copy
            if (newId.startsWith("0x")) {
                console.log("-----------------------------------------");
                console.log("🚀 NEW DEVICE CREATED (COPY THIS ID):", newId);
                console.log("-----------------------------------------");
                
                flashMessage('success', `✅ Device "${deviceName}" created successfully!`, result.digest, newId);
            } else {
                flashMessage('success', `✅ Device created! .`, result.digest); 
                console.error("SYNC ERROR: Failed to automatically retrieve ID. Please copy the ID from the Explorer!");
            }
            
            setDeviceName(''); setPricePerMs('');
          },
          onError: (err) => flashMessage('error', `Error: ${err.message}`),
        }
      );
    } catch (e: any) { flashMessage('error', e.message); }
  };

  const handleRentDevice = async () => {
    if (!account) return flashMessage('error', '⚠️ Wallet not connected!');
    if (!targetDeviceId) return flashMessage('error', '⚠️ Device ID is required!');
    setStatus({ type: 'loading', msg: 'Processing rental...' });

    try {
      const tx = new Transaction();
      const DEPOSIT_AMOUNT = 2_000_000_000n; // 2 IOTA
      const [coinPayment] = tx.splitCoins(tx.gas, [tx.pure.u64(DEPOSIT_AMOUNT)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::rent_device`,
        arguments: [tx.object(targetDeviceId), coinPayment, tx.object('0x6')],
      });
      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: (result) => flashMessage('success', '✅ Rent successful! (Billing started)', result.digest),
        onError: (err) => flashMessage('error', `Error: ${err.message}`),
      });
    } catch (e: any) { flashMessage('error', e.message); }
  };

  const handleReturnDevice = async () => {
    if (!account) return flashMessage('error', '⚠️ Wallet not connected!');
    if (!targetDeviceId) return flashMessage('error', '⚠️ Device ID is required!');
    setStatus({ type: 'loading', msg: 'Returning device...' });

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::return_device`,
        arguments: [tx.object(targetDeviceId), tx.object('0x6')],
      });
      signAndExecuteTransaction({ transaction: tx }, {
        onSuccess: (result) => flashMessage('success', '✅ Return successful! (Deposit refunded)', result.digest),
        onError: (err) => flashMessage('error', `Error: ${err.message}`),
      });
    } catch (e: any) { flashMessage('error', e.message); }
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen bg-[#0f0f13] text-gray-200 font-sans selection:bg-violet-500 selection:text-white">
      
      {/* HEADER */}
      <div className="h-48 bg-gradient-to-r from-violet-900 via-purple-800 to-fuchsia-900 flex items-center justify-center relative shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="z-10 text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-white drop-shadow-lg">
            STREAM<span className="font-light opacity-80">RENT</span>
          </h1>
          <p className="text-violet-200 text-sm tracking-widest uppercase">IOTA Rebased Testnet</p>
        </div>
        
        {/* Connect Wallet Button */}
        <div className="absolute top-4 right-4 z-20">
          <ConnectButton className="!bg-black/30 !backdrop-blur-md !border !border-white/10 !text-white hover:!bg-white/10 !transition-all !rounded-lg !px-4 !py-2" />
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-10 relative z-10 max-w-2xl pb-20">
        
        {/* STATUS BAR */}
        {status.type !== 'idle' && (
          <div className={`p-4 rounded-lg border backdrop-blur-md shadow-lg flex justify-between items-center animate-fade-in ${
            status.type === 'error' ? 'bg-red-900/80 border-red-500 text-white' : 
            status.type === 'loading' ? 'bg-blue-900/80 border-blue-500 text-white' : 
            'bg-emerald-900/80 border-emerald-500 text-white'
          } mb-6`}>
            <span className="flex items-center gap-2 font-medium">
              {status.type === 'loading' && <span className="animate-spin">⏳</span>}
              {status.msg}
            </span>
            {status.txId && (
              // Use objectId if available, fallback to txId
              <a 
                href={status.objectId 
                  ? `${EXPLORER_OBJECT_URL}/${status.objectId}?network=testnet` 
                  : `${EXPLORER_TX_URL}/${status.txId}?network=testnet`
                } 
                target="_blank" 
                rel="noreferrer"
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                View on Explorer ↗
              </a>
            )}
          </div>
        )}

        {/* SECTION 1: OWNER (CREATE) */}
        <div className="bg-[#18181b] rounded-xl border border-white/5 shadow-2xl overflow-hidden mb-8">
          <div className="bg-[#202024] px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold text-lg text-violet-400">👑 Owner Area</h2>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">Create Device</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase font-bold">Device Name</label>
                <input 
                  type="text" 
                  placeholder="Ex: E-Bike..." 
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/10 rounded p-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase font-bold">Price (Nanos/ms) - Ex: 6 (0.02 IOTA/h)</label>
                <input 
                  type="number" 
                  placeholder="6" 
                  value={pricePerMs}
                  onChange={(e) => setPricePerMs(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/10 rounded p-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
            <button 
              onClick={handleCreateDevice}
              disabled={status.type === 'loading'}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:opacity-50"
            >
              CREATE NEW DEVICE
            </button>
          </div>
        </div>

        {/* SECTION 2: RENTER (RENT/RETURN) */}
        <div className="bg-[#18181b] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="bg-[#202024] px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold text-lg text-fuchsia-400">👤 Renter Area</h2>
            <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 px-2 py-1 rounded">Rent / Return</span>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase font-bold">
                Device ID to Rent/Return 
                <span className="text-violet-400 italic ml-2"> (Retrieve ID from Console/Success message)</span>
              </label>
              <div className="flex gap-0">
                <div className="bg-[#27272a] flex items-center px-3 rounded-l border border-r-0 border-white/10 text-gray-400">ID</div>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/10 rounded-r p-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleRentDevice}
                disabled={status.type === 'loading'}
                className="bg-fuchsia-700/20 border border-fuchsia-700/50 hover:bg-fuchsia-700 hover:text-white text-fuchsia-300 font-bold py-4 rounded transition-all disabled:opacity-50"
              >
                RENT DEVICE
                <span className="block text-[10px] font-normal opacity-70 mt-1">(Deposit 2 IOTA)</span>
              </button>
              <button 
                onClick={handleReturnDevice}
                disabled={status.type === 'loading'}
                className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 font-bold py-4 rounded transition-all disabled:opacity-50"
              >
                RETURN DEVICE
                <span className="block text-[10px] font-normal opacity-70 mt-1">(Refund Deposit)</span>
              </button>
            </div>
          </div>
        </div>

      </main>
      
      <footer className="text-center text-gray-600 text-xs pb-6">
        <p>IOTA Hackathon 2025 • Designed with Violet Theme</p>
      </footer>
    </div>
  );
}