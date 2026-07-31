const createModel = require('../config/supabaseModel');
module.exports = createModel('users', { defaults: { lrn: null, teacherId: null, adminId: null, address: null, age: null, schoolName: null, active: true } });
