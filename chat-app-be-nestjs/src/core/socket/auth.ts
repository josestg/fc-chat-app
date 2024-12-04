import { Socket } from "socket.io";
import { UserLoggedDto } from "../../users/dto/user-logged.dto";

export class AuthSocket extends Socket {
  authenticatedUser: UserLoggedDto
}