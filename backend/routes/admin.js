const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users, total: users.length });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

   
    await Task.deleteMany({ user: req.params.id });

    res.status(200).json({ success: true, message: 'User and their tasks deleted successfully.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    if (err.name === 'CastError') return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get system statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalTasks, tasksByStatus, tasksByPriority] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        tasksByStatus: tasksByStatus.map((s) => ({ status: s._id, count: s.count })),
        tasksByPriority: tasksByPriority.map((p) => ({ priority: p._id, count: p.count })),
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
