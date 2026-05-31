import prisma from '../lib/prisma.js'

export const findAll = (userId) => prisma.task.findMany({ where: { userId } })

export const findById = (id) => prisma.task.findUnique({ where: { id } })

export const create = (data) =>
  prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? '',
      status: data.status ?? 'pending',
      userId: data.userId,
    },
  })

export const update = async (id, data) => {
  try {
    return await prisma.task.update({ where: { id }, data })
  } catch (e) {
    if (e.code === 'P2025') return null
    throw e
  }
}

export const remove = async (id) => {
  try {
    await prisma.task.delete({ where: { id } })
    return true
  } catch (e) {
    if (e.code === 'P2025') return false
    throw e
  }
}
