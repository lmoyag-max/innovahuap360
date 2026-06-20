import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Firmas binarias (magic bytes) de los tipos permitidos. El mimetype que
 * envía el cliente es solo una cabecera declarada y puede falsificarse
 * (CWE-434); esta verificación inspecciona el contenido real del archivo
 * ya escrito en disco antes de registrarlo.
 */
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  'application/pdf': (b) => b.subarray(0, 4).toString('latin1') === '%PDF',
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

async function readMagicBytes(path: string, length = 16): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = createReadStream(path, { start: 0, end: length - 1 })
    stream.on('data', (chunk) => chunks.push(chunk as Buffer))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async register(file: Express.Multer.File, uploadedById?: string) {
    const validator = MAGIC_BYTES[file.mimetype];
    const header = await readMagicBytes(file.path);

    if (!validator || !validator(header)) {
      await fs.unlink(file.path).catch(() => undefined);
      throw new BadRequestException('El contenido del archivo no corresponde al tipo declarado');
    }

    return this.prisma.upload.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById,
      },
    });
  }

  findAll() {
    return this.prisma.upload.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const upload = await this.prisma.upload.findUnique({ where: { id } });
    if (!upload) throw new NotFoundException('Archivo no encontrado');
    return upload;
  }
}
