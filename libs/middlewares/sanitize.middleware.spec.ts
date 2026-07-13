import { sanitizeNoSql, SanitizeMiddleware } from './sanitize.middleware';
import { Request, Response } from 'express';

describe('SanitizeMiddleware (Unit Test)', () => {
  let middleware: SanitizeMiddleware;

  beforeEach(() => {
    middleware = new SanitizeMiddleware();
  });

  it('should strip keys starting with $ (NoSQL operator injection)', () => {
    const maliciousPayload = {
      username: 'admin',
      password: { $gt: '' },
    };

    const clean = sanitizeNoSql(maliciousPayload);

    expect(clean).toEqual({
      username: 'admin',
      password: {},
    });
  });

  it('should strip keys containing dots (property injection)', () => {
    const maliciousPayload = {
      'profile.role': 'admin',
      normalKey: 'safeValue',
    };

    const clean = sanitizeNoSql(maliciousPayload);

    expect(clean).toEqual({
      normalKey: 'safeValue',
    });
  });

  it('should recursively sanitize nested objects and arrays', () => {
    const complexPayload = {
      user: {
        name: 'John',
        filters: [{ $ne: null }, { valid: 'yes' }],
      },
    };

    const clean = sanitizeNoSql(complexPayload);

    expect(clean).toEqual({
      user: {
        name: 'John',
        filters: [{}, { valid: 'yes' }],
      },
    });
  });

  it('should sanitize req.body, req.query, and req.params in middleware use()', () => {
    const req = {
      body: { email: 'user@test.com', $where: 'sleep(5000)' },
      query: { search: 'lawyer', $gt: '' },
      params: { id: '123' },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.body).toEqual({ email: 'user@test.com' });
    expect(req.query).toEqual({ search: 'lawyer' });
    expect(req.params).toEqual({ id: '123' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
