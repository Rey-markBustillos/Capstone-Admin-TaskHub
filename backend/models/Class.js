const createModel = require('../config/supabaseModel');
module.exports = createModel('classes', { defaults: { students: [], isArchived: false, archivedAt: null }, relations: { teacher: { table: 'users' }, students: { table: 'users' } } });
