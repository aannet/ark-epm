import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('IT Components (e2e) - FS-04-BACK', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdItComponentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
  });

  afterAll(async () => {
    // Cleanup created IT component
    if (createdItComponentId) {
      await prisma.itComponent
        .delete({ where: { id: createdItComponentId } })
        .catch(() => {});
    }
    await app.close();
  });

  describe('GET /api/v1/it-components', () => {
    it('[Supertest] should return 200 with paginated object', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/it-components')
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

    it('[Supertest] should return empty data when filtering by non-existent search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/it-components?search=xyznonexistent999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('[Supertest] should filter by search term on name', async () => {
      // Create a component with unique name
      const uniqueName = `SearchTest ITC ${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: uniqueName, type: 'database' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/it-components?search=${encodeURIComponent('SearchTest ITC')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('SearchTest ITC');

      // Cleanup
      await prisma.itComponent.delete({ where: { id: created.body.id } }).catch(() => {});
    });

    it('[Supertest] should filter by type', async () => {
      // Create a component with specific type
      const uniqueName = `TypeFilter ITC ${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: uniqueName, type: 'test-type-unique-xyz' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/it-components?type=test-type-unique-xyz')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((item: any) => {
        expect(item.type).toBe('test-type-unique-xyz');
      });

      // Cleanup
      await prisma.itComponent.delete({ where: { id: created.body.id } }).catch(() => {});
    });
  });

  describe('POST /api/v1/it-components', () => {
    it('[Supertest] should return 201 with ITComponentResponse', async () => {
      const uniqueName = `Test IT Component ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: uniqueName,
          description: 'Test description',
          comment: 'Test comment',
          technology: 'PostgreSQL 16',
          type: 'database',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(uniqueName);
      expect(response.body.description).toBe('Test description');
      expect(response.body.comment).toBe('Test comment');
      expect(response.body.technology).toBe('PostgreSQL 16');
      expect(response.body.type).toBe('database');
      expect(response.body).toHaveProperty('_count');
      expect(response.body._count.applications).toBe(0);
      expect(response.body).toHaveProperty('tags');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      createdItComponentId = response.body.id;
    });

    it('[Supertest] should write audit_trail with changed_by non NULL', async () => {
      const auditRecords = await prisma.auditTrail.findMany({
        where: {
          entityType: 'it_components',
          entityId: createdItComponentId,
        },
        orderBy: { occurredAt: 'desc' },
        take: 1,
      });

      expect(auditRecords.length).toBeGreaterThan(0);
      expect(auditRecords[0].changedBy).not.toBeNull();
    });

    it('[Supertest] should return 409 for duplicate name', async () => {
      // Use the same name as the previously created component
      const existingComponent = await prisma.itComponent.findUnique({
        where: { id: createdItComponentId },
      });

      await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: existingComponent!.name,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });
    });

    it('[Supertest] should return 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No name provided',
        })
        .expect(400);
    });

    it('[Supertest] should return 400 when name is only spaces', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '   ',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/it-components/:id', () => {
    it('[Supertest] should return 200 with _count.applications and tags', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/it-components/${createdItComponentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdItComponentId);
      expect(response.body).toHaveProperty('_count');
      expect(response.body._count).toHaveProperty('applications');
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('comment');
    });

    it('[Supertest] should return 404 for non-existent UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/it-components/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/it-components/:id/applications', () => {
    it('[Supertest] should return 200 with paginated ApplicationListItem list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/it-components/${createdItComponentId}/applications`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[Supertest] should return 404 when IT Component not found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/it-components/123e4567-e89b-12d3-a456-426614174999/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/it-components/:id', () => {
    it('[Supertest] should return 200 when updating description', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/it-components/${createdItComponentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('[Supertest] should return 409 when updating to duplicate name', async () => {
      // Create another IT component
      const otherComponent = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Other ITC ${Date.now()}` })
        .expect(201);

      // Try to rename our component to the other's name
      await request(app.getHttpServer())
        .patch(`/api/v1/it-components/${createdItComponentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: otherComponent.body.name })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('CONFLICT');
        });

      // Cleanup
      await prisma.itComponent.delete({ where: { id: otherComponent.body.id } }).catch(() => {});
    });
  });

  describe('DELETE /api/v1/it-components/:id', () => {
    it('[Supertest] should return 204 when no applications are linked', async () => {
      // Create a temp component for deletion
      const tempComponent = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Delete Test ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/it-components/${tempComponent.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('[Supertest] should return 409 with DEPENDENCY_CONFLICT when applications are linked', async () => {
      // Create an IT component
      const itcResponse = await request(app.getHttpServer())
        .post('/api/v1/it-components')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Dependency ITC ${Date.now()}`, type: 'database' })
        .expect(201);
      const itcId = itcResponse.body.id;

      // Create an application via API
      const appResponse = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `Linked App ${Date.now()}` })
        .expect(201);
      const appId = appResponse.body.id;

      // Link application to IT component via junction table
      await prisma.appItComponentMap.create({
        data: { applicationId: appId, itComponentId: itcId },
      });

      // Try to delete the IT component
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/it-components/${itcId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(deleteResponse.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(deleteResponse.body.details).toHaveProperty('applicationsCount');
      expect(deleteResponse.body.details.applicationsCount).toBeGreaterThan(0);

      // Cleanup
      await prisma.appItComponentMap.delete({
        where: { applicationId_itComponentId: { applicationId: appId, itComponentId: itcId } },
      }).catch(() => {});
      await prisma.application.delete({ where: { id: appId } }).catch(() => {});
      await prisma.itComponent.delete({ where: { id: itcId } }).catch(() => {});
    });
  });
});
