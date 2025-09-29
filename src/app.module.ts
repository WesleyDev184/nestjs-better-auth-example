import { auth } from '@config/auth';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { DatabaseModule } from './shared/database/database.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [DatabaseModule, AuthModule.forRoot(auth), UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
