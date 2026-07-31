const createModel = require('../config/supabaseModel');
module.exports = createModel('announcements', { defaults: { comments: [], reactions: [], viewedBy: [], attachments: [], datePosted: new Date() }, relations: { postedBy: { table: 'users' }, viewedBy: { table: 'users' } } });
