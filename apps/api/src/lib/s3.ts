import { S3Client, PutObjectCommand, type S3ClientConfig } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const defaultRegion = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.S3_BUCKET;
const publicBaseEnv = process.env.S3_PUBLIC_BASE;
const s3Endpoint = process.env.S3_ENDPOINT;
const s3ForcePathStyleEnv = process.env.S3_FORCE_PATH_STYLE;

const mimeExtensionFallback: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif"
};

function buildPublicUrl(key: string) {
  const base = publicBaseEnv ?? `https://${bucketName}.s3.${defaultRegion}.amazonaws.com`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

function resolveExtension(originalName?: string, mimeType?: string) {
  const fromName = originalName ? path.extname(originalName) : "";
  if (fromName) return fromName;
  if (mimeType && mimeExtensionFallback[mimeType]) {
    return mimeExtensionFallback[mimeType];
  }
  return "";
}

const clientConfig: S3ClientConfig = {
  region: defaultRegion
};

if (s3Endpoint) {
  clientConfig.endpoint = s3Endpoint;
}

if (s3ForcePathStyleEnv) {
  clientConfig.forcePathStyle = s3ForcePathStyleEnv === "true";
}

export const s3Client = new S3Client(clientConfig);

export async function uploadReportPhoto(options: {
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
  reportId: number;
}) {
  if (!bucketName) {
    throw new Error("S3_BUCKET nu este configurat");
  }

  const extension = resolveExtension(options.originalName, options.mimeType);
  const key = `reports/${options.reportId}/${Date.now()}-${randomUUID()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: options.buffer,
      ContentType: options.mimeType
    })
  );

  return {
    key,
    url: buildPublicUrl(key)
  };
}
