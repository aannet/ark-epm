import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const request = supertest.default;

describe('DomainsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

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

    prisma = app.get<PrismaService>(PrismaService);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });
    token = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /domains', () => {
    it('should return array of domains', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array when no domains exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /domains/:id', () => {
    it('should return 404 for non-existent uuid', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(response.body.code).toBe('DOMAIN_NOT_FOUND');
    });
  });

  describe('POST /domains', () => {
    it('should create a domain', async () => {
      const uniqueName = `Test Domain ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName, description: 'Test description' })
        .expect(201);
      expect(response.body.name).toBe(uniqueName);
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test description' })
        .expect(400);
    });

    it('should return 400 when name is whitespace only', async () => {
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '   ' })
        .expect(400);
    });

    it('should return 409 for duplicate name', async () => {
      const uniqueName = `Duplicate ${Date.now()}`;
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName })
        .expect(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /domains/:id', () => {
    it('should update a domain', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Update Test ${Date.now()}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated description' })
        .expect(200);
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 409 for duplicate name', async () => {
      const domain1 = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain1 ${Date.now()}` })
        .expect(201);

      const domain2 = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain2 ${Date.now()}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/domains/${domain2.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: domain1.body.name })
        .expect(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /domains/:id', () => {
    it('should delete a domain with no linked entities', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Delete Test ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });
});
