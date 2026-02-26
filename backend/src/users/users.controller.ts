import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UsersService } from './users.service';
import { UploadService } from '../upload/upload.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const AVATAR_DIR = 'uploads/avatars';

/** Retorna o storage correto: memoryStorage (Cloudinary) ou diskStorage (dev local) */
function avatarStorage() {
  const useCloud = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (useCloud) {
    return memoryStorage();
  }
  // Dev local — garante que a pasta exista
  if (!existsSync(AVATAR_DIR)) mkdirSync(AVATAR_DIR, { recursive: true });
  return diskStorage({
    destination: AVATAR_DIR,
    filename: (req, file, cb) => {
      const id = (req as any).params.id;
      const ext = extname(file.originalname) || '.jpg';
      cb(null, `${id}-${Date.now()}${ext}`);
    },
  });
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly uploadService: UploadService,
  ) { }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_, file, cb) => {
        const allowed = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
        cb(null, allowed);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const result = await this.uploadService.upload(file, 'avatars');
    await this.users.update(id, { avatar: result.url });
    return { avatar: result.url };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}

