import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PropertiesController } from './properties.controller.js';
import { UnitsController } from './units.controller.js';
import { UnitsService } from './units.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UnitsController, PropertiesController],
  providers: [UnitsService],
})
export class UnitsModule {}
