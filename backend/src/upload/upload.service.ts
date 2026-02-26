import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';

export interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Serviço de upload que funciona com Cloudinary (produção) e disco local (desenvolvimento).
 *
 * Em produção, requer as variáveis:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Em desenvolvimento (sem essas variáveis), salva localmente em /uploads.
 */
@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly isCloudinary: boolean;

    constructor() {
        this.isCloudinary = !!(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        );
        if (this.isCloudinary) {
            this.logger.log('Upload mode: Cloudinary');
        } else {
            this.logger.log('Upload mode: Local disk (dev)');
        }
    }

    /**
     * Faz upload de um arquivo para Cloudinary ou retorna a URL local.
     * @param file - arquivo do Multer (buffer ou path)
     * @param folder - pasta no Cloudinary (ex: "avatars", "attachments")
     */
    async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
        if (this.isCloudinary) {
            return this.uploadToCloudinary(file, folder);
        }
        // Modo local: retorna a URL relativa do disco
        return {
            url: `/uploads/${folder}/${file.filename}`,
            publicId: file.filename,
        };
    }

    /**
     * Remove um arquivo do Cloudinary (pelo publicId).
     */
    async remove(publicId: string): Promise<void> {
        if (!this.isCloudinary) return;
        try {
            const cloudinary = await this.getCloudinary();
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            this.logger.warn(`Failed to remove from Cloudinary: ${publicId}`, err);
        }
    }

    private async uploadToCloudinary(
        file: Express.Multer.File,
        folder: string,
    ): Promise<UploadResult> {
        const cloudinary = await this.getCloudinary();

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `fincontrol/${folder}`,
                    resource_type: 'auto',
                    transformation: folder === 'avatars'
                        ? [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
                        : undefined,
                },
                (error: any, result: any) => {
                    if (error) return reject(error);
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                },
            );

            // Se o arquivo tem buffer (memoryStorage), usa ele; senão cria stream do path
            if (file.buffer) {
                const stream = Readable.from(file.buffer);
                stream.pipe(uploadStream);
            } else {
                // fallback para arquivo no disco (diskStorage)
                const fs = require('fs');
                fs.createReadStream(file.path).pipe(uploadStream);
            }
        });
    }

    private async getCloudinary() {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        return cloudinary;
    }
}
