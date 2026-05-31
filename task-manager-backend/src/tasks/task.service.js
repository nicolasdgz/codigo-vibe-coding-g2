import * as repository from './task.repository.js';

export const getAll = (userId) => repository.findAll(userId);

export const getById = (id) => repository.findById(id);

export const create = (data) => repository.create(data);

export const update = (id, data) => repository.update(id, data);

export const remove = (id) => repository.remove(id);
