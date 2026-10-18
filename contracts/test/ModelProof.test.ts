import { expect } from "chai";
import { ethers } from "hardhat";
import { ModelProof } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ModelProof Smart Contract Tests", function () {
  let modelProof: ModelProof;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;
  let randomUser: HardhatEthersSigner;

  const sampleName = "AgriYield-XGBoost";
  const sampleDesc = "Predicts crop yields across climate conditions";
  const sampleFramework = "XGBoost";
  const sampleVersion = "v1.0";
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("agri-yield-v1.0-model-bytes"));
  const sampleCid = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
  const licensePrice = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, creator, buyer, buyer2, randomUser] = await ethers.getSigners();
    const ModelProofFactory = await ethers.getContractFactory("ModelProof");
    modelProof = (await ModelProofFactory.deploy()) as ModelProof;
    await modelProof.waitForDeployment();
  });

  describe("Deployment & Configuration", function () {
    it("Should deploy successfully and set the owner and admin", async function () {
      expect(await modelProof.getAddress()).to.be.properAddress;
      expect(await modelProof.owner()).to.equal(owner.address);
      expect(await modelProof.adminAddress()).to.equal(owner.address);
      expect(await modelProof.platformFeeBps()).to.equal(200); // 2%
    });

    it("Allows owner to update platform fee within limits", async function () {
      await expect(modelProof.connect(owner).setPlatformFee(800))
        .to.emit(modelProof, "PlatformFeeUpdated")
        .withArgs(800);
      expect(await modelProof.platformFeeBps()).to.equal(800);
    });

    it("Rejects fee higher than maximum allowed", async function () {
      await expect(modelProof.connect(owner).setPlatformFee(2500)).to.be.revertedWithCustomError(
        modelProof,
        "InvalidFeeBps"
      );
    });

    it("Allows owner to update admin address", async function () {
      await expect(modelProof.connect(owner).setAdmin(randomUser.address))
        .to.emit(modelProof, "AdminAddressUpdated")
        .withArgs(owner.address, randomUser.address);
      expect(await modelProof.adminAddress()).to.equal(randomUser.address);
    });

    it("Rejects zero address as admin", async function () {
      await expect(modelProof.connect(owner).setAdmin(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        modelProof,
        "InvalidAddress"
      );
    });
  });

  describe("Model Registration", function () {
    it("Registers a valid model successfully and emits ModelRegistered", async function () {
      const tx = await modelProof.connect(creator).registerModel(
        sampleName,
        sampleDesc,
        sampleFramework,
        sampleVersion,
        sampleHash,
        sampleCid,
        licensePrice
      );

      await expect(tx)
        .to.emit(modelProof, "ModelRegistered")
        .withArgs(1, creator.address, sampleHash, sampleVersion, sampleName);

      expect(await modelProof.modelCount()).to.equal(1);
      const model = await modelProof.getModel(1);
      expect(model.name).to.equal(sampleName);
      expect(model.creator).to.equal(creator.address);
      expect(model.modelHash).to.equal(sampleHash);
      expect(model.licensePrice).to.equal(licensePrice);
      expect(model.active).to.be.true;

      const creatorModels = await modelProof.getCreatorModels(creator.address);
      expect(creatorModels.length).to.equal(1);
      expect(creatorModels[0]).to.equal(1n);
    });

    it("Rejects registration with empty name", async function () {
      await expect(
        modelProof.connect(creator).registerModel(
          "",
          sampleDesc,
          sampleFramework,
          sampleVersion,
          sampleHash,
          sampleCid,
          licensePrice
        )
      ).to.be.revertedWithCustomError(modelProof, "InvalidName");
    });

    it("Rejects registration with zero hash", async function () {
      await expect(
        modelProof.connect(creator).registerModel(
          sampleName,
          sampleDesc,
          sampleFramework,
          sampleVersion,
          ethers.ZeroHash,
          sampleCid,
          licensePrice
        )
      ).to.be.revertedWithCustomError(modelProof, "InvalidHash");
    });

    it("Rejects registration with zero license price", async function () {
      await expect(
        modelProof.connect(creator).registerModel(
          sampleName,
          sampleDesc,
          sampleFramework,
          sampleVersion,
          sampleHash,
          sampleCid,
          0
        )
      ).to.be.revertedWithCustomError(modelProof, "InvalidPrice");
    });
  });

  describe("Model Versioning", function () {
    beforeEach(async function () {
      await modelProof.connect(creator).registerModel(
        sampleName,
        sampleDesc,
        sampleFramework,
        sampleVersion,
        sampleHash,
        sampleCid,
        licensePrice
      );
    });

    it("Allows creator to publish a new version with a different hash", async function () {
      const v2Hash = ethers.keccak256(ethers.toUtf8Bytes("agri-yield-v1.1-model-bytes"));
      const v2Cid = "QmNewCidV11xyz";
      const v2Price = ethers.parseEther("0.06");

      const tx = await modelProof.connect(creator).createModelVersion(
        1,
        "v1.1",
        v2Hash,
        v2Cid,
        v2Price
      );

      await expect(tx)
        .to.emit(modelProof, "ModelVersionCreated")
        .withArgs(2, 1, creator.address, v2Hash, "v1.1");

      expect(await modelProof.modelCount()).to.equal(2);
      expect(await modelProof.parentModelOf(2)).to.equal(1n);

      const versions = await modelProof.getModelVersions(1);
      expect(versions.length).to.equal(1);
      expect(versions[0]).to.equal(2n);
    });

    it("Rejects new version from non-creator", async function () {
      const v2Hash = ethers.keccak256(ethers.toUtf8Bytes("different-hash"));
      await expect(
        modelProof.connect(randomUser).createModelVersion(
          1,
          "v1.1",
          v2Hash,
          "cid",
          licensePrice
        )
      ).to.be.revertedWithCustomError(modelProof, "NotModelCreator");
    });

    it("Rejects new version with identical hash", async function () {
      await expect(
        modelProof.connect(creator).createModelVersion(
          1,
          "v1.1",
          sampleHash,
          "cid",
          licensePrice
        )
      ).to.be.revertedWithCustomError(modelProof, "InvalidHash");
    });
  });

  describe("Licensing & Revenue Distribution", function () {
    beforeEach(async function () {
      await modelProof.connect(creator).registerModel(
        sampleName,
        sampleDesc,
        sampleFramework,
        sampleVersion,
        sampleHash,
        sampleCid,
        licensePrice
      );
    });

    it("Allows a buyer to purchase a license with correct ETH and directly transfers 98% to creator and 2% to admin", async function () {
      const creatorBalBefore = await ethers.provider.getBalance(creator.address);
      const adminBalBefore = await ethers.provider.getBalance(owner.address);

      const tx = await modelProof.connect(buyer).purchaseLicense(1, { value: licensePrice });

      await expect(tx).to.emit(modelProof, "LicensePurchased");
      await expect(tx).to.emit(modelProof, "RevenueDistributed");
      expect(await modelProof.licenseCount()).to.equal(1);

      const license = await modelProof.licenses(1);
      expect(license.modelId).to.equal(1n);
      expect(license.licensee).to.equal(buyer.address);
      expect(license.active).to.be.true;

      expect(await modelProof.hasActiveLicense(1, buyer.address)).to.be.true;
      expect(await modelProof.isLicenseValid(1)).to.be.true;

      // Platform fee (2%) vs creator revenue (98%)
      const platformFee = (licensePrice * 200n) / 10000n;
      const creatorShare = licensePrice - platformFee;

      const creatorBalAfter = await ethers.provider.getBalance(creator.address);
      const adminBalAfter = await ethers.provider.getBalance(owner.address);

      expect(creatorBalAfter - creatorBalBefore).to.equal(creatorShare);
      expect(adminBalAfter - adminBalBefore).to.equal(platformFee);
    });

    it("Transfers 2% fee to custom admin address when set", async function () {
      await modelProof.connect(owner).setAdmin(randomUser.address);

      const creatorBalBefore = await ethers.provider.getBalance(creator.address);
      const customAdminBalBefore = await ethers.provider.getBalance(randomUser.address);

      await modelProof.connect(buyer).purchaseLicense(1, { value: licensePrice });

      const platformFee = (licensePrice * 200n) / 10000n;
      const creatorShare = licensePrice - platformFee;

      const creatorBalAfter = await ethers.provider.getBalance(creator.address);
      const customAdminBalAfter = await ethers.provider.getBalance(randomUser.address);

      expect(creatorBalAfter - creatorBalBefore).to.equal(creatorShare);
      expect(customAdminBalAfter - customAdminBalBefore).to.equal(platformFee);
    });

    it("Prevents creator from licensing their own model", async function () {
      await expect(
        modelProof.connect(creator).purchaseLicense(1, { value: licensePrice })
      ).to.be.revertedWithCustomError(modelProof, "CannotLicenseOwnModel");
    });

    it("Rejects license purchase with incorrect ETH amount", async function () {
      const wrongPrice = ethers.parseEther("0.02");
      await expect(
        modelProof.connect(buyer).purchaseLicense(1, { value: wrongPrice })
      ).to.be.revertedWithCustomError(modelProof, "IncorrectPayment");
    });

    it("Respects license expiration after 30 days", async function () {
      await modelProof.connect(buyer).purchaseLicense(1, { value: licensePrice });
      expect(await modelProof.hasActiveLicense(1, buyer.address)).to.be.true;

      // Advance time by 31 days
      await time.increase(31 * 24 * 60 * 60);

      expect(await modelProof.hasActiveLicense(1, buyer.address)).to.be.false;
      expect(await modelProof.isLicenseValid(1)).to.be.false;
    });

    it("Allows creator to revoke a license", async function () {
      await modelProof.connect(buyer).purchaseLicense(1, { value: licensePrice });
      await expect(modelProof.connect(creator).revokeLicense(1))
        .to.emit(modelProof, "LicenseRevoked")
        .withArgs(1, 1, creator.address);

      expect(await modelProof.hasActiveLicense(1, buyer.address)).to.be.false;
      expect(await modelProof.isLicenseValid(1)).to.be.false;
    });
  });

  describe("Model Verification & Lifecycle", function () {
    beforeEach(async function () {
      await modelProof.connect(creator).registerModel(
        sampleName,
        sampleDesc,
        sampleFramework,
        sampleVersion,
        sampleHash,
        sampleCid,
        licensePrice
      );
    });

    it("Correctly verifies matching SHA-256 hash", async function () {
      expect(await modelProof.verifyModelHash(1, sampleHash)).to.be.true;
    });

    it("Returns false for mismatched hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-weights"));
      expect(await modelProof.verifyModelHash(1, tamperedHash)).to.be.false;
    });

    it("Allows creator to deactivate and reactivate model", async function () {
      await modelProof.connect(creator).deactivateModel(1);
      const model = await modelProof.getModel(1);
      expect(model.active).to.be.false;

      // Cannot license deactivated model
      await expect(
        modelProof.connect(buyer).purchaseLicense(1, { value: licensePrice })
      ).to.be.revertedWithCustomError(modelProof, "ModelNotActive");

      await modelProof.connect(creator).reactivateModel(1);
      expect((await modelProof.getModel(1)).active).to.be.true;
    });
  });
});
