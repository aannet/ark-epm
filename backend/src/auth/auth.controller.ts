import { Controller, Post, Get, UseGuards, Request, HttpCode, HttpStatus, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);
    
    const refreshTokenData = await this.refreshTokenService.generateRefreshToken(req.user.id);
    
    res.cookie('refresh_token', refreshTokenData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: refreshTokenData.expiresAt,
      path: '/auth',
    });
    
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const validation = await this.refreshTokenService.validateRefreshToken(refreshToken);
    
    if (!validation) {
      res.clearCookie('refresh_token', { path: '/auth' });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const rotatedToken = await this.refreshTokenService.rotateRefreshToken(validation.userId, refreshToken);
    
    if (!rotatedToken) {
      res.clearCookie('refresh_token', { path: '/auth' });
      throw new UnauthorizedException('Token rotation failed');
    }

    res.cookie('refresh_token', rotatedToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: rotatedToken.expiresAt,
      path: '/auth',
    });

    const user = await this.authService.getProfile(validation.userId);
    const payload = { sub: user.id, email: user.email };
    
    return {
      accessToken: this.authService.signAccessToken(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        role: user.role ? {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          createdAt: user.role.createdAt,
          permissions: user.role.rolePermissions?.map((rp: any) => ({
            name: rp.permission.name,
            description: rp.permission.description,
          })) || [],
        } : null,
        createdAt: user.createdAt,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.refreshTokenService.revokeRefreshToken(req.user.userId);
    res.clearCookie('refresh_token', { path: '/auth' });
  }
}
