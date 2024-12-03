import { Socket, Server} from "socket.io"
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Logger, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { AuthSocket } from "../core/socket/auth";

@WebSocketGateway(3003, {cors: { origin: '*' }})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private activeUsers = new Map<number, {userId: number, socketId: string, username: string, name: string, status: 'active' | 'typing...'}>
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('sendMessage')
  handleSendMessage(client: AuthSocket, message: string) {
    this.server.emit('newMessage', {sender: client.authenticatedUser.name, content: message})
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('stopTyping')
  handleOnStopTyping(client: AuthSocket) {
    client.broadcast.emit('updateUsers', Array.from(this.activeUsers.values()))
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('typing')
  handleOnTyping(client: AuthSocket) {
    client.broadcast.emit('updateUsers', Array.from(this.activeUsers.values()).map(u => {
      if (u.userId === client.authenticatedUser.id) {
        return {...u, status: 'typing...'}
      }
      return u;
    }))
  }

  async handleConnection(client: Socket): Promise<any> {
    const {email: username, id: userId, name}  = await this.authService.verifyToken(client.handshake.headers.authorization);
    this.activeUsers.set(userId, {userId, socketId: client.id, username, name, status: 'active'})
    this.logger.log(`new client connected`, this.activeUsers.get(userId))
    this.server.emit('updateUsers', Array.from(this.activeUsers.values()))
  }

  async handleDisconnect(client: AuthSocket): Promise<any> {
    const {id}  = await this.authService.verifyToken(client.handshake.headers.authorization);
    this.logger.log(`client disconnected`, this.activeUsers.get(id))
    this.activeUsers.delete(id)
    client.broadcast.emit('updateUsers', Array.from(this.activeUsers.values()))
  }
}
