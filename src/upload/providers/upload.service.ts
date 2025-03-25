import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { UploadInterface } from '../interfaces/upload.interface';

@Injectable()
export class UploadService implements UploadInterface {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const uploadParams: S3.PutObjectRequest = {
      Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
      Key: `uploads/${uniqueFileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const uploadResult = await this.s3.upload(uploadParams).promise();
      return {
        url: uploadResult.Location,
        key: uploadResult.Key,
      };
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
}
