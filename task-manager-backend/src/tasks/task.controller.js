import * as service from './task.service.js';

export const getAll = async (req, res, next) => {
  try {
    res.json(await service.getAll(req.user.id));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const task = await service.getById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const task = await service.create({ ...req.body, userId: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const task = await service.update(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await service.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
