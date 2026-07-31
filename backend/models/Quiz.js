const createModel = require('../config/supabaseModel');
module.exports = createModel('quizzes', { defaults: { questions: [], questionTime: 30, createdAt: new Date() }, relations: { createdBy: { table: 'users' }, classId: { table: 'classes' } } });
