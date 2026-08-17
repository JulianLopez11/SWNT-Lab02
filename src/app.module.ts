import { Module } from '@nestjs/common';
import { CarbonTrackerModule } from './carbon-tracker/carbon-tracker.module';

@Module({
  imports: [CarbonTrackerModule],
})
export class AppModule {}
