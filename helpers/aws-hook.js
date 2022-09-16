const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const AwsCommand = (action, key, image = null) => {
  let params;
  let command;

  if (action === "put") {
    params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: image,
      ContentType: "image/jpeg",
    };
    command = new PutObjectCommand(params);
  }
  if (action === "get") {
    params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    };
    command = new GetObjectCommand(params);
  }
  if (action === "delete") {
    params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    };
    command = new DeleteObjectCommand(params);
  }

  return { client: s3, command: command };
};

module.exports = AwsCommand;
