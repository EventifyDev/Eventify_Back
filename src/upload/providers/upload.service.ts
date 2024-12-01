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
      //   ACL: 'public-read',
      ContentType: file.mimetype,
    };

    try {
      console.log('Uploading file to S3 with params:', uploadParams);
      const uploadResult = await this.s3.upload(uploadParams).promise();
      console.log('File uploaded successfully:', uploadResult);
      return {
        url: uploadResult.Location,
        key: uploadResult.Key,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
}
