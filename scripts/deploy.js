// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting Polygon Warriors deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Details:");
  console.log("   Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("   Deployer:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "MATIC");
  
  if (balance === 0n) {
    throw new Error("❌ Deployer account has no funds!");
  }

  console.log("\n" + "=".repeat(50));

  // 1. Deploy WarriorToken (ERC20)
  console.log("\n1️⃣ Deploying WarriorToken (WGOLD)...");
  const WarriorToken = await ethers.getContractFactory("WarriorToken");
  const warriorToken = await WarriorToken.deploy();
  await warriorToken.waitForDeployment();
  const tokenAddress = await warriorToken.getAddress();
  
  console.log("   ✅ WarriorToken deployed to:", tokenAddress);
  console.log("   📄 Transaction hash:", warriorToken.deploymentTransaction().hash);

  // 2. Deploy WarriorNFT (ERC721)
  console.log("\n2️⃣ Deploying WarriorNFT...");
  const baseURI = process.env.NFT_BASE_URI || "https://api.polygonwarriors.com/metadata/";
  const WarriorNFT = await ethers.getContractFactory("WarriorNFT");
  const warriorNFT = await WarriorNFT.deploy(baseURI);
  await warriorNFT.waitForDeployment();
  const nftAddress = await warriorNFT.getAddress();
  
  console.log("   ✅ WarriorNFT deployed to:", nftAddress);
  console.log("   📄 Transaction hash:", warriorNFT.deploymentTransaction().hash);
  console.log("   🖼️ Base URI:", baseURI);

  // 3. Deploy Main Game Contract
  console.log("\n3️⃣ Deploying PolygonWarriorsGame...");
  const PolygonWarriorsGame = await ethers.getContractFactory("PolygonWarriorsGame");
  const game = await PolygonWarriorsGame.deploy(tokenAddress, nftAddress);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  
  console.log("   ✅ PolygonWarriorsGame deployed to:", gameAddress);
  console.log("   📄 Transaction hash:", game.deploymentTransaction().hash);

  // 4. Setup Permissions
  console.log("\n4️⃣ Setting up permissions...");
  
  // Grant minting permissions to game contract
  console.log("   🔑 Transferring token ownership to game contract...");
  const transferOwnershipTx = await warriorToken.transferOwnership(gameAddress);
  await transferOwnershipTx.wait();
  console.log("   ✅ Token ownership transferred");

  // 5. Verify deployments
  console.log("\n5️⃣ Verifying deployments...");
  
  // Check token supply
  const totalSupply = await warriorToken.totalSupply();
  console.log("   💰 Initial token supply:", ethers.formatEther(totalSupply), "WGOLD");
  
  // Check NFT mint price
  const mintPrice = await warriorNFT.mintPrice();
  console.log("   💎 NFT mint price:", ethers.formatEther(mintPrice), "MATIC");
  
  // Check game configuration
  const battleCooldown = await game.battleCooldown();
  console.log("   ⏰ Battle cooldown:", battleCooldown.toString(), "seconds");

  // 6. Create deployment summary
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
      rpcUrl: network.chainId === 80002n ? "https://rpc-amoy.polygon.technology/" : "https://polygon-rpc.com/",
      explorer: network.chainId === 80002n ? "https://amoy.polygonscan.com/" : "https://polygonscan.com/"
    },
    contracts: {
      WarriorToken: {
        address: tokenAddress,
        name: "Warrior Gold",
        symbol: "WGOLD",
        totalSupply: ethers.formatEther(totalSupply),
        explorerUrl: `${network.chainId === 80002n ? "https://amoy.polygonscan.com/" : "https://polygonscan.com/"}address/${tokenAddress}`
      },
      WarriorNFT: {
        address: nftAddress,
        name: "Polygon Warriors",
        symbol: "PWAR",
        baseURI: baseURI,
        mintPrice: ethers.formatEther(mintPrice),
        explorerUrl: `${network.chainId === 80002n ? "https://amoy.polygonscan.com/" : "https://polygonscan.com/"}address/${nftAddress}`
      },
      PolygonWarriorsGame: {
        address: gameAddress,
        battleCooldown: battleCooldown.toString(),
        explorerUrl: `${network.chainId === 80002n ? "https://amoy.polygonscan.com/" : "https://polygonscan.com/"}address/${gameAddress}`
      }
    },
    deployment: {
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    }
  };

  // Save deployment info
  const filename = `deployments/deployment-${network.name}-${Date.now()}.json`;
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  // 7. Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(50));
  
  console.log("\n📋 Contract Addresses:");
  console.log(`   🪙 WarriorToken (WGOLD): ${tokenAddress}`);
  console.log(`   🖼️ WarriorNFT (PWAR):     ${nftAddress}`);
  console.log(`   🎮 Game Contract:        ${gameAddress}`);
  
  console.log("\n🔍 Explorer Links:");
  console.log(`   Token: ${deploymentInfo.contracts.WarriorToken.explorerUrl}`);
  console.log(`   NFT:   ${deploymentInfo.contracts.WarriorNFT.explorerUrl}`);
  console.log(`   Game:  ${deploymentInfo.contracts.PolygonWarriorsGame.explorerUrl}`);
  
  console.log(`\n💾 Deployment info saved to: ${filename}`);
  
  console.log("\n⚡ Next Steps:");
  console.log("   1. Update your .env file with contract addresses:");
  console.log(`      WARRIOR_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`      WARRIOR_NFT_ADDRESS=${nftAddress}`);
  console.log(`      GAME_CONTRACT_ADDRESS=${gameAddress}`);
  console.log("   2. Start your backend server: npm run dev");
  console.log("   3. Test the game in your browser");
  
  console.log("\n🎮 Happy Gaming! ⚔️");

  return deploymentInfo;
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
