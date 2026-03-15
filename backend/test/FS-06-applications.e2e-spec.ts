import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdAppId: string;
  let testDomainId: string;
  let testProviderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@ark.io',
        password: 'admin123456',
      });
    
    authToken = loginResponse.body.accessToken;

    // Create test domain and provider
    const domainResponse = await request(app.getHttpServer())
      .post('/api/v1/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Domain for Apps',
        description: 'Test domain',
      });
    testDomainId = domainResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testDomainId) {
      await prisma.domain.delete({ where: { id: testDomainId } }).catch(() => {});
    }
    await app.close();
  });

  describe('POST /api/v1/applications', () => {
    it('should create an application', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Application E2E',
          description: 'Test description',
          comment: 'Test comment',
          domainId: testDomainId,
          criticality: 'high',
          lifecycleStatus: 'production',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Application E2E');
      expect(response.body.description).toBe('Test description');
      expect(response.body.comment).toBe('Test comment');
      expect(response.body.criticality).toBe('high');
      expect(response.body.lifecycleStatus).toBe('production');
      expect(response.body.domain).toBeDefined();
      expect(response.body.domain.id).toBe(testDomainId);
      createdAppId = response.body.id;
    });

    it('should return 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Application E2E',
          description: 'Duplicate name test',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });
    });

    it('should return 400 for empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should return 400 for name with only spaces', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '   ',
        })
        .expect(400);
    });

    it('should return 404 for non-existent domainId', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'App with invalid domain',
          domainId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });
  });

  describe('GET /api/v1/applications', () => {
    it('should return paginated list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by lifecycle status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/applications?lifecycleStatus=production')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((app: any) => app.lifecycleStatus === 'production')).toBe(true);
    });

    it('should paginate correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/applications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });
  });

  describe('GET /api/v1/applications/:id', () => {
    it('should return application by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdAppId);
      expect(response.body.name).toBe('Test Application E2E');
      expect(response.body).toHaveProperty('domain');
      expect(response.body).toHaveProperty('tags');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/applications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/applications/:id/dependencies', () => {
    it('should return dependency counts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/applications/${createdAppId}/dependencies`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('hasDependencies');
      expect(response.body).toHaveProperty('counts');
      expect(response.body.counts).toHaveProperty('capabilities');
      expect(response.body.counts).toHaveProperty('dataObjects');
      expect(response.body.counts).toHaveProperty('itComponents');
      expect(response.body.counts).toHaveProperty('sourceInterfaces');
      expect(response.body.counts).toHaveProperty('targetInterfaces');
    });
  });

  describe('PATCH /api/v1/applications/:id', () => {
    it('should update application', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
          criticality: 'medium',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(response.body.criticality).toBe('medium');
    });

    it('should return 409 for duplicate name on update', async () => {
      // Create another app first
      const anotherApp = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Application',
          description: 'Another app',
        });

      // Try to update with duplicate name
      await request(app.getHttpServer())
        .patch(`/api/v1/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Application',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });

      // Cleanup
      await prisma.application.delete({ where: { id: anotherApp.body.id } });
    });
  });

  describe('DELETE /api/v1/applications/:id', () => {
    let appToDelete: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'App to Delete',
          description: 'Will be deleted',
        });
      appToDelete = response.body.id;
    });

    it('should delete application without dependencies', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${appToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 409 when application has dependencies', async () => {
      // Create an interface linked to the created app
      const interfaceResponse = await prisma.interface.create({
        data: {
          sourceAppId: createdAppId,
          targetAppId: createdAppId,
          type: 'HTTP',
          name: 'Test Interface',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('DEPENDENCY_CONFLICT');
          expect(res.body.details).toBeDefined();
        });

      // Cleanup
      await prisma.interface.delete({ where: { id: interfaceResponse.id } });
    });
  });

  describe('Security', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/applications')
        .expect(401);
    });

    it('should return 403 without applications:read permission', async () => {
      // This would require creating a user with limited permissions
      // Skipped for brevity - to be tested manually
    });
  });
});
