import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailForAuth(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidPassword = await comparePasswordHelper(pass, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { email: user.email, sub: user._id };
    return {
      access_token: await this.jwtService.sign(payload),
    };
  }
}