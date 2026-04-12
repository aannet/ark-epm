import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { InterfaceType, InterfaceFrequency, CriticalityLevel } from '@prisma/client';

// Increase timeout for all tests
jest.setTimeout(30000);

describe('FS-08 Interfaces (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let sourceAppId: string;
  let targetAppId: string;
  let interfaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });

    authToken = loginResponse.body.access_token;
    expect(authToken).toBeDefined();

    // Create two applications for testing
    const app1Response = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Source App ${Date.now()}`,
        description: 'Test source application',
      });
    sourceAppId = app1Response.body.id;
    expect(sourceAppId).toBeDefined();

    const app2Response = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Target App ${Date.now()}`,
        description: 'Test target application',
      });
    targetAppId = app2Response.body.id;
    expect(targetAppId).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup: delete created interface if exists
    if (interfaceId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    // Cleanup: delete created applications
    if (sourceAppId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${sourceAppId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    if (targetAppId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${targetAppId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    await app.close();
  });

  describe('GET /api/v1/interfaces', () => {
    it('[Supertest] should return 200 with array', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('[Supertest] should return empty array when no interfaces', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/interfaces?search=NONEXISTENTXYZ123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('[Supertest] should filter by sourceAppId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/interfaces?sourceAppId=${sourceAppId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[Supertest] should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/interfaces?type=${InterfaceType.REST}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/interfaces', () => {
    it('[Supertest] should create interface with valid payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Interface',
          sourceAppId,
          targetAppId,
          type: InterfaceType.REST,
          frequency: InterfaceFrequency.DAILY,
          criticality: CriticalityLevel.HIGH,
          technicalContact: 'test@example.com',
          errorRate: 0.5,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Interface');
      expect(response.body.sourceApp).toBeDefined();
      expect(response.body.targetApp).toBeDefined();

      interfaceId = response.body.id;
    });

    it('[Supertest] should create audit trail entry', async () => {
      // Verify audit trail entry was created
      const auditEntry = await prisma.auditTrail.findFirst({
        where: {
          entityType: 'interfaces',
          entityId: interfaceId,
          action: 'CREATE',
        },
      });

      expect(auditEntry).toBeDefined();
      expect(auditEntry.changedBy).toBeDefined();
    });

    it('[Supertest] should return 400 without sourceAppId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetAppId,
          type: InterfaceType.REST,
        });

      expect(response.status).toBe(400);
    });

    it('[Supertest] should return 400 without targetAppId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId,
          type: InterfaceType.REST,
        });

      expect(response.status).toBe(400);
    });

    it('[Supertest] should return 400 without type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId,
          targetAppId,
        });

      expect(response.status).toBe(400);
    });

    it('[Supertest] should return 422 when sourceAppId equals targetAppId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId,
          targetAppId: sourceAppId,
          type: InterfaceType.REST,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe('SELF_REFERENCE');
    });

    it('[Supertest] should return 404 for non-existent source app', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId: '00000000-0000-0000-0000-000000000000',
          targetAppId,
          type: InterfaceType.REST,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('APPLICATION_NOT_FOUND');
    });

    it('[Supertest] should return 404 for non-existent target app', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/interfaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId,
          targetAppId: '00000000-0000-0000-0000-000000000000',
          type: InterfaceType.REST,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('APPLICATION_NOT_FOUND');
    });
  });

  describe('GET /api/v1/interfaces/:id', () => {
    it('[Supertest] should return interface with source and target apps', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(interfaceId);
      expect(response.body.sourceApp).toBeDefined();
      expect(response.body.sourceApp.id).toBe(sourceAppId);
      expect(response.body.targetApp).toBeDefined();
      expect(response.body.targetApp.id).toBe(targetAppId);
    });

    it('[Supertest] should return 404 for non-existent interface', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/interfaces/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/interfaces/:id', () => {
    it('[Supertest] should update interface with partial fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Interface Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Interface Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('[Supertest] should return 422 when sourceAppId equals targetAppId on update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceAppId,
          targetAppId: sourceAppId,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe('SELF_REFERENCE');
    });
  });

  describe('DELETE /api/v1/interfaces/:id', () => {
    it('[Supertest] should delete existing interface', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/interfaces/${interfaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('[Supertest] should return 404 for non-existent interface', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/interfaces/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
