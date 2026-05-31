import prisma from '../lib/prisma.js';

export const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const findById = (id) =>
  prisma.user.findUnique({ where: { id } });

export const create = (data) =>
  prisma.user.create({
    data: {
      name: data.name,
      lastname: data.lastname,
      email: data.email,
      password: data.password,
    },
  });
