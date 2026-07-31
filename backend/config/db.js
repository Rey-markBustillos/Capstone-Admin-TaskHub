const supabase = require('./supabase');

const connectDB = async () => {
  try {
    // Fetch a row rather than issuing a HEAD request so a missing table/RLS
    // configuration is detected during startup.
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
    return true;
  } catch (err) {
    console.warn('Supabase connection failed:', err.message);
    return false;
  }
};

module.exports = connectDB;
