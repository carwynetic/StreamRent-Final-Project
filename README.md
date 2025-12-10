## StreamRent: Decentralized Pay-as-you-go Rental on IOTA

**Project Status:** Completed

-----

## 🌟 Introduction

**StreamRent** is a Decentralized Application (dApp) built on the IOTA Rebased Testnet that demonstrates a **Pay-as-you-go** model for asset rental. This allows users to pay for usage precisely based on duration (charged per millisecond, measured by the on-chain clock). This project showcases IOTA's capability in managing shared, tokenized assets (`Device` objects) and handling continuous micro-transactions (`Coin` transfer) with clear ownership and transparent refund mechanisms.

-----

## ⚙️ Key Technical Features

  * **Move Smart Contract:** Implemented three core functions: `create_device`, `rent_device`, and `return_device`.
  * **Time-Based Billing:** Utilizes the shared `Clock` object (`0x6`) on the network to calculate rental duration and cost.
  * **Deposit & Refund:** Requires a collateral deposit (2 IOTA) upon rental and automatically calculates and refunds the remaining deposit upon return.
  * **Frontend Stack:** Next.js 14 (App Router), TypeScript, and Tailwind CSS.
  * **IOTA Integration:** Uses `@iota/dapp-kit` hooks (`useSignAndExecuteTransaction`, `useCurrentAccount`) for seamless wallet connection and transaction signing.
  * **Design:** Modern, clean "Violet Theme" interface.

-----

## 🏗️ Project Structure

The repository is divided into two main components:

1.  **Smart Contract (`/constract` or `/contract`)**: Contains the Move code.
      * `Move.toml`: Package configuration.
      * `sources/rental.move`: The core contract containing the `Device` object and rental logic.
2.  **Frontend (`/frontend`)**: The Next.js dApp interface.
      * `app/page.tsx`: Main application dashboard logic and UI.
      * `app/Providers.tsx`: Configuration for `IotaProvider` and `QueryClientProvider`.

-----

## 🛠️ Getting Started (Running the Project)

### Prerequisites

  * Node.js (v18+) and npm
  * IOTA CLI (`iota-cli`) installed and configured.
  * A browser extension wallet connected to the **IOTA Rebased Testnet** (e.g., IOTA Wallet).
  * Testnet tokens (IOTA) requested from a Faucet.

### Step 1: Clone Repository and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone https://github.com/your_username/StreamRent-Final-Project.git
cd StreamRent-Final-Project

# Install Frontend dependencies
cd frontend
npm install
```

### Step 2: Build and Deploy the Smart Contract

You must deploy the contract to get the required **Package ID**.

**(Ensure you are in the directory containing `Move.toml` - e.g., `/constract`)**

```bash
# 1. Change directory to the contract folder
cd ../constract # Adjust if your folder name is 'contract'
# 2. Build the Move module
iota move build
# 3. Publish (Deploy) the contract to the IOTA Testnet
iota client publish --gas-budget 100000000
```

**⚠️ IMPORTANT:** After deployment, note the new **Package ID**.

### Step 3: Update Frontend Configuration

1.  Open `frontend/app/page.tsx`.
2.  Update the `PACKAGE_ID` variable (around line 15) with the new ID obtained in Step 2.

<!-- end list -->

```tsx
const PACKAGE_ID = '0x';
```

### Step 4: Run the Application

```bash
# 1. Navigate back to the frontend directory
cd ../frontend
# 2. Start the Next.js development server
npm run dev
```

The application will run on `http://localhost:3000`.

-----

## 🖥️ Demo Walkthrough (How to Test)

The process involves a three-stage transaction flow: **Create**, **Rent (Deposit)**, and **Return (Billing/Refund)**.

1.  **Connect Wallet:** Click **Connect Wallet** in the top right corner.
2.  **Create Device (Owner Area):**
      * Enter **Device Name** (e.g., "Scooter").
      * Enter **Price** (e.g., `6` for \~0.02 IOTA/hour).
      * Click **CREATE NEW DEVICE**.
      * *Check the success message or the **Console (F12)** for the new **Object ID**.*
3.  **Rent Device (Renter Area):**
      * Copy the **Object ID** from the success message/Console.
      * Paste the ID into the **Device ID to Rent/Return** field.
      * Click **RENT DEVICE** and approve the 2 IOTA deposit on your wallet.
4.  **Verify & Return:**
      * Wait \~10 seconds for billing to run.
      * Click **RETURN DEVICE**.
      * The contract calculates the fee, sends the fee to the Owner, and refunds the remainder of the deposit to your wallet.
      * *Check your wallet activity to confirm the refund.*
## Contact Address:
https://explorer.iota.org/object/0x060dfdad55ee41900b199573b6d2f68d2225477774626e1db6921b90abfa81f8?network=testnet
![]()
