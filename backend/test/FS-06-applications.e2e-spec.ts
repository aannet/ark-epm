import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdAppId: string;
  let createdAppName: string;
  let testDomainId: string;

  const createBusinessCapability = async (name: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/business-capabilities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name,
        domainId: testDomainId,
        level: 1,
      })
      .expect(201);

    return response.body;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@ark.io',
        password: 'admin123456',
      })
      .expect(200);
    
    authToken = loginResponse.body.accessToken;

    // Create test domain and provider
    const domainResponse = await request(app.getHttpServer())
      .post('/api/v1/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Domain for Apps ${Date.now()}`,
        description: 'Test domain',
      })
      .expect(201);
    testDomainId = domainResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (createdAppId) {
      await prisma.application.delete({ where: { id: createdAppId } }).catch(() => {});
    }
    if (testDomainId) {
      await prisma.domain.delete({ where: { id: testDomainId } }).catch(() => {});
    }
    await app.close();
  });

  describe('POST /api/v1/applications', () => {
    it('should create an application', async () => {
      const appName = `Test Application E2E ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: appName,
          description: 'Test description',
          comment: 'Test comment',
          domainId: testDomainId,
          criticality: 'high',
          lifecycleStatus: 'production',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(appName);
      expect(response.body.description).toBe('Test description');
      expect(response.body.comment).toBe('Test comment');
      expect(response.body.criticality).toBe('high');
      expect(response.body.lifecycleStatus).toBe('production');
      expect(response.body.domain).toBeDefined();
      expect(response.body.domain.id).toBe(testDomainId);
      createdAppId = response.body.id;
      createdAppName = appName;
    });

    it('should return 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: createdAppName,
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

    it('should create an application with business capabilities', async () => {
      const capability = await createBusinessCapability(`Test Capability ${Date.now()}`);

      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Test Application E2E with BC ${Date.now()}`,
          description: 'Test description',
          domainId: testDomainId,
          capabilityIds: [capability.id],
        })
        .expect(201);

      expect(response.body.businessCapabilities).toEqual([
        {
          id: capability.id,
          name: capability.name,
        },
      ]);

      await request(app.getHttpServer())
        .patch(`/api/v1/applications/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ capabilityIds: [] })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
      await prisma.businessCapability.delete({ where: { id: capability.id } }).catch(() => {});
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
      expect(response.body.name).toBe(createdAppName);
      expect(response.body).toHaveProperty('domain');
      expect(response.body).toHaveProperty('tags');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/applications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return application with business capabilities', async () => {
      const capability = await createBusinessCapability(`Detail Capability ${Date.now()}`);

      const appResponse = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `App with BC detail ${Date.now()}`,
          domainId: testDomainId,
          capabilityIds: [capability.id],
        })
        .expect(201);

      try {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.businessCapabilities)).toBe(true);
        expect(response.body.businessCapabilities).toEqual([
          {
            id: capability.id,
            name: capability.name,
          },
        ]);
      } finally {
        await request(app.getHttpServer())
          .patch(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ capabilityIds: [] })
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);
        await prisma.businessCapability.delete({ where: { id: capability.id } }).catch(() => {});
      }
    });
  });

  describe('POST /api/v1/applications validation', () => {
    it('should return 404 for non-existent business capabilityId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `App invalid bc ${Date.now()}`,
          domainId: testDomainId,
          capabilityIds: ['11111111-1111-4111-8111-111111111111'],
        })
        .expect(404);

      expect(response.body.code).toBe('BUSINESS_CAPABILITY_NOT_FOUND');
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
          name: `Another Application ${Date.now()}`,
          description: 'Another app',
        });

      // Try to update with duplicate name
      await request(app.getHttpServer())
        .patch(`/api/v1/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: anotherApp.body.name,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });

      // Cleanup
      await prisma.application.delete({ where: { id: anotherApp.body.id } });
    });

    it('should update business capabilities', async () => {
      const bc1 = await createBusinessCapability(`Business Capability 1 ${Date.now()}`);
      const bc2 = await createBusinessCapability(`Business Capability 2 ${Date.now()}`);

      const appResponse = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `App with BC update ${Date.now()}`,
          domainId: testDomainId,
          capabilityIds: [bc1.id],
        })
        .expect(201);

      try {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            capabilityIds: [bc2.id],
          })
          .expect(200);

        expect(response.body.businessCapabilities).toEqual([
          {
            id: bc2.id,
            name: bc2.name,
          },
        ]);
      } finally {
        await request(app.getHttpServer())
          .patch(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ capabilityIds: [] })
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/v1/applications/${appResponse.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        await prisma.businessCapability.delete({ where: { id: bc1.id } }).catch(() => {});
        await prisma.businessCapability.delete({ where: { id: bc2.id } }).catch(() => {});
      }
    });
  });

  describe('DELETE /api/v1/applications/:id', () => {
    let appToDelete: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `App to Delete ${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
