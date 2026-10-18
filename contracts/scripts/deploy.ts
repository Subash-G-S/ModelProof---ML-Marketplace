import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==========================================");
  console.log("ModelProof Smart Contract Deployment");
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  const ModelProofFactory = await ethers.getContractFactory("ModelProof");
  const modelProof = await ModelProofFactory.deploy();
  await modelProof.waitForDeployment();

  const contractAddress = await modelProof.getAddress();
  console.log(`[+] ModelProof deployed at: ${contractAddress}`);

  // Optional: configure custom Admin address on-chain if provided
  if (process.env.ADMIN_ADDRESS && process.env.ADMIN_ADDRESS.startsWith("0x")) {
    console.log(`[+] Setting custom admin address on-chain: ${process.env.ADMIN_ADDRESS}`);
    const setAdminTx = await modelProof.setAdmin(process.env.ADMIN_ADDRESS);
    await setAdminTx.wait();
    console.log(`    ✓ Admin address set on-chain to ${process.env.ADMIN_ADDRESS}`);
  }

  // Load models metadata to optionally seed initial registrations
  const metadataPath = path.resolve(__dirname, "../../ml/models/models_metadata.json");
  if (fs.existsSync(metadataPath)) {
    console.log("[+] Seeding demo models on-chain...");
    const rawData = fs.readFileSync(metadataPath, "utf-8");
    const demoModels = JSON.parse(rawData);

    for (const m of demoModels) {
      console.log(`    Registering: ${m.name} (${m.version})`);
      const priceWei = ethers.parseEther(m.license_price_eth);
      const tx = await modelProof.registerModel(
        m.name,
        m.description,
        m.framework,
        m.version,
        m.hash,
        m.ipfs_cid,
        priceWei
      );
      await tx.wait();
      console.log(`    ✓ Registered on-chain`);
    }
  }

  // Read ABI from artifacts
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/ModelProof.sol/ModelProof.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  // Save config for frontend
  const frontendConfigDir = path.resolve(__dirname, "../../frontend/src/contracts");
  fs.mkdirSync(frontendConfigDir, { recursive: true });

  const network = await ethers.provider.getNetwork();
  const configPayload = {
    address: contractAddress,
    chainId: Number(network.chainId),
    networkName: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const frontendConfigFile = path.join(frontendConfigDir, "modelProofConfig.json");
  fs.writeFileSync(frontendConfigFile, JSON.stringify(configPayload, null, 2));
  console.log(`[+] Frontend configuration exported to: ${frontendConfigFile}`);

  console.log("Deployment completed successfully.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
