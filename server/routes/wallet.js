
import express from "express";

const router = express.Router();

// Wallet addresses for different networks
const walletAddresses = {
  trc20: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  polygon: "0x742d35Cc6634C0532925a3b8D9C9DaefFabaaE23",
  ton: "UQBvI0aFLnw2QbZzSoUHdjnJ_dXqClXr1z6f9IiW6bppz9zp",
  bep20: "0x742d35Cc6634C0532925a3b8D9C9DaefFabaaE23"
};

// Get wallet address for deposit
router.get("/address/:network", (req, res) => {
  try {
    const { network } = req.params;
    
    if (!walletAddresses[network]) {
      return res.status(400).json({ message: "Unsupported network" });
    }
    
    res.json({ 
      address: walletAddresses[network],
      network: network.toUpperCase()
    });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    res.status(500).json({ message: "Failed to get wallet address" });
  }
});

export default router;
