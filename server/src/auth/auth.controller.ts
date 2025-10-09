import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto, LoginUserDto, ChangeUserPasswordDto } from './dto/user.dto';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@User('userId') userId) {
    return this.authService.getUserData(userId);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('change-password')
  async changePassword(
    @User('userId') userId: string,
    @Body() changePasswordDto: ChangeUserPasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth() {
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleAuthRedirect(@Req() req, @Res() res) {
    // Генерація токена та отримання користувача
    const tokenData = await this.authService.validateOAuthLogin(req.user);

    // Встановлюємо cookie з токеном (можна зробити httpOnly: true в production)
    res.cookie('access_token', tokenData.access_token, {
      httpOnly: false, // ❗️Зроби true у production
      secure: false, // ❗️true у production з HTTPS
      sameSite: 'Lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 15, // 15 днів
    });

    // Редірект назад у фронтенд (Next.js)
    res.redirect(`${process.env.CLIENT_HOST}/after-auth`);
  }
}
