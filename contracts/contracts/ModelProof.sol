// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ModelProof
 * @notice Decentralized AI/ML Model Ownership, Verification & Licensing Marketplace
 * @dev Manages cryptographically hashed model registrations, immutable version trees,
 *      time-limited licensing with automated revenue distribution and platform fees.
 */
contract ModelProof is Ownable, ReentrancyGuard {
    // --- Constants & Config ---
    uint256 public constant DEFAULT_LICENSE_DURATION = 30 days;
    uint256 public constant MAX_PLATFORM_FEE_BPS = 2000; // 20% max
    uint256 public platformFeeBps = 200; // 2% default (basis points, 10000 = 100%)
    address public adminAddress; // Recipient for the 2% admin platform fee

    // --- Structures ---
    struct Model {
        uint256 modelId;
        address creator;
        string name;
        string description;
        string framework;
        string version;
        bytes32 modelHash;
        string ipfsCid;
        uint256 licensePrice;
        uint256 createdAt;
        bool active;
    }

    struct License {
        uint256 licenseId;
        uint256 modelId;
        address licensee;
        uint256 issuedAt;
        uint256 expiry;
        bool active;
    }

    // --- State Variables ---
    uint256 public modelCount;
    uint256 public licenseCount;

    mapping(uint256 => Model) public models;
    mapping(uint256 => License) public licenses;

    // Model version graph: parentModelId => child modelIds
    mapping(uint256 => uint256[]) private _modelVersions;
    // Model parent pointer: modelId => parentModelId (0 if root)
    mapping(uint256 => uint256) public parentModelOf;

    // Creator lookup: creator address => array of modelIds
    mapping(address => uint256[]) private _creatorModels;
    // Licensee lookup: user address => array of licenseIds
    mapping(address => uint256[]) private _userLicenses;

    // Pull-payment balances for creator earnings and platform fees
    mapping(address => uint256) public pendingBalances;

    // --- Events ---
    event ModelRegistered(
        uint256 indexed modelId,
        address indexed creator,
        bytes32 modelHash,
        string version,
        string name
    );

    event ModelVersionCreated(
        uint256 indexed modelId,
        uint256 indexed parentModelId,
        address indexed creator,
        bytes32 modelHash,
        string version
    );

    event LicensePurchased(
        uint256 indexed licenseId,
        uint256 indexed modelId,
        address indexed licensee,
        uint256 amount,
        uint256 expiry
    );

    event LicenseRevoked(
        uint256 indexed licenseId,
        uint256 indexed modelId,
        address indexed revokedBy
    );

    event ModelDeactivated(uint256 indexed modelId, address indexed creator);
    event ModelReactivated(uint256 indexed modelId, address indexed creator);
    event PaymentWithdrawn(address indexed recipient, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event AdminAddressUpdated(address indexed previousAdmin, address indexed newAdmin);
    event RevenueDistributed(
        uint256 indexed licenseId,
        uint256 indexed modelId,
        address indexed creator,
        uint256 creatorAmount,
        address admin,
        uint256 adminAmount
    );

    // --- Errors ---
    error InvalidName();
    error InvalidHash();
    error InvalidPrice();
    error ModelNotFound();
    error ModelNotActive();
    error NotModelCreator();
    error NotAuthorized();
    error IncorrectPayment(uint256 expected, uint256 actual);
    error CannotLicenseOwnModel();
    error LicenseNotFound();
    error LicenseAlreadyRevoked();
    error NoEarningsToWithdraw();
    error TransferFailed();
    error InvalidFeeBps();
    error InvalidAddress();

    constructor() Ownable(msg.sender) {
        adminAddress = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Core Registration
    // -------------------------------------------------------------------------

    /**
     * @notice Register a brand new AI/ML model artifact on-chain
     */
    function registerModel(
        string calldata name,
        string calldata description,
        string calldata framework,
        string calldata version,
        bytes32 modelHash,
        string calldata ipfsCid,
        uint256 licensePrice
    ) external returns (uint256) {
        if (bytes(name).length == 0) revert InvalidName();
        if (modelHash == bytes32(0)) revert InvalidHash();
        if (licensePrice == 0) revert InvalidPrice();

        modelCount++;
        uint256 newModelId = modelCount;

        models[newModelId] = Model({
            modelId: newModelId,
            creator: msg.sender,
            name: name,
            description: description,
            framework: framework,
            version: version,
            modelHash: modelHash,
            ipfsCid: ipfsCid,
            licensePrice: licensePrice,
            createdAt: block.timestamp,
            active: true
        });

        _creatorModels[msg.sender].push(newModelId);

        emit ModelRegistered(newModelId, msg.sender, modelHash, version, name);
        return newModelId;
    }

    /**
     * @notice Register a new version of an existing model
     */
    function createModelVersion(
        uint256 parentModelId,
        string calldata version,
        bytes32 modelHash,
        string calldata ipfsCid,
        uint256 licensePrice
    ) external returns (uint256) {
        if (parentModelId == 0 || parentModelId > modelCount) revert ModelNotFound();
        Model storage parent = models[parentModelId];
        if (parent.creator != msg.sender) revert NotModelCreator();
        if (modelHash == bytes32(0)) revert InvalidHash();
        if (modelHash == parent.modelHash) revert InvalidHash(); // Must differ from parent
        if (licensePrice == 0) revert InvalidPrice();

        modelCount++;
        uint256 newModelId = modelCount;

        models[newModelId] = Model({
            modelId: newModelId,
            creator: msg.sender,
            name: parent.name,
            description: parent.description,
            framework: parent.framework,
            version: version,
            modelHash: modelHash,
            ipfsCid: ipfsCid,
            licensePrice: licensePrice,
            createdAt: block.timestamp,
            active: true
        });

        parentModelOf[newModelId] = parentModelId;
        _modelVersions[parentModelId].push(newModelId);
        _creatorModels[msg.sender].push(newModelId);

        emit ModelVersionCreated(newModelId, parentModelId, msg.sender, modelHash, version);
        return newModelId;
    }

    // -------------------------------------------------------------------------
    // Licensing
    // -------------------------------------------------------------------------

    /**
     * @notice Purchase a 30-day license for an active model using ETH
     */
    function purchaseLicense(uint256 modelId) external payable nonReentrant returns (uint256) {
        if (modelId == 0 || modelId > modelCount) revert ModelNotFound();
        Model storage model = models[modelId];
        if (!model.active) revert ModelNotActive();
        if (model.creator == msg.sender) revert CannotLicenseOwnModel();
        if (msg.value != model.licensePrice) revert IncorrectPayment(model.licensePrice, msg.value);

        // Revenue distribution (98% to creator, 2% to admin)
        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 creatorAmount = msg.value - fee;

        address feeRecipient = adminAddress != address(0) ? adminAddress : owner();

        licenseCount++;
        uint256 newLicenseId = licenseCount;
        uint256 expiry = block.timestamp + DEFAULT_LICENSE_DURATION;

        licenses[newLicenseId] = License({
            licenseId: newLicenseId,
            modelId: modelId,
            licensee: msg.sender,
            issuedAt: block.timestamp,
            expiry: expiry,
            active: true
        });

        _userLicenses[msg.sender].push(newLicenseId);

        emit LicensePurchased(newLicenseId, modelId, msg.sender, msg.value, expiry);
        emit RevenueDistributed(newLicenseId, modelId, model.creator, creatorAmount, feeRecipient, fee);

        // Immediate ETH Sepolia transfer: 98% to creator, 2% to admin
        (bool successCreator, ) = payable(model.creator).call{value: creatorAmount}("");
        if (!successCreator) {
            // Fallback to pull-payment if direct transfer fails
            pendingBalances[model.creator] += creatorAmount;
        }

        (bool successAdmin, ) = payable(feeRecipient).call{value: fee}("");
        if (!successAdmin) {
            // Fallback to pull-payment if direct transfer fails
            pendingBalances[feeRecipient] += fee;
        }

        return newLicenseId;
    }

    /**
     * @notice Revoke a license (creator or platform owner)
     */
    function revokeLicense(uint256 licenseId) external {
        if (licenseId == 0 || licenseId > licenseCount) revert LicenseNotFound();
        License storage lic = licenses[licenseId];
        if (!lic.active) revert LicenseAlreadyRevoked();

        Model storage model = models[lic.modelId];
        if (msg.sender != model.creator && msg.sender != owner()) {
            revert NotAuthorized();
        }

        lic.active = false;
        emit LicenseRevoked(licenseId, lic.modelId, msg.sender);
    }

    /**
     * @notice Check if a user currently holds an active, unexpired license for a model
     */
    function hasActiveLicense(uint256 modelId, address user) external view returns (bool) {
        uint256[] memory userLics = _userLicenses[user];
        for (uint256 i = 0; i < userLics.length; i++) {
            License storage lic = licenses[userLics[i]];
            if (lic.modelId == modelId && lic.active && block.timestamp < lic.expiry) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Check whether a specific license ID is active and not expired
     */
    function isLicenseValid(uint256 licenseId) external view returns (bool) {
        if (licenseId == 0 || licenseId > licenseCount) return false;
        License storage lic = licenses[licenseId];
        return lic.active && block.timestamp < lic.expiry;
    }

    // -------------------------------------------------------------------------
    // Model Management
    // -------------------------------------------------------------------------

    function deactivateModel(uint256 modelId) external {
        if (modelId == 0 || modelId > modelCount) revert ModelNotFound();
        Model storage model = models[modelId];
        if (msg.sender != model.creator && msg.sender != owner()) {
            revert NotAuthorized();
        }
        model.active = false;
        emit ModelDeactivated(modelId, msg.sender);
    }

    function reactivateModel(uint256 modelId) external {
        if (modelId == 0 || modelId > modelCount) revert ModelNotFound();
        Model storage model = models[modelId];
        if (msg.sender != model.creator) revert NotModelCreator();
        model.active = true;
        emit ModelReactivated(modelId, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Verification
    // -------------------------------------------------------------------------

    /**
     * @notice Verify whether a provided file hash matches the registered model's fingerprint
     */
    function verifyModelHash(uint256 modelId, bytes32 uploadedHash) external view returns (bool) {
        if (modelId == 0 || modelId > modelCount) revert ModelNotFound();
        return models[modelId].modelHash == uploadedHash;
    }

    // -------------------------------------------------------------------------
    // Withdrawals & Treasury
    // -------------------------------------------------------------------------

    /**
     * @notice Withdraw accumulated earnings using safe pull-payment pattern
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = pendingBalances[msg.sender];
        if (amount == 0) revert NoEarningsToWithdraw();

        pendingBalances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PaymentWithdrawn(msg.sender, amount);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFeeBps();
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    function setAdmin(address newAdmin) external onlyOwner {
        if (newAdmin == address(0)) revert InvalidAddress();
        address oldAdmin = adminAddress;
        adminAddress = newAdmin;
        emit AdminAddressUpdated(oldAdmin, newAdmin);
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------

    function getModel(uint256 modelId) external view returns (Model memory) {
        if (modelId == 0 || modelId > modelCount) revert ModelNotFound();
        return models[modelId];
    }

    function getAllModels() external view returns (Model[] memory) {
        Model[] memory all = new Model[](modelCount);
        for (uint256 i = 1; i <= modelCount; i++) {
            all[i - 1] = models[i];
        }
        return all;
    }

    function getModelVersions(uint256 modelId) external view returns (uint256[] memory) {
        return _modelVersions[modelId];
    }

    function getCreatorModels(address creator) external view returns (uint256[] memory) {
        return _creatorModels[creator];
    }

    function getUserLicenses(address user) external view returns (uint256[] memory) {
        return _userLicenses[user];
    }
}
