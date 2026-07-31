const createModel = require('../config/supabaseModel');
module.exports = createModel('attendance', { relations: { studentId: { table: 'users' }, classId: { table: 'classes' } } });
