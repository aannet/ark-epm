import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const request = supertest.default;

describe('Providers (e2e) - FS-03-BACK', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdProviderId: string;
  let testDomainId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@ark.io',
        password: 'admin123456',
      });
    
    authToken = loginResponse.body.accessToken;

    // Create test domain for linked applications tests
    const domainResponse = await request(app.getHttpServer())
      .post('/domains')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Test Domain ${Date.now()}`,
        description: 'Test domain for providers e2e',
      });
    testDomainId = domainResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup: delete provider if exists
    if (createdProviderId) {
      await prisma.provider.delete({ where: { id: createdProviderId } }).catch(() => {});
    }
    if (testDomainId) {
      await prisma.domain.delete({ where: { id: testDomainId } }).catch(() => {});
    }
    await app.close();
  });

  describe('GET /providers', () => {
    it('[Supertest] should return 200 with paginated list', async () => {
      const response = await request(app.getHttpServer())
        .get('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('[Supertest] should return empty array when filtering by non-existent search', async () => {
      const response = await request(app.getHttpServer())
        .get('/providers?search=xyznonexistent123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('[Supertest] should filter by search term on name', async () => {
      // First create a provider with unique name
      const uniqueName = `Salesforce Search Test ${Date.now()}`;
      await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: uniqueName })
        .expect(201);

      // Search for it
      const response = await request(app.getHttpServer())
        .get(`/providers?search=${encodeURIComponent('Salesforce Search Test')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Salesforce');
    });
  });

  describe('POST /providers', () => {
    it('[Supertest] should return 201 with ProviderResponse', async () => {
      const uniqueName = `Test Provider ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: uniqueName,
          description: 'Test description',
          contractType: 'SaaS',
          expiryDate: '2026-12-31',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(uniqueName);
      expect(response.body.description).toBe('Test description');
      expect(response.body.contractType).toBe('SaaS');
      expect(response.body.expiryDate).toBeDefined();
      expect(response.body).toHaveProperty('_count');
      expect(response.body._count.applications).toBe(0);
      expect(response.body).toHaveProperty('tags');
      createdProviderId = response.body.id;
    });

    it('[Supertest] should write audit_trail entry', async () => {
      // The audit is created by trigger - we verify it exists
      // Note: changedBy may be null in test environment due to middleware differences
      const auditRecords = await prisma.auditTrail.findMany({
        where: {
          entityType: 'providers',
          entityId: createdProviderId,
        },
        orderBy: { occurredAt: 'desc' },
        take: 1,
      });

      expect(auditRecords.length).toBeGreaterThan(0);
      // Audit record exists - this validates the trigger is working
      expect(auditRecords[0].action).toBe('INSERT');
    });

    it('[Supertest] should return 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Salesforce', // This should exist from seed
          description: 'Duplicate name test',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });
    });

    it('[Supertest] should return 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No name provided',
        })
        .expect(400);
    });

    it('[Supertest] should return 400 when name is only spaces', async () => {
      await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '   ',
        })
        .expect(400);
    });

    it('[Supertest] should store expiryDate correctly', async () => {
      const uniqueName = `Expiry Test ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: uniqueName,
          expiryDate: '2025-06-15',
        })
        .expect(201);

      // Verify the date is stored
      expect(response.body.expiryDate).toContain('2025-06-15');

      // Cleanup
      await prisma.provider.delete({ where: { id: response.body.id } }).catch(() => {});
    });
  });

  describe('GET /providers/:id', () => {
    it('[Supertest] should return 200 with _count.applications and tags', async () => {
      const response = await request(app.getHttpServer())
        .get(`/providers/${createdProviderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdProviderId);
      expect(response.body).toHaveProperty('_count');
      expect(response.body._count).toHaveProperty('applications');
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    it('[Supertest] should return 404 for non-existent UUID', async () => {
      await request(app.getHttpServer())
        .get('/providers/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.code).toBe('PROVIDER_NOT_FOUND');
        });
    });
  });

  describe('GET /providers/:id/applications', () => {
    it('[Supertest] should return 200 with paginated ApplicationListItem list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/providers/${createdProviderId}/applications`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[Supertest] should return 404 when provider not found', async () => {
      await request(app.getHttpServer())
        .get('/providers/123e4567-e89b-12d3-a456-426614174999/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.code).toBe('PROVIDER_NOT_FOUND');
        });
    });
  });

  describe('PATCH /providers/:id', () => {
    it('[Supertest] should return 200 when updating description', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/providers/${createdProviderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('[Supertest] should return 409 when updating to duplicate name', async () => {
      // First create another provider
      const otherProvider = await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Other Provider ${Date.now()}` })
        .expect(201);

      // Try to update our provider with this name
      await request(app.getHttpServer())
        .patch(`/providers/${createdProviderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: otherProvider.body.name,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });

      // Cleanup
      await prisma.provider.delete({ where: { id: otherProvider.body.id } }).catch(() => {});
    });
  });

  describe('DELETE /providers/:id', () => {
    it('[Supertest] should return 204 when provider has no linked applications', async () => {
      // Create a new provider specifically for deletion test
      const tempProvider = await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Delete Test ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/providers/${tempProvider.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('[Supertest] should return 409 with DEPENDENCY_CONFLICT when provider has linked applications', async () => {
      // Create a provider
      const providerResponse = await request(app.getHttpServer())
        .post('/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Dependency Test ${Date.now()}` })
        .expect(201);
      const providerId = providerResponse.body.id;

      // Create an application linked to this provider
      const appResponse = await request(app.getHttpServer())
        .post('/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Linked App ${Date.now()}`,
          providerId: providerId,
          domainId: testDomainId,
        })
        .expect(201);

      // Try to delete the provider
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/providers/${providerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(deleteResponse.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(deleteResponse.body.details).toHaveProperty('applicationsCount');
      expect(deleteResponse.body.details.applicationsCount).toBeGreaterThan(0);

      // Cleanup
      await prisma.application.delete({ where: { id: appResponse.body.id } }).catch(() => {});
      await prisma.provider.delete({ where: { id: providerId } }).catch(() => {});
    });
  });
});
