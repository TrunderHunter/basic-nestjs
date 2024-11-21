import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({
    message: 'Name is required',
  })
  name: string;
  @IsEmail()
  @IsNotEmpty({
    message: 'Email is required',
  })
  email: string;
  @IsString()
  @IsNotEmpty({
    message: 'Password is required',
  })
  password: string;
  phone: string;
  address: string;
  image: string;
}
