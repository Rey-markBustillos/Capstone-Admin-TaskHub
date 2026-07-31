const createModel = require('../config/supabaseModel');
module.exports = createModel('submissions', { defaults: { status: 'Submitted', score: null, submissionDate: new Date() }, relations: { studentId: { table: 'users' }, activityId: { table: 'activities' } } });
