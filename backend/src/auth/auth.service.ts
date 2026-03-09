import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface LoggedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(name: string, email: string, password: string): Promise<LoggedUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        name: name.trim() || null,
        role: UserRole.USER,
      },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(email: string, password: string): Promise<LoggedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.password) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async validateUser(id: string): Promise<LoggedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Retorna sucesso silenciosamente por segurança
      return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
    }

    // Gera um token de 32 bytes em HEX
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Faz o hash do token para salvar no banco
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Define a expiração para 1 hora a partir de agora
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: passwordResetToken,
        resetPasswordExpires: passwordResetExpires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Configuração do Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // AVISO: Configure o RESEND_API_KEY no seu .env

    try {
      await resend.emails.send({
        from: 'FinControl <onboarding@resend.dev>', // O e-mail de envio do Resend (no plano grátis só permite enviar para o mesmo e-mail verificado na conta)
        to: user.email,
        subject: 'Recuperação de Senha - FinControl',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
            <h2 style="color: #6366f1;">FinControl - Recuperação de Senha</h2>
            <p>Olá, ${user.name || 'Usuário'}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
            </div>
            <p style="color: #666; font-size: 14px;">Se você não solicitou essa redefinição, apenas ignore este e-mail. Este link é válido por 1 hora.</p>
            <hr style="border: none; border-top: 1px solid #eaeaec; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>${resetUrl}</p>
          </div>
        `,
      });
      console.log(`[AuthService] E-mail de recuperação enviado para: ${user.email}`);
    } catch (error) {
      console.error(`[AuthService] Erro ao enviar e-mail pelo Resend:`, error);
      // Mesmo com erro de envio, não devemos revelar se o usuário existe ou não, mas podemos logar internamente.
    }

    return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(), // Só aceita se a data de validade for MAIOR que agora
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Senha redefinida com sucesso!' };
  }
}
