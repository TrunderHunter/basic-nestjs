import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  isUserExist(email: string) {
    return this.userModel.findOne({
      email,
    });
  }

  async create(createUserDto: CreateUserDto) {
    const hashPassword = await hashPasswordHelper(createUserDto.password);

    if (await this.isUserExist(createUserDto.email)) {
      throw new BadRequestException(
        `User with email ${createUserDto.email} already exist`,
      );
    }

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashPassword,
    });
    // Return name and email only
    const { name, email } = await createdUser.save();
    return { name, email };
  }

  async findAll({
    page,
    limit,
    sort,
  }: {
    page: number;
    limit: number;
    sort: string;
  }) {
    if (!page) page = 1;
    if (!limit) limit = 10;

    const users = await this.userModel
      .find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password')
      .exec();
    const total = await this.userModel.countDocuments();
    const totalPages = Math.ceil(total / limit);
    return {
      data: users,
      total,
      page,
      totalPages,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
