import { Test, TestingModule } from '@nestjs/testing';
import { CarbonTrackerModule } from '../../src/carbon-tracker/carbon-tracker.module';
import { CarbonTrackerController } from '../../src/carbon-tracker/carbon-tracker.controller';
import { CarbonTrackerService } from '../../src/carbon-tracker/carbon-tracker.service';

describe('CarbonTrackerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CarbonTrackerModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('resuelve el CarbonTrackerController vía inyección de dependencias', () => {
    expect(module.get(CarbonTrackerController)).toBeInstanceOf(CarbonTrackerController);
  });

  it('resuelve el CarbonTrackerService vía inyección de dependencias', () => {
    expect(module.get(CarbonTrackerService)).toBeInstanceOf(CarbonTrackerService);
  });
});
