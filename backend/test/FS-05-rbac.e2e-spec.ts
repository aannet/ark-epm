import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Data Objects RBAC Manual Tests (FS-05)', () => {
  let app: INestApplication<App>;
  let _prisma: PrismaService;
  let adminToken: string;

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

    _prisma = moduleFixture.get(PrismaService);

    // Get token for admin user
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RBAC Case 1: Create requires data-objects:write permission', () => {
    it('should create data object with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/data-objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test DO ${Date.now()}`,
          type: 'ENTITY',
          isSourceOfTruth: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBeDefined();
    });
  });

  describe('RBAC Case 2: Update requires data-objects:write permission', () => {
    it('should update data object with admin token', async () => {
      // First create
      const createRes = await request(app.getHttpServer())
        .post('/data-objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test DO Update ${Date.now()}`,
          type: 'ENTITY',
          isSourceOfTruth: true,
        })
        .expect(201);

      const doId = createRes.body.id;

      // Then update
      const response = await request(app.getHttpServer())
        .patch(`/data-objects/${doId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Updated DO ${Date.now()}`,
        })
        .expect(200);

      expect(response.body.name).toContain('Updated');
    });
  });

  describe('RBAC Case 3: Delete requires data-objects:write permission', () => {
    it('should delete data object with admin token', async () => {
      // First create
      const createRes = await request(app.getHttpServer())
        .post('/data-objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test DO Delete ${Date.now()}`,
          type: 'ENTITY',
          isSourceOfTruth: true,
        })
        .expect(201);

      const doId = createRes.body.id;

      // Then delete
      await request(app.getHttpServer())
        .delete(`/data-objects/${doId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('RBAC Case 4: Read requires data-objects:read permission', () => {
    it('should get all data objects with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/data-objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('RBAC Case 5: Get detail requires data-objects:read permission', () => {
    it('should get single data object with admin token', async () => {
      // First create
      const createRes = await request(app.getHttpServer())
        .post('/data-objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test DO Detail ${Date.now()}`,
          type: 'ENTITY',
          isSourceOfTruth: true,
        })
        .expect(201);

      const doId = createRes.body.id;

      // Then get detail
      const response = await request(app.getHttpServer())
        .get(`/data-objects/${doId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(doId);
      expect(response.body._count).toHaveProperty('appDataObjectMaps');
    });
  });
});
