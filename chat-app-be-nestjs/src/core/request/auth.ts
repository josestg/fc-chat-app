import { Request } from 'express';
import { UserLoggedDto } from "../../users/dto/user-logged.dto";

export interface AuthRequest extends Request {
  authenticatedUser: UserLoggedDto
}

