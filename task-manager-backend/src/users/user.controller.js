import * as service from './user.service.js';

export const register = async (req, res, next) => {
  try {
    const user = await service.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await service.login(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ message: 'Invalid credentials' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
