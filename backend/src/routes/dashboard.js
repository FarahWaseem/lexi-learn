const express = require('express');
const router = express.Router();
const { requireAuth } = require('../services/clerk');
const {
  getGeneralStats,
  getUsers,
  getUserDetails,
  getSessions,
  getTopicsStats,
  getAnalytics,
  getRecentActivity
} = require('../controllers/dashboardController');

/**
 * 📊 Dashboard Routes
 * جميع الـ routes محمية بـ requireAuth
 * يمكنك إضافة middleware إضافي للتحقق من صلاحيات الأدمن
 */

// GET /api/dashboard/stats - إحصائيات عامة
router.get('/stats', requireAuth, getGeneralStats);

// GET /api/dashboard/users - قائمة المستخدمين
router.get('/users', requireAuth, getUsers);

// GET /api/dashboard/users/:id - تفاصيل مستخدم محدد
router.get('/users/:id', requireAuth, getUserDetails);

// GET /api/dashboard/sessions - قائمة الجلسات
router.get('/sessions', requireAuth, getSessions);

// GET /api/dashboard/topics - إحصائيات الدروس
router.get('/topics', requireAuth, getTopicsStats);

// GET /api/dashboard/analytics - تحليلات متقدمة
router.get('/analytics', requireAuth, getAnalytics);

// GET /api/dashboard/recent-activity - النشاط الأخير
router.get('/recent-activity', requireAuth, getRecentActivity);

module.exports = router;

