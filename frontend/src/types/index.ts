export interface ModelMetrics {
  r2?: number;
  mae?: number;
  rmse?: number;
  accuracy?: number;
  f1_score?: number;
  classes?: number;
  vocabulary_size?: number;
  dataset_size?: string;
  features_count?: number;
  training_time?: string;
  [key: string]: any;
}

export interface ModelRecord {
  modelId: number;
  creator: string;
  name: string;
  description: string;
  framework: string;
  version: string;
  modelType: string;
  modelHash: string;
  ipfsCid: string;
  licensePriceEth: string;
  licensePriceWei?: bigint | string;
  createdAt: number;
  active: boolean;
  metrics: ModelMetrics;
  useCase?: string;
  filename?: string;
  filesize?: number;
  licenseCount?: number;
  parentModelId?: number;
  versionHistory?: string[];
}

export interface LicenseRecord {
  licenseId: number;
  modelId: number;
  modelName: string;
  creator: string;
  licensee: string;
  issuedAt: number;
  expiry: number;
  active: boolean;
  priceEth: string;
  transactionHash: string;
  licenseType?: "30_day_license" | "full_ownership";
}

export interface ActivityEvent {
  id: string;
  type: "ModelRegistered" | "LicensePurchased" | "ModelOwnershipPurchased" | "VersionCreated" | "LicenseRevoked" | "PaymentWithdrawn";
  user: string;
  modelName?: string;
  modelId?: number;
  amountEth?: string;
  timestamp: number;
  txHash: string;
  status: "Confirmed" | "Pending";
}

export interface ModelAnalysisResult {
  filename: string;
  file_size_bytes: number;
  sha256_hash: string;
  is_valid_ml_artifact: boolean;
  framework: string;
  model_type: string;
  parameters: Record<string, any>;
  summary: string;
}
