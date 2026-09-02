import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Form, FormModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class FormRepository extends BaseRepository<Form> {
  constructor(
    @InjectModel(FormModelName) private readonly formModel: Model<Form>,
  ) {
    super(formModel);
  }
}
