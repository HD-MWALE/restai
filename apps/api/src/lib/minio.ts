import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT!;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY!;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY!;
const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "restai-images";
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL!;

const s3 = new S3Client({
  region: "auto",
  endpoint: MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
});

export async function uploadToMinIO(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromMinIO(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: MINIO_BUCKET_NAME,
      Key: key,
    }),
  );
}

export function getPublicUrl(key: string): string {
  return `${MINIO_PUBLIC_URL}/${key}`;
}
