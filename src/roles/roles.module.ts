import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { RoleRepository } from './repositories/role.repository';
import { RoleService } from './providers/role.service';
import { RolesController } from './controllers/roles.controller';
import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  providers: [
    {
      provide: 'IRoleRepository',
      useClass: RoleRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRoleService',
      useClass: RoleService,
    },
    RoleRepository,
    RoleService,
  ],
  exports: ['IRoleService', RoleService],
  controllers: [RolesController],
})
export class RolesModule {}
