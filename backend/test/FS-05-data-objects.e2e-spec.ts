import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DataObjects API (FS-05)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testDataObjectId: string;
  let testApplicationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Get auth token for admin user
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });

    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/data-objects', () => {
    // TEST 1: GET list authenticated returns 200 with paginated object
    it('should return 200 with paginated data objects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // TEST 2: GET list empty returns 200 with empty data array
    it('should return empty list if no data objects', async () => {
      // Clear data objects first
      await prisma.appDataObjectMap.deleteMany({});
      await prisma.dataObject.deleteMany({});

      const res = await request(app.getHttpServer())
        .get('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    // TEST 3: GET list with search filters by name insensitively
    it('should filter by search param', async () => {
      // Create a test data object
      await prisma.dataObject.create({
        data: {
          name: 'CustomerDB',
          description: 'Test',
          type: 'database',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/data-objects?search=customer')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data[0].name.toLowerCase().includes('customer'),
      ).toBe(true);
    });
  });

  describe('POST /api/v1/data-objects', () => {
    // TEST 4: POST with valid name returns 201 with DataObjectResponse
    it('should create data object and return 201', async () => {
      const createDto = {
        name: 'Test DataObject',
        description: 'Test description',
        type: 'database',
        isSourceOfTruth: false,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(createDto.name);
      expect(res.body.description).toBe(createDto.description);
      expect(res.body.type).toBe(createDto.type);

      testDataObjectId = res.body.id;
    });

    // TEST 5: POST creates audit trail entry with changed_by
    it('should create audit trail entry', async () => {
      const createDto = {
        name: 'AuditTest DataObject',
        description: 'Test',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      expect(res.status).toBe(201);

      const auditEntry = await prisma.auditTrail.findFirst({
        where: {
          entityType: 'data_objects',
          entityId: res.body.id,
          action: 'CREATE',
        },
      });

      expect(auditEntry).toBeDefined();
      expect(auditEntry.changedBy).not.toBeNull();
    });

    // TEST 6: POST with duplicate name returns 409 with code CONFLICT
    it('should return 409 for duplicate name', async () => {
      const createDto = {
        name: 'Duplicate Name',
      };

      // Create first one
      await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      // Try to create duplicate
      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    // TEST 7: POST without name returns 400
    it('should return 400 without name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });

    // TEST 8: POST with only spaces as name returns 400
    it('should return 400 for spaces-only name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
    });

    // TEST 9: POST stores type and isSourceOfTruth correctly
    it('should store type and isSourceOfTruth fields', async () => {
      const createDto = {
        name: 'TypeTest',
        type: 'file',
        isSourceOfTruth: true,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto);

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('file');
      expect(res.body.isSourceOfTruth).toBe(true);
    });
  });

  describe('GET /api/v1/data-objects/:id', () => {
    // TEST 10: GET detail existing returns 200 with _count.applications and tags
    it('should return data object with applications count', async () => {
      if (!testDataObjectId) {
        const createRes = await request(app.getHttpServer())
          .post('/api/v1/data-objects')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'DetailTest' });
        testDataObjectId = createRes.body.id;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/data-objects/${testDataObjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._count).toBeDefined();
      expect(res.body._count.appDataObjectMaps).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.tags)).toBe(true);
    });

    // TEST 11: GET detail non-existent UUID returns 404
    it('should return 404 for non-existent UUID', async () => {
      const fakeUUID = '550e8400-e29b-41d4-a716-446655440099';

      const res = await request(app.getHttpServer())
        .get(`/api/v1/data-objects/${fakeUUID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/data-objects/:id/applications', () => {
    // TEST 12: GET applications returns 200 with paginated list
    it('should return paginated list of linked applications', async () => {
      if (!testDataObjectId) {
        const createRes = await request(app.getHttpServer())
          .post('/api/v1/data-objects')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'AppLinkTest' });
        testDataObjectId = createRes.body.id;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/data-objects/${testDataObjectId}/applications`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // TEST 13: GET applications non-existent data object returns 404
    it('should return 404 if data object does not exist', async () => {
      const fakeUUID = '550e8400-e29b-41d4-a716-446655440099';

      const res = await request(app.getHttpServer())
        .get(`/api/v1/data-objects/${fakeUUID}/applications`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/data-objects/:id', () => {
    // TEST 14: PATCH description change returns 200
    it('should update data object and return 200', async () => {
      if (!testDataObjectId) {
        const createRes = await request(app.getHttpServer())
          .post('/api/v1/data-objects')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'UpdateTest' });
        testDataObjectId = createRes.body.id;
      }

      const updateDto = {
        description: 'Updated description',
      };

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/data-objects/${testDataObjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto);

      expect(res.status).toBe(200);
      expect(res.body.description).toBe(updateDto.description);
    });

    // TEST 15: PATCH duplicate name returns 409 with code CONFLICT
    it('should return 409 for duplicate name on update', async () => {
      // Create two objects
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Unique1' });

      const res2 = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Unique2' });

      // Try to rename res2 to res1's name
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/data-objects/${res2.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Unique1' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/v1/data-objects/:id', () => {
    // TEST 16: DELETE without applications returns 204
    it('should delete and return 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ToDelete' });

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/data-objects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify it's deleted
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/data-objects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });

    // TEST 17: DELETE with applications linked returns 409 with code DEPENDENCY_CONFLICT
    it('should return 409 if applications are linked', async () => {
      // Create data object
      const doRes = await request(app.getHttpServer())
        .post('/api/v1/data-objects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'LinkedDO' });

      // Create application
      const appRes = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'TestApp', description: 'Test' });

      // Link application to data object
      await prisma.appDataObjectMap.create({
        data: {
          applicationId: appRes.body.id,
          dataObjectId: doRes.body.id,
          role: 'consumer',
        },
      });

      // Try to delete
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/data-objects/${doRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(409);
      expect(deleteRes.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(deleteRes.body.details).toBeDefined();
      expect(deleteRes.body.details.applicationsCount).toBe(1);
    });
  });
});
