import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const request = supertest.default;

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let testUserId: string;

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

  describe('/users (GET)', () => {
    it('should return 200 with users list', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user', async () => {
      const uniqueEmail = `newuser${Date.now()}@ark.io`;
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: uniqueEmail,
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(uniqueEmail);
      expect(response.body).not.toHaveProperty('passwordHash');
      testUserId = response.body.id;
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@ark.io',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
    });

    it('should return 404 for unknown id', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should return 204 and set isActive to false', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.isActive).toBe(false);
    });
  });
});
