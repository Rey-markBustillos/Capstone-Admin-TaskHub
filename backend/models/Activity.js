const createModel = require('../config/supabaseModel');
module.exports = createModel('activities', { defaults: { isLocked: false }, relations: { createdBy: { table: 'users' }, classId: { table: 'classes' } } });
