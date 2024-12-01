import { S3 } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

async function testS3Connection() {
  try {
    const s3 = new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
      endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
    });

    console.log('Testing S3 connection...');
    const response = await s3.listBuckets({});
    console.log('Connection successful!');
    console.log(
      'Available buckets:',
      response.Buckets.map((b) => b.Name),
    );
  } catch (error) {
    console.error('S3 connection failed:', error);
  }
}

testS3Connection();
