const createModel = require('../config/supabaseModel');
const Module = createModel('modules', { defaults: { isActive: true, downloadCount: 0, tags: [], uploadDate: new Date() }, relations: { uploadedBy: { table: 'users' }, classId: { table: 'classes' } } });
Module.prototype.incrementDownloadCount = function () { this.downloadCount += 1; return this.save(); };
module.exports = Module;
