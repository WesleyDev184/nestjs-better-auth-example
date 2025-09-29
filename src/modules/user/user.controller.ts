import { Controller, Get, Session, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }
}
