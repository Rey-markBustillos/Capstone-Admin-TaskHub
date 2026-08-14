const supabase = require('./supabase');

const camelToSnake = (key) => key === '_id' ? 'id' : key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeToCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toDb = (data) => Object.fromEntries(Object.entries(data || {}).filter(([k, v]) => v !== undefined && k !== '_id').map(([k, v]) => [camelToSnake(k), v instanceof Date ? v.toISOString() : v]));
const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function createModel(table, { defaults = {}, relations = {} } = {}) {
  class Document {
    constructor(data = {}, persisted = false) {
      Object.assign(this, JSON.parse(JSON.stringify(defaults)), data);
      if (!this._id && this.id) this._id = this.id;
      this.__persisted = persisted;
    }
    toObject() { const { __persisted, id, ...data } = this; return { ...data, _id: this._id || id }; }
    async save() {
      const data = toDb(this.toObject());
      let result;
      if (this._id) result = await supabase.from(table).update(data).eq('id', this._id).select().single();
      else result = await supabase.from(table).insert(data).select().single();
      if (result.error) throw result.error;
      Object.assign(this, fromDb(result.data));
      this.__persisted = true;
      return this;
    }
    async populate(path, select) { await populateDocs(this, path, select); return this; }
  }

  const fromDb = (row) => {
    if (!row) return null;
    const data = Object.fromEntries(Object.entries(row).map(([k, v]) => {
      const camelKey = snakeToCamel(k);
      const isDate = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && (camelKey === 'date' || camelKey === 'timestamp' || /(?:At|Date)$/.test(camelKey));
      return [camelKey, isDate ? new Date(v) : v];
    }));
    data._id = row.id;
    return new Document(data, true);
  };
  const populateDocs = async (docs, path, select) => {
    const relation = relations[path];
    if (!relation) return docs;
    const list = Array.isArray(docs) ? docs : [docs];
    // Relation columns use UUIDs. Older imported records can still contain
    // Mongo ObjectIds, which PostgreSQL rejects in an `id IN (...)` filter.
    const ids = [...new Set(list.flatMap((d) => Array.isArray(d[path]) ? d[path] : [d[path]]).filter(isUuid))];
    if (!ids.length) return docs;
    const { data, error } = await supabase.from(relation.table).select(select ? `id,${select.split(' ').join(',')}` : '*').in('id', ids);
    if (error) throw error;
    const map = new Map((data || []).map((row) => [row.id, fromDb(row)]));
    list.forEach((d) => { d[path] = Array.isArray(d[path]) ? d[path].map((id) => map.get(id) || id) : (map.get(d[path]) || d[path]); });
    return docs;
  };
  const applyFilters = (query, filters = {}) => {
    Object.entries(filters).forEach(([rawKey, value]) => {
      const key = camelToSnake(rawKey);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('$in' in value) query.in(key, value.$in);
        else if ('$gte' in value) query.gte(key, value.$gte instanceof Date ? value.$gte.toISOString() : value.$gte);
        else if ('$lt' in value) query.lt(key, value.$lt instanceof Date ? value.$lt.toISOString() : value.$lt);
        else if ('$ne' in value) query.neq(key, value.$ne);
      } else if (rawKey === 'students') query.contains(key, [value]);
      else query.eq(key, value);
    });
    return query;
  };
  class Query {
    constructor(filters = {}, one = false) { this.filters = filters; this.one = one; this.populates = []; this.sortBy = null; this.fields = null; }
    select(fields) { this.fields = fields; return this; }
    populate(path, select) { this.populates.push([typeof path === 'string' ? path : path.path, select || (typeof path === 'object' ? path.select : undefined)]); return this; }
    sort(order) { this.sortBy = order; return this; }
    async exec() {
      let query = supabase.from(table).select('*');
      query = applyFilters(query, this.filters);
      if (this.sortBy) Object.entries(this.sortBy).forEach(([key, direction]) => { query = query.order(camelToSnake(key), { ascending: direction !== -1 }); });
      if (this.one) query = query.maybeSingle();
      const { data, error } = await query;
      if (error) throw error;
      let docs = this.one ? fromDb(data) : (data || []).map(fromDb);
      for (const [path, select] of this.populates) await populateDocs(docs, path, select);
      if (this.fields && this.fields.startsWith('-')) {
        const field = this.fields.slice(1); const redact = (d) => { if (d) delete d[field]; return d; };
        docs = Array.isArray(docs) ? docs.map(redact) : redact(docs);
      }
      return docs;
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
  }
  // Existing controllers chain Mongoose operations such as
  // `findByIdAndUpdate(...).populate(...)` and `.select(...)`. Preserve that
  // API shape while executing the update through Supabase.
  class MutationQuery {
    constructor(filters, update, options = {}) {
      this.filters = filters;
      this.update = update;
      this.options = options;
      this.populates = [];
      this.fields = null;
    }
    select(fields) { this.fields = fields; return this; }
    populate(path, select) { this.populates.push([typeof path === 'string' ? path : path.path, select || (typeof path === 'object' ? path.select : undefined)]); return this; }
    async exec() {
      const existing = await Document.findOne(this.filters);
      if (!existing && !this.options.upsert) return null;
      const doc = existing || new Document({ ...this.filters });
      Object.entries(this.update).forEach(([key, value]) => {
        if (key === '$unset') Object.keys(value).forEach((field) => { delete doc[field]; });
        else if (key === '$push') Object.entries(value).forEach(([field, item]) => { doc[field] = [...(doc[field] || []), item]; });
        else if (key === '$addToSet') Object.entries(value).forEach(([field, item]) => { doc[field] = (doc[field] || []).some((v) => JSON.stringify(v) === JSON.stringify(item)) ? doc[field] : [...(doc[field] || []), item]; });
        else doc[key] = value;
      });
      await doc.save();
      for (const [path, select] of this.populates) await populateDocs(doc, path, select);
      if (this.fields?.startsWith('-')) delete doc[this.fields.slice(1)];
      return doc;
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
  }
  Document.find = (filters = {}) => new Query(filters);
  Document.findOne = (filters = {}) => new Query(filters, true);
  Document.findById = (id) => new Query({ _id: id }, true);
  Document.create = async (data) => new Document(data).save();
  Document.findByIdAndUpdate = (id, update, options = {}) => new MutationQuery({ _id: id }, update, options);
  Document.findOneAndUpdate = (filters, update, options = {}) => new MutationQuery(filters, update, options);
  Document.findByIdAndDelete = async (id) => { const doc = await Document.findById(id); if (!doc) return null; const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error; return doc; };
  Document.deleteMany = async (filters = {}) => { let query = applyFilters(supabase.from(table).delete(), filters); const { error } = await query; if (error) throw error; };
  Document.countDocuments = async (filters = {}) => { let query = applyFilters(supabase.from(table).select('*', { count: 'exact', head: true }), filters); const { count, error } = await query; if (error) throw error; return count || 0; };
  return Document;
}
module.exports = createModel;
