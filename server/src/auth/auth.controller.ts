import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto, LoginUserDto } from './dto/user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.authService.getUserData(req.user.userId)
    // return req.user; // set by JwtStrategy.validate()
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto ) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth() {
    // Google redirects to this URL
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleAuthRedirect(@Req() req) {
    return this.authService.getUserData(req.user.userId)
    // return req.user; // your JWT token + user info
  }
}
