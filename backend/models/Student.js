const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Add more fields as needed (grade, contact info, etc.)
});

module.exports = mongoose.model("Student", studentSchema);
