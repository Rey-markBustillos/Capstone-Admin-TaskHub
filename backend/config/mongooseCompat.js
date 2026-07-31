// Temporary compatibility helper for request validation while IDs are UUIDs.
const isValid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const ObjectId = (value) => value;
ObjectId.isValid = isValid;
module.exports = { Types: { ObjectId } };
