import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getHealth } from '../../../../infrastructure/web/controllers/healthController.js';

describe('healthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    mockRequest = {};
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return 200 and healthy status', () => {
      getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Backend is healthy',
      }));
      expect(mockJson.mock.calls[0][0]).toHaveProperty('timestamp');
      expect(mockJson.mock.calls[0][0]).toHaveProperty('uptime');
    });
  });
});
