import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthService } from "../auth/auth.service";

@Module({
  providers: [ChatGateway, AuthService]
})
export class ChatModule {}
