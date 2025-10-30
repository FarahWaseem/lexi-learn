const express = require('express');
const router = express.Router();
const { requireAuth } = require('../services/clerk');
const dashboardService = require('../services/dashboardService');

/**
 * 📊 Dashboard Advanced Routes
 * Routes إضافية للدشبورد تستخدم Dashboard Service
 */

/**
 * GET /api/dashboard/advanced/comparison
 * مقارنة الإحصائيات بين فترتين
 */
router.get('/comparison', requireAuth, async (req, res) => {
  try {
    const { currentPeriod = 7, previousPeriod = 7 } = req.query;
    const comparison = await dashboardService.getComparisonStats(
      parseInt(currentPeriod),
      parseInt(previousPeriod)
    );
    res.json({ ok: true, comparison });
  } catch (err) {
    console.error('❌ Comparison error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/common-errors
 * الأخطاء الشائعة في التصحيحات
 */
router.get('/common-errors', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const errors = await dashboardService.getCommonErrors(parseInt(limit));
    res.json({ ok: true, errors });
  } catch (err) {
    console.error('❌ Common errors error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/leaderboard
 * لوحة المتصدرين
 */
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const { metric = 'score', limit = 10 } = req.query;
    const leaderboard = await dashboardService.getLeaderboard(metric, parseInt(limit));
    res.json({ ok: true, leaderboard });
  } catch (err) {
    console.error('❌ Leaderboard error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/user-distribution
 * توزيع المستخدمين حسب المستوى
 */
router.get('/user-distribution', requireAuth, async (req, res) => {
  try {
    const distribution = await dashboardService.getUserDistributionByLevel();
    res.json({ ok: true, distribution });
  } catch (err) {
    console.error('❌ User distribution error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/completion-time
 * متوسط الوقت لإكمال كل درس
 */
router.get('/completion-time', requireAuth, async (req, res) => {
  try {
    const completionTime = await dashboardService.getAverageCompletionTime();
    res.json({ ok: true, completionTime });
  } catch (err) {
    console.error('❌ Completion time error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/retention
 * معدل الاحتفاظ بالمستخدمين
 */
router.get('/retention', requireAuth, async (req, res) => {
  try {
    const retention = await dashboardService.getRetentionRate();
    res.json({ ok: true, retention });
  } catch (err) {
    console.error('❌ Retention error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/topics-needing-improvement
 * الدروس التي تحتاج تحسين
 */
router.get('/topics-needing-improvement', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topics = await dashboardService.getTopicsNeedingImprovement(parseInt(limit));
    res.json({ ok: true, topics });
  } catch (err) {
    console.error('❌ Topics needing improvement error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/advanced/export-user/:userId
 * تصدير بيانات المستخدم (GDPR)
 */
router.get('/export-user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await dashboardService.exportUserData(userId);
    
    // إرسال كملف JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-${userId}-data.json"`);
    res.json(userData);
  } catch (err) {
    console.error('❌ Export user error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

