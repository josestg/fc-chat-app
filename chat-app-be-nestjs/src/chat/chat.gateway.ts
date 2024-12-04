import { Socket, Server } from "socket.io";
import {
  OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer, WsException
} from "@nestjs/websockets";
import { Logger, UseGuards } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { AuthGuard } from "../auth/auth.guard";
import { AuthSocket } from "../core/socket/auth";

@WebSocketGateway(3003, { cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private activeUsers = new Map<
    number,
    {
      userId: number;
      socketId: string;
      username: string;
      name: string;
      status: "active" | "typing..." | "you";
    }
  >();

  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly authService: AuthService) {
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage("sendMessage")
  async handleSendMessage(client: AuthSocket, message: string) {
    this.logger.debug(`message received socket_id:${client.id}`, message);
    const info = client.authenticatedUser;
    this.logger.debug(
      `new client connected, socket_id: ${client.id}, user_id: ${info.id}, name: ${info.name}`
    );
    this.server.emit("newMessage", { sender: info.name, content: message });
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage("typing")
  async handleTyping(client: AuthSocket) {
    const info = client.authenticatedUser;
    this.server.emit("updateUsers", Array.from(this.activeUsers.values()).map(usr => ({
      name: usr.name,
      status: info.id === usr.userId ? "typing..." : "active"
    })));

    client.emit("updateUsers", Array.from(this.activeUsers.values()).map(usr => ({
      name: usr.name,
      status: info.id === usr.userId ? "you" : "active"
    })));
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage("stopTyping")
  async handleStopTyping(client: AuthSocket) {
    client.broadcast.emit("updateUsers", Array.from(this.activeUsers.values()));
  }

  async handleConnection(client: Socket): Promise<any> {
    this.logger.debug(`new client connected, socket_id: ${client.id}`);
    const { token } = client.handshake.auth;
    try {
      const info = await this.authService.verifyToken(token);
      this.logger.debug(
        `new client connected, socket_id: ${client.id}, user_id: ${info.id}, name: ${info.name}`
      );
      this.activeUsers.set(info.id, {
        userId: info.id,
        socketId: client.id,
        username: info.email,
        name: info.name,
        status: "active"
      });

      this.server.emit(
        "updateUsers",
        Array.from(this.activeUsers.values()).map((usr) => ({
          name: usr.name,
          status: usr.status
        }))
      );
    } catch {
      this.logger.error('token invalid')
    }
  }

  async handleDisconnect(client: Socket): Promise<any> {
    const { token } = client.handshake.auth;
    if (token) {
      const info = await this.authService.verifyToken(token);
      this.activeUsers.delete(info.id);
      this.server.emit(
        "updateUsers",
        Array.from(this.activeUsers.values()).map((usr) => ({
          name: usr.name,
          status: usr.status
        }))
      );
    } else {
      this.logger.error("token is missing");
    }
  }
}
