import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.auth.register(dto.name, dto.email, dto.password);
    return { user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.login(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('E-mail ou senha inválidos');
    return { user };
  }
}
