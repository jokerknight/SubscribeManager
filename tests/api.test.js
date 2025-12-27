const request = require('supertest');
const express = require('express');
const session = require('express-session');
const path = require('path');

// Mock services and middleware
jest.mock('../services/subscriptionService');
jest.mock('../services/nodeService');
jest.mock('../services/sessionService');
jest.mock('../middleware/languageHandler');
jest.mock('../middleware/errorHandler');

const subscriptionService = require('../services/subscriptionService');
const nodeService = require('../services/nodeService');
const sessionService = require('../services/sessionService');

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Mock authentication middleware
const mockRequireAuth = (req, res, next) => {
  req.session = { sessionId: 'test-session' };
  sessionService.verifyAndRenewSession.mockResolvedValue(true);
  next();
};

// Setup routes
const apiRoutes = require('../routes/api');
app.use('/api', mockRequireAuth, apiRoutes);

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/subscriptions', () => {
    it('should return subscription list', async () => {
      const mockSubscriptions = [
        { path: 'test1', name: 'Test 1', nodeCount: 5 },
        { path: 'test2', name: 'Test 2', nodeCount: 3 }
      ];

      subscriptionService.getSubscriptions.mockResolvedValue(mockSubscriptions);

      const response = await request(app)
        .get('/api/subscriptions')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSubscriptions
      });
      expect(subscriptionService.getSubscriptions).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      subscriptionService.getSubscriptions.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/subscriptions')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/subscriptions', () => {
    it('should create new subscription', async () => {
      const newSubscription = { name: 'Test Subscription', path: 'test-sub' };
      
      subscriptionService.createSubscription.mockResolvedValue();

      const response = await request(app)
        .post('/api/subscriptions')
        .send(newSubscription)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'subscription.created'
      });
      expect(subscriptionService.createSubscription).toHaveBeenCalledWith(
        newSubscription.name,
        newSubscription.path
      );
    });

    it('should validate required fields', async () => {
      const invalidData = { name: '', path: '' };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle service errors', async () => {
      const error = new Error('Creation failed');
      subscriptionService.createSubscription.mockRejectedValue(error);
      
      const response = await request(app)
        .post('/api/subscriptions')
        .send({ name: 'Test', path: 'test' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/subscriptions/:path', () => {
    it('should return subscription by path', async () => {
      const path = 'test-subscription';
      const mockSubscription = { id: 1, name: 'Test', path: path };

      subscriptionService.getSubscription.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get(`/api/subscriptions/${path}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSubscription
      });
      expect(subscriptionService.getSubscription).toHaveBeenCalledWith(path);
    });

    it('should return 404 for non-existent subscription', async () => {
      const path = 'nonexistent';
      const error = new Error('Not found');
      error.code = 404;
      subscriptionService.getSubscription.mockRejectedValue(error);

      await request(app)
        .get(`/api/subscriptions/${path}`)
        .expect(404);
    });
  });

  describe('PUT /api/subscriptions/:path', () => {
    it('should update subscription', async () => {
      const path = 'old-path';
      const updateData = { name: 'Updated Name', path: 'new-path' };

      subscriptionService.updateSubscription.mockResolvedValue();

      const response = await request(app)
        .put(`/api/subscriptions/${path}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'subscription.updated'
      });
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(
        path,
        updateData.name,
        updateData.path
      );
    });

    it('should handle validation errors', async () => {
      const path = 'test-path';
      const invalidData = { name: '', path: 'invalid-path' };
      const error = new Error('Validation failed');
      error.code = 400;
      subscriptionService.updateSubscription.mockRejectedValue(error);

      await request(app)
        .put(`/api/subscriptions/${path}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('DELETE /api/subscriptions/:path', () => {
    it('should delete subscription', async () => {
      const path = 'test-path';

      subscriptionService.deleteSubscription.mockResolvedValue();

      const response = await request(app)
        .delete(`/api/subscriptions/${path}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'subscription.deleted'
      });
      expect(subscriptionService.deleteSubscription).toHaveBeenCalledWith(path);
    });

    it('should handle service errors', async () => {
      const path = 'test-path';
      const error = new Error('Delete failed');
      subscriptionService.deleteSubscription.mockRejectedValue(error);

      const response = await request(app)
        .delete(`/api/subscriptions/${path}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Node Management Routes', () => {
    describe('GET /api/subscriptions/:path/nodes', () => {
      it('should return nodes for subscription', async () => {
        const path = 'test-subscription';
        const mockNodes = [
          { id: 1, name: 'Node 1', original_link: 'vmess://...' },
          { id: 2, name: 'Node 2', original_link: 'ss://...' }
        ];

        nodeService.getNodes.mockResolvedValue(mockNodes);

        const response = await request(app)
          .get(`/api/subscriptions/${path}/nodes`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockNodes
        });
        expect(nodeService.getNodes).toHaveBeenCalledWith(path);
      });
    });

    describe('POST /api/subscriptions/:path/nodes', () => {
      it('should create new node', async () => {
        const path = 'test-subscription';
        const nodeData = {
          name: 'Test Node',
          content: 'vmess://test-server',
          order: 1
        };

        nodeService.createNode.mockResolvedValue();

        const response = await request(app)
          .post(`/api/subscriptions/${path}/nodes`)
          .send(nodeData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'nodes.added'
        });
        expect(nodeService.createNode).toHaveBeenCalledWith(
          path,
          nodeData.name,
          nodeData.content,
          nodeData.order
        );
      });

      it('should validate required fields', async () => {
        const path = 'test-subscription';
        const invalidData = { name: 'Test', content: '' };

        const response = await request(app)
          .post(`/api/subscriptions/${path}/nodes`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/subscriptions/:path/nodes/:id', () => {
      it('should update node', async () => {
        const path = 'test-subscription';
        const nodeId = 123;
        const updateData = { content: 'vmess://updated-server' };

        nodeService.updateNode.mockResolvedValue();

        const response = await request(app)
          .put(`/api/subscriptions/${path}/nodes/${nodeId}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'nodes.edited'
        });
        expect(nodeService.updateNode).toHaveBeenCalledWith(
          path,
          nodeId,
          updateData.content
        );
      });
    });

    describe('DELETE /api/subscriptions/:path/nodes/:id', () => {
      it('should delete node', async () => {
        const path = 'test-subscription';
        const nodeId = 123;

        nodeService.deleteNode.mockResolvedValue();

        const response = await request(app)
          .delete(`/api/subscriptions/${path}/nodes/${nodeId}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'nodes.deleted'
        });
        expect(nodeService.deleteNode).toHaveBeenCalledWith(path, nodeId);
      });
    });

    describe('PATCH /api/subscriptions/:path/nodes/:id', () => {
      it('should toggle node status', async () => {
        const path = 'test-subscription';
        const nodeId = 123;
        const toggleData = { enabled: true };

        nodeService.toggleNode.mockResolvedValue();

        const response = await request(app)
          .patch(`/api/subscriptions/${path}/nodes/${nodeId}`)
          .send(toggleData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'nodes.enabled'
        });
        expect(nodeService.toggleNode).toHaveBeenCalledWith(path, nodeId, true);
      });

      it('should handle invalid enabled value', async () => {
        const path = 'test-subscription';
        const nodeId = 123;
        const invalidData = { enabled: 'true' };

        const response = await request(app)
          .patch(`/api/subscriptions/${path}/nodes/${nodeId}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/subscriptions/:path/nodes/reorder', () => {
      it('should reorder nodes', async () => {
        const path = 'test-subscription';
        const reorderData = {
          orders: [
            { id: 1, order: 0 },
            { id: 2, order: 1 },
            { id: 3, order: 2 }
          ]
        };

        nodeService.reorderNodes.mockResolvedValue();

        const response = await request(app)
          .post(`/api/subscriptions/${path}/nodes/reorder`)
          .send(reorderData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'nodes.sort_updated'
        });
        expect(nodeService.reorderNodes).toHaveBeenCalledWith(path, reorderData.orders);
      });

      it('should validate orders array', async () => {
        const path = 'test-subscription';
        const invalidData = { orders: [] };

        const response = await request(app)
          .post(`/api/subscriptions/${path}/nodes/reorder`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Authentication Tests', () => {
    it('should require authentication for API routes', async () => {
      // Test without mock authentication
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/api', apiRoutes);

      const response = await request(appNoAuth)
        .get('/api/subscriptions')
        .expect(401);

      expect(response.body.error.code).toBe(401);
      expect(response.body.error.message).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      const error = new Error('Unexpected error');
      subscriptionService.getSubscriptions.mockImplementation(() => {
        throw error;
      });

      const response = await request(app)
        .get('/api/subscriptions')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});