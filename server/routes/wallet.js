
import express from "express";

const router = express.Router();

// Wallet addresses for different networks
const walletAddresses = {
  trc20: "TWZHqkbbYTnehQ2TxnH4NgNt4crGLNy8Ns",
  polygon: "0xE1D4b2BEC237AEDDB47da56b82b2f15812e45B44",
  ton: "EQAj7vKLbaWjaNbAuAKP1e1HwmdYZ2vJ2xtWU8qq3JafkfxF",
  bep20: "0xE1D4b2BEC237AEDDB47da56b82b2f15812e45B44"
};

// Get wallet address for network
router.get("/", async (req, res) => {
  try {
    const network = req.query.network;
    const address = walletAddresses[network];

    if (!address) {
      return res.status(404).json({ message: "Network not supported" });
    }

    res.json({ address });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    res.status(500).json({ message: "Failed to get wallet address" });
  }
});

export default router;
