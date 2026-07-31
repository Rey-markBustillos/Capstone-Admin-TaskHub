const createModel = require('../config/supabaseModel');
module.exports = createModel('quiz_submissions', { defaults: { answers: [], submittedAt: new Date() }, relations: { studentId: { table: 'users' }, quizId: { table: 'quizzes' } } });
