import { getSession } from '../users/user.service.js';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const user = getSession(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  next();
};
