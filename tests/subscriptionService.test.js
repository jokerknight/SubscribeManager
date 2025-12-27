const subscriptionService = require('../services/subscriptionService');
const { dbQuery, dbRun, withTransaction } = require('../utils');
const ApiError = require('../utils/ApiError');

// Mock dependencies
jest.mock('../utils', () => ({
  dbQuery: jest.fn(),
  dbRun: jest.fn(),
  withTransaction: jest.fn(),
  validateSubscriptionPath: jest.fn(() => true)
}));

jest.mock('../utils/ApiError');

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptions', () => {
    it('should return subscription list with node counts', async () => {
      const mockSubscriptions = [
        { path: 'test1', name: 'Test Subscription 1', nodeCount: 5 },
        { path: 'test2', name: 'Test Subscription 2', nodeCount: 3 }
      ];

      dbQuery.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getSubscriptions();

      expect(dbQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(result).toEqual(mockSubscriptions);
    });

    it('should return empty array when no subscriptions exist', async () => {
      dbQuery.mockResolvedValue([]);

      const result = await subscriptionService.getSubscriptions();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      dbQuery.mockRejectedValue(error);

      await expect(subscriptionService.getSubscriptions()).rejects.toThrow(error);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const name = 'Test Subscription';
      const path = 'test-subscription';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);
      dbQuery.mockResolvedValue([{ count: 0 }]);

      await subscriptionService.createSubscription(name, path);

      expect(validateSubscriptionPath).toHaveBeenCalledWith(path);
      expect(dbQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
        [path]
      );
      expect(dbRun).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (name, path) VALUES (?, ?)',
        [name, path]
      );
    });

    it('should throw error for invalid path', async () => {
      const name = 'Test Subscription';
      const path = 'invalid path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(false);
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.createSubscription(name, path))
        .rejects.toThrow('subscription.path_invalid');
    });

    it('should throw error for empty name', async () => {
      const name = '';
      const path = 'test-subscription';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.createSubscription(name, path))
        .rejects.toThrow('subscription.path_invalid');
    });

    it('should throw error when path already exists', async () => {
      const name = 'Test Subscription';
      const path = 'existing-path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);
      dbQuery.mockResolvedValue([{ count: 1 }]);
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.createSubscription(name, path))
        .rejects.toThrow('subscription.path_used');
    });

    it('should handle database errors during creation', async () => {
      const name = 'Test Subscription';
      const path = 'test-subscription';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);
      dbQuery.mockResolvedValue([{ count: 0 }]);
      dbRun.mockRejectedValue(new Error('Database error'));

      await expect(subscriptionService.createSubscription(name, path))
        .rejects.toThrow('Database error');
    });
  });

  describe('getSubscription', () => {
    it('should return subscription by path', async () => {
      const mockSubscription = {
        id: 1,
        name: 'Test Subscription',
        path: 'test-path'
      };

      dbQuery.mockResolvedValue([mockSubscription]);

      const result = await subscriptionService.getSubscription('test-path');

      expect(dbQuery).toHaveBeenCalledWith(
        'SELECT * FROM subscriptions WHERE path = ?',
        ['test-path']
      );
      expect(result).toEqual(mockSubscription);
    });

    it('should return undefined when subscription not found', async () => {
      dbQuery.mockResolvedValue([]);

      const result = await subscriptionService.getSubscription('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database query failed');
      dbQuery.mockRejectedValue(error);

      await expect(subscriptionService.getSubscription('test-path'))
        .rejects.toThrow(error);
    });
  });

  describe('generateSubscriptionContent', () => {
    it('should generate subscription content successfully', async () => {
      const mockSubscription = { id: 1, name: 'Test', path: 'test' };
      const mockNodes = [
        { original_link: 'ss://server1:8388' },
        { original_link: 'vmess://eyJ2IjoiV...' }
      ];

      // Mock getSubscription
      jest.spyOn(subscriptionService, 'getSubscription').mockResolvedValue(mockSubscription);
      dbQuery.mockResolvedValue(mockNodes);

      const result = await subscriptionService.generateSubscriptionContent('test');

      expect(subscriptionService.getSubscription).toHaveBeenCalledWith('test');
      expect(dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT original_link FROM nodes'),
        [1]
      );
      expect(result).toBe('ss://server1:8388\nvmess://eyJ2IjoiV...');
    });

    it('should return null for non-existent subscription', async () => {
      // Mock getSubscription to return undefined
      jest.spyOn(subscriptionService, 'getSubscription').mockResolvedValue(undefined);

      const result = await subscriptionService.generateSubscriptionContent('nonexistent');

      expect(result).toBeNull();
      expect(dbQuery).not.toHaveBeenCalled();
    });

    it('should only include enabled nodes', async () => {
      const mockSubscription = { id: 1, name: 'Test', path: 'test' };
      const mockNodes = [
        { original_link: 'ss://server1:8388' },
        { original_link: 'vmess://...' }
      ];

      jest.spyOn(subscriptionService, 'getSubscription').mockResolvedValue(mockSubscription);
      dbQuery.mockResolvedValue(mockNodes);

      await subscriptionService.generateSubscriptionContent('test');

      expect(dbQuery).toHaveBeenCalledWith(
        expect.stringContaining('(enabled IS NULL OR enabled = 1)'),
        [1]
      );
    });

    it('should handle empty nodes list', async () => {
      const mockSubscription = { id: 1, name: 'Test', path: 'test' };
      
      jest.spyOn(subscriptionService, 'getSubscription').mockResolvedValue(mockSubscription);
      dbQuery.mockResolvedValue([]);

      const result = await subscriptionService.generateSubscriptionContent('test');

      expect(result).toBe('');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const oldPath = 'old-path';
      const newName = 'Updated Name';
      const newPath = 'new-path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);
      dbQuery.mockResolvedValue([{ count: 0 }]);

      await subscriptionService.updateSubscription(oldPath, newName, newPath);

      expect(validateSubscriptionPath).toHaveBeenCalledWith(newPath);
      expect(dbQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM subscriptions WHERE path = ?',
        [newPath]
      );
      expect(dbRun).toHaveBeenCalledWith(
        'UPDATE subscriptions SET name = ?, path = ? WHERE path = ?',
        [newName, newPath, oldPath]
      );
    });

    it('should update subscription when path unchanged', async () => {
      const oldPath = 'same-path';
      const newName = 'Updated Name';
      const newPath = 'same-path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);

      await subscriptionService.updateSubscription(oldPath, newName, newPath);

      expect(dbQuery).toHaveBeenCalledWith(
        'UPDATE subscriptions SET name = ?, path = ? WHERE path = ?',
        [newName, newPath, oldPath]
      );
    });

    it('should throw error for invalid new path', async () => {
      const oldPath = 'old-path';
      const newName = 'Updated Name';
      const newPath = 'invalid path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(false);
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.updateSubscription(oldPath, newName, newPath))
        .rejects.toThrow('subscription.path_invalid');
    });

    it('should throw error for empty name', async () => {
      const oldPath = 'old-path';
      const newName = '';
      const newPath = 'new-path';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.updateSubscription(oldPath, newName, newPath))
        .rejects.toThrow('subscription.path_invalid');
    });

    it('should throw error when new path already exists', async () => {
      const oldPath = 'old-path';
      const newName = 'Updated Name';
      const newPath = 'existing-path';
      const { validateSubscriptionPath } = require('../utils');
      
      validateSubscriptionPath.mockReturnValue(true);
      dbQuery.mockResolvedValue([{ count: 1 }]);
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(subscriptionService.updateSubscription(oldPath, newName, newPath))
        .rejects.toThrow('subscription.path_used');
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription and its nodes', async () => {
      const path = 'test-path';
      const mockDb = {
        run: jest.fn()
      };

      withTransaction.mockImplementation(async (callback) => {
        await callback(mockDb);
      });

      await subscriptionService.deleteSubscription(path);

      expect(withTransaction).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM nodes WHERE subscription_id IN (SELECT id FROM subscriptions WHERE path = ?)',
        [path]
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM subscriptions WHERE path = ?',
        [path]
      );
    });

    it('should handle transaction errors', async () => {
      const path = 'test-path';
      const error = new Error('Transaction failed');
      
      withTransaction.mockRejectedValue(error);

      await expect(subscriptionService.deleteSubscription(path))
        .rejects.toThrow(error);
    });
  });
});