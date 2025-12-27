const nodeService = require('../services/nodeService');
const { dbRun, withTransaction } = require('../utils/database/operations');
const { 
  extractNodeName, 
  tryDecodeNodeContent, 
  cleanNodeLink, 
  isValidNodeLink, 
  NODE_TYPES, 
  safeBase64Decode 
} = require('../utils');
const ApiError = require('../utils/ApiError');
const BaseService = require('../services/baseService');
const { NodeRepository } = require('../utils/database/operations');

// Mock dependencies
jest.mock('../utils/database/operations');
jest.mock('../utils', () => ({
  extractNodeName: jest.fn((link) => link.split('#')[1] || 'Test Node'),
  tryDecodeNodeContent: jest.fn((link) => link),
  cleanNodeLink: jest.fn((link) => link),
  isValidNodeLink: jest.fn(() => true),
  NODE_TYPES: {
    VMess: 'vmess://',
    SS: 'ss://',
    VLESS: 'vless://',
    Trojan: 'trojan://',
    Hysteria2: 'hysteria2://',
    TUIC: 'tuic://',
    Snell: 'snell,'
  },
  safeBase64Decode: jest.fn((str) => str)
}));

jest.mock('../utils/ApiError');
jest.mock('../services/baseService');

describe('NodeService', () => {
  let mockBaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBaseService = {
      getSubscriptionIdByPath: jest.fn().mockResolvedValue(1)
    };
    BaseService.mockImplementation(() => mockBaseService);
    NodeRepository.findBySubscriptionPath = jest.fn();
    NodeRepository.create = jest.fn();
  });

  describe('getNodes', () => {
    it('should return nodes for subscription', async () => {
      const mockNodes = [
        { id: 1, name: 'Node 1', original_link: 'ss://server1' },
        { id: 2, name: 'Node 2', original_link: 'vmess://server2' }
      ];
      
      NodeRepository.findBySubscriptionPath.mockResolvedValue(mockNodes);

      const result = await nodeService.getNodes('test-subscription');

      expect(NodeRepository.findBySubscriptionPath).toHaveBeenCalledWith('test-subscription');
      expect(result).toEqual(mockNodes);
    });

    it('should handle empty nodes list', async () => {
      NodeRepository.findBySubscriptionPath.mockResolvedValue([]);

      const result = await nodeService.getNodes('test-subscription');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      NodeRepository.findBySubscriptionPath.mockRejectedValue(error);

      await expect(nodeService.getNodes('test-subscription'))
        .rejects.toThrow(error);
    });
  });

  describe('createNode', () => {
    it('should create node successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const name = 'Test Node';
      const content = 'ss://server:port';
      const order = 123;

      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      NodeRepository.create.mockResolvedValue();

      await nodeService.createNode(subscriptionPath, name, content, order);

      expect(mockBaseService.getSubscriptionIdByPath).toHaveBeenCalledWith(subscriptionPath);
      expect(cleanNodeLink).toHaveBeenCalledWith(content);
      expect(tryDecodeNodeContent).toHaveBeenCalledWith(content);
      expect(isValidNodeLink).toHaveBeenCalledWith(content);
      expect(extractNodeName).toHaveBeenCalledWith(content);
      expect(NodeRepository.create).toHaveBeenCalledWith({
        subscriptionId: 1,
        name: name,
        originalLink: content,
        nodeOrder: order
      });
    });

    it('should create node with default order', async () => {
      const subscriptionPath = 'test-subscription';
      const name = 'Test Node';
      const content = 'vmess://server';

      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      NodeRepository.create.mockResolvedValue();

      await nodeService.createNode(subscriptionPath, name, content);

      expect(NodeRepository.create).toHaveBeenCalledWith({
        subscriptionId: 1,
        name: name,
        originalLink: content,
        nodeOrder: 0
      });
    });

    it('should throw error for missing content', async () => {
      const subscriptionPath = 'test-subscription';
      const name = 'Test Node';
      const content = '';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.createNode(subscriptionPath, name, content))
        .rejects.toThrow('nodes.content_required');
    });

    it('should throw error for invalid node format', async () => {
      const subscriptionPath = 'test-subscription';
      const name = 'Test Node';
      const content = 'invalid-link';
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      const { isValidNodeLink } = require('../utils');
      isValidNodeLink.mockReturnValue(false);
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.createNode(subscriptionPath, name, content))
        .rejects.toThrow('nodes.unsupported_format');
    });

    it('should extract node name when not provided', async () => {
      const subscriptionPath = 'test-subscription';
      const name = null;
      const content = 'ss://server:port#MyNode';
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      const { extractNodeName } = require('../utils');
      extractNodeName.mockReturnValue('MyNode');
      NodeRepository.create.mockResolvedValue();

      await nodeService.createNode(subscriptionPath, name, content);

      expect(NodeRepository.create).toHaveBeenCalledWith({
        subscriptionId: 1,
        name: 'MyNode',
        originalLink: content,
        nodeOrder: 0
      });
    });
  });

  describe('updateNode', () => {
    it('should update node successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const content = 'vmess://updated-server';
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockResolvedValue();

      await nodeService.updateNode(subscriptionPath, nodeId, content);

      expect(mockBaseService.getSubscriptionIdByPath).toHaveBeenCalledWith(subscriptionPath);
      expect(dbRun).toHaveBeenCalledWith(
        'UPDATE nodes SET original_link = ?, name = ? WHERE id = ? AND subscription_id = ?',
        [content, expect.any(String), nodeId, 1]
      );
    });

    it('should throw error for missing content', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const content = '';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.updateNode(subscriptionPath, nodeId, content))
        .rejects.toThrow('nodes.content_required');
    });

    it('should try decode base64 content', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const content = 'base64content';
      const decodedContent = 'vmess://decoded-server';
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      const { safeBase64Decode, NODE_TYPES, extractNodeName } = require('../utils');
      safeBase64Decode.mockReturnValue(decodedContent);
      extractNodeName.mockReturnValue('DecodedNode');
      dbRun.mockResolvedValue();

      await nodeService.updateNode(subscriptionPath, nodeId, content);

      expect(safeBase64Decode).toHaveBeenCalledWith(content);
    });

    it('should handle decode errors gracefully', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const content = 'invalid-base64';
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      const { safeBase64Decode } = require('../utils');
      safeBase64Decode.mockImplementation(() => {
        throw new Error('Invalid base64');
      });
      dbRun.mockResolvedValue();

      await nodeService.updateNode(subscriptionPath, nodeId, content);

      expect(safeBase64Decode).toHaveBeenCalled();
      expect(dbRun).toHaveBeenCalled();
    });
  });

  describe('deleteNode', () => {
    it('should delete node successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockResolvedValue();

      await nodeService.deleteNode(subscriptionPath, nodeId);

      expect(mockBaseService.getSubscriptionIdByPath).toHaveBeenCalledWith(subscriptionPath);
      expect(dbRun).toHaveBeenCalledWith(
        'DELETE FROM nodes WHERE id = ? AND subscription_id = ?',
        [nodeId, 1]
      );
    });

    it('should handle database errors', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const error = new Error('Delete failed');
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockRejectedValue(error);

      await expect(nodeService.deleteNode(subscriptionPath, nodeId))
        .rejects.toThrow(error);
    });
  });

  describe('toggleNode', () => {
    it('should enable node successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const enabled = true;
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockResolvedValue();

      await nodeService.toggleNode(subscriptionPath, nodeId, enabled);

      expect(mockBaseService.getSubscriptionIdByPath).toHaveBeenCalledWith(subscriptionPath);
      expect(dbRun).toHaveBeenCalledWith(
        'UPDATE nodes SET enabled = ? WHERE id = ? AND subscription_id = ?',
        [1, nodeId, 1]
      );
    });

    it('should disable node successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const enabled = false;
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockResolvedValue();

      await nodeService.toggleNode(subscriptionPath, nodeId, enabled);

      expect(dbRun).toHaveBeenCalledWith(
        'UPDATE nodes SET enabled = ? WHERE id = ? AND subscription_id = ?',
        [0, nodeId, 1]
      );
    });

    it('should throw error for non-boolean enabled', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const enabled = 'true';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.toggleNode(subscriptionPath, nodeId, enabled))
        .rejects.toThrow('nodes.invalid_enabled');
    });

    it('should handle database errors', async () => {
      const subscriptionPath = 'test-subscription';
      const nodeId = 123;
      const enabled = true;
      const error = new Error('Update failed');
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      dbRun.mockRejectedValue(error);

      await expect(nodeService.toggleNode(subscriptionPath, nodeId, enabled))
        .rejects.toThrow(error);
    });
  });

  describe('reorderNodes', () => {
    it('should reorder nodes successfully', async () => {
      const subscriptionPath = 'test-subscription';
      const orders = [
        { id: 1, order: 0 },
        { id: 2, order: 1 },
        { id: 3, order: 2 }
      ];
      const mockDb = { run: jest.fn() };
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      withTransaction.mockImplementation(async (callback) => {
        await callback(mockDb);
      });

      await nodeService.reorderNodes(subscriptionPath, orders);

      expect(mockBaseService.getSubscriptionIdByPath).toHaveBeenCalledWith(subscriptionPath);
      expect(withTransaction).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledTimes(3);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE nodes SET node_order = ? WHERE id = ? AND subscription_id = ?',
        [0, 1, 1]
      );
    });

    it('should throw error for empty orders array', async () => {
      const subscriptionPath = 'test-subscription';
      const orders = [];
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.reorderNodes(subscriptionPath, orders))
        .rejects.toThrow('nodes.invalid_orders');
    });

    it('should throw error for non-array orders', async () => {
      const subscriptionPath = 'test-subscription';
      const orders = 'invalid';
      const MockedApiError = ApiError;
      MockedApiError.mockImplementation((code, message) => new Error(message));

      await expect(nodeService.reorderNodes(subscriptionPath, orders))
        .rejects.toThrow('nodes.invalid_orders');
    });

    it('should handle transaction errors', async () => {
      const subscriptionPath = 'test-subscription';
      const orders = [{ id: 1, order: 0 }];
      const error = new Error('Transaction failed');
      
      mockBaseService.getSubscriptionIdByPath.mockResolvedValue(1);
      withTransaction.mockRejectedValue(error);

      await expect(nodeService.reorderNodes(subscriptionPath, orders))
        .rejects.toThrow(error);
    });
  });
});