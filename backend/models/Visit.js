const createModel = require('../config/supabaseModel');
module.exports = createModel('visits', { defaults: { timestamp: new Date(), userAgent: '', ipAddress: '', sessionId: '' }, relations: { userId: { table: 'users' } } });
