import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as repository from './user.repository.js';

const sessions = new Map();

export const register = async (data) => {
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await repository.create({ ...data, password: hashed });
  const { password, ...safe } = user;
  return safe;
};

export const login = async (email, password) => {
  const user = await repository.findByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
  const token = randomUUID();
  sessions.set(token, { id: user.id, email: user.email, name: user.name });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
};

export const getSession = (token) => sessions.get(token) ?? null;
