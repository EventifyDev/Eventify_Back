import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileService } from './providers/profile.service';
import { ProfileController } from './controllers/profile.controller';
import { ProfileRepository } from './repositories/profile.repository';
import { Profile, ProfileSchema } from './schemas/profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: 'IProfileRepository',
      useClass: ProfileRepository,
    },
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
