import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { CarbonTrackerExceptionFilter } from '../../src/carbon-tracker/filters/carbon-tracker-exception.filter';
import { InvalidCargoWeightException } from '../../src/carbon-tracker/exceptions/carbon-tracker.exceptions';

describe('CarbonTrackerExceptionFilter', () => {
  let filter: CarbonTrackerExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new CarbonTrackerExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('responde con status 400 (Bad Request)', () => {
    const exception = new InvalidCargoWeightException(-5, 0.001, 60);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('el body incluye statusCode, errorCode, message y timestamp', () => {
    const exception = new InvalidCargoWeightException(-5, 0.001, 60);

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        errorCode: 'INVALID_CARGO_WEIGHT',
        message: exception.message,
        timestamp: expect.any(String),
      }),
    );
  });

  it('el timestamp generado es una fecha ISO válida', () => {
    const exception = new InvalidCargoWeightException(-5, 0.001, 60);

    filter.catch(exception, mockHost);

    const [[body]] = mockResponse.json.mock.calls;
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('preserva el code específico de cada tipo de excepción de dominio', () => {
    const exception = new InvalidCargoWeightException(999, 0.001, 60);

    filter.catch(exception, mockHost);

    const [[body]] = mockResponse.json.mock.calls;
    expect(body.errorCode).toBe('INVALID_CARGO_WEIGHT');
  });
});
