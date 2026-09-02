import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FormDestination } from 'libs/schemas';
import { StorageModule } from 'src/shared/storage/storage.module';
import { FormRepository } from './repository/form.repository';
import { FormMapper } from './mapper/form.mapper';

@Module({
  imports: [MongooseModule.forFeature([FormDestination]), StorageModule],
  controllers: [FormController],
  providers: [FormService, FormRepository, FormMapper],
  exports: [FormService, FormRepository, FormMapper],
})
export class FormModule {}
