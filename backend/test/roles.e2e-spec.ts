import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const request = supertest.default;

describe('RolesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let testRoleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });
    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/roles (GET)', () => {
    it('should return 200 with roles list', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .expect(401);
    });
  });

  describe('/roles (POST)', () => {
    it('should create a new role', async () => {
      const uniqueName = `TestRole${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueName,
          description: 'Test role description',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(uniqueName);
      testRoleId = response.body.id;
    });

    it('should return 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin' })
        .expect(409);
    });
  });

  describe('/roles/:id (GET)', () => {
    it('should return role by id with permissions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testRoleId);
      expect(response.body).toHaveProperty('rolePermissions');
    });
  });

  describe('/roles/:id (PATCH)', () => {
    it('should update a role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('/roles/:id (DELETE)', () => {
    it('should return 204 for successful deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 409 when role is assigned to users', async () => {
      const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
      
      await request(app.getHttpServer())
        .delete(`/roles/${adminRole!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });
  });

  describe('/roles/:id/permissions (PUT)', () => {
    it('should update role permissions', async () => {
      const permissions = await prisma.permission.findMany();
      const permIds = permissions.slice(0, 2).map(p => p.id);

      const response = await request(app.getHttpServer())
        .put(`/roles/${testRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionIds: permIds })
        .expect(200);

      expect(response.body).toHaveProperty('rolePermissions');
    });
  });
});
