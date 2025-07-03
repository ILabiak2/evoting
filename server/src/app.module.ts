import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ElectionModule } from './election/election.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available everywhere
      envFilePath: '.env', // Path to your .env file
    }),
    ElectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
