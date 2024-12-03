import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode, HttpException, UnauthorizedException
} from "@nestjs/common";
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { QueryFailedError } from "typeorm";
import { rethrow } from "@nestjs/core/helpers/rethrow";
import { TokenDto } from "../auth/dto/token.dto";
import { SkipAuth } from "../core/decorators/skipauth.decorator";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @SkipAuth()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (ex) {
      if (ex instanceof QueryFailedError) {
        const {code} = ex.driverError
        switch (code) {
          case "23505":
            throw new HttpException('email already taken', HttpStatus.CONFLICT)
          default:
            console.log('unhandled error code',ex.driverError.code)
        }
      }
      rethrow(ex)
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  async login(@Body() dto: LoginDto): Promise<TokenDto> {
    const res = await this.usersService.login(dto);
    if (res == null) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return res;
  }

  @Get('profile')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }
}
