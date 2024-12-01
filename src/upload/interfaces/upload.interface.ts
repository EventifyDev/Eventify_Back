export interface UploadInterface {
  uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }>;
}
