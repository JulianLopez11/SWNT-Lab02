import { Module } from '@nestjs/common';
import { CarbonTrackerController } from './carbon-tracker.controller';
import { CarbonTrackerService } from './carbon-tracker.service';

@Module({
  controllers: [CarbonTrackerController],
  providers: [CarbonTrackerService],
  exports: [CarbonTrackerService],
})
export class CarbonTrackerModule {}
