import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

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

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  async findByEmailForAuth(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async update(updateUserDto: UpdateUserDto) {
    const { _id, ...data } = updateUserDto;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      _id,
      {
        $set: data,
      },
      {
        new: true,
      },
    );
    return updatedUser;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async handleRegister(createAuthDto: CreateAuthDto) {
    const { email, password, name } = createAuthDto;
    const hashPassword = await hashPasswordHelper(password);

    if (await this.isUserExist(email)) {
      throw new BadRequestException(`User with email ${email} already exist`);
    }

    // Create user
    const codeId = uuidv4();
    const codeExpirationDays = this.configService.get<number>(
      'CODE_EXPIRATION_MINUTES',
    );
    const createdUser = new this.userModel({
      email,
      name,
      password: hashPassword,
      isActive: false,
      codeId,
      codeExpired: dayjs().add(codeExpirationDays, 'minute').toDate(),
    });
    const { _id } = await createdUser.save();

    // Send email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Testing Nest MailerModule ✔',
      template: './register', // use the register.hbs template
      context: {
        name: createAuthDto?.name ?? createAuthDto?.email,
        activationCode: codeId,
      },
    });

    return { _id, email, name };
  }
}
