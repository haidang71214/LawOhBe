import * as dotenv from 'dotenv';
dotenv.config();

import { BaseConfiguration } from 'libs/configuration/base.config';
import { AppConfiguration } from 'libs/configuration/app.config';
import { MongoConfiguration } from 'libs/configuration/mongo.config';
import { RedisConfiguration } from 'libs/configuration/redis.config';
import { CloudinaryConfiguration } from 'libs/configuration/cloundynary.config';
import { MailConfiguration } from 'libs/configuration/mail.config';
import { KafkaConfiguration } from 'libs/configuration/kafka.config';
import { LokiConfiguration } from 'libs/configuration/loki.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP = new AppConfiguration();

  @ValidateNested()
  @Type(() => MongoConfiguration)
  MONGO_CONFIG = new MongoConfiguration();

  @ValidateNested()
  @Type(() => RedisConfiguration)
  REDIS_SERV = new RedisConfiguration();

  @ValidateNested()
  @Type(() => CloudinaryConfiguration)
  CLOUDINARY = new CloudinaryConfiguration();

  @ValidateNested()
  @Type(() => MailConfiguration)
  MAIL = new MailConfiguration();

  @ValidateNested()
  @Type(() => KafkaConfiguration)
  KAFKA = new KafkaConfiguration();

  @ValidateNested()
  @Type(() => LokiConfiguration)
  LOKI = new LokiConfiguration();
}

export const CONFIGURATION = new Configuration();
export type TConfiguration = typeof CONFIGURATION;

CONFIGURATION.validate();

export const configuration = () => CONFIGURATION;
