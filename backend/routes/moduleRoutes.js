const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Module = require('../models/Module');

// Configure multer for module uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'modules');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'module-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allowed file types for modules
    const allowedTypes = [
      'application/pdf', // .pdf
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX files.'), false);
    }
  }
});

// Get all modules for a class
router.get('/', async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    
    const modules = await Module.find({ classId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 });
    
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload a new module
router.post('/upload', upload.single('module'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, classId, uploadedBy } = req.body;
    
    if (!title || !classId || !uploadedBy) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title, Class ID, and Uploaded By are required' });
    }
    
    const module = new Module({
      title: title.trim(),
      description: description ? description.trim() : '',
      fileName: req.file.originalname,
      filePath: req.file.filename, // Store only the filename
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      classId,
      uploadedBy,
      uploadDate: new Date()
    });
    
    await module.save();
    
    // Populate the uploadedBy field before sending response
    await module.populate('uploadedBy', 'name email');
    
    res.status(201).json({
      message: 'Module uploaded successfully',
      module
    });
  } catch (error) {
    console.error('Error uploading module:', error);
    
    // Delete uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download a module
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Download request for module ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id);
    
    if (!module) {
      console.log('Module not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Handle both old absolute paths and new relative paths
    let filePath;
    if (path.isAbsolute(module.filePath)) {
      // Old format: absolute path
      filePath = module.filePath;
    } else {
      // New format: relative path (filename only)
      filePath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
    }
    
    console.log('Module found for download:', module.title);
    console.log('Stored file path:', module.filePath);
    console.log('Constructed file path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${module.fileName}"`);
    res.setHeader('Content-Type', module.mimeType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// View a module (for PDFs and other viewable files)
router.get('/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('View request for module ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id);
    
    if (!module) {
      console.log('Module not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Handle both old absolute paths and new relative paths
    let filePath;
    if (path.isAbsolute(module.filePath)) {
      // Old format: absolute path
      filePath = module.filePath;
    } else {
      // New format: relative path (filename only)
      filePath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
    }
    
    console.log('Module found:', module.title);
    console.log('Stored file path:', module.filePath);
    console.log('Constructed file path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.setHeader('Content-Type', module.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${module.fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a module
router.delete('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Delete the file from filesystem
    if (fs.existsSync(module.filePath)) {
      fs.unlinkSync(module.filePath);
    }
    
    // Delete from database
    await Module.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get module info by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Get module info request for ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id)
      .populate('uploadedBy', 'name email');
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if module file exists without streaming it
router.get('/check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Handle both old absolute paths and new relative paths
    let filePath;
    if (path.isAbsolute(module.filePath)) {
      filePath = module.filePath;
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
    }
    
    const fileExists = fs.existsSync(filePath);
    
    res.json({
      moduleId: module._id,
      title: module.title,
      fileName: module.fileName,
      storedPath: module.filePath,
      resolvedPath: filePath,
      fileExists: fileExists,
      fileSize: module.fileSize,
      mimeType: module.mimeType
    });
    
  } catch (error) {
    console.error('Error checking module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to check and fix module file paths
router.get('/debug/fix-paths', async (req, res) => {
  try {
    const modules = await Module.find({});
    const results = [];
    
    for (const module of modules) {
      const result = {
        id: module._id,
        title: module.title,
        originalPath: module.filePath,
        isAbsolute: path.isAbsolute(module.filePath),
        fileExists: false
      };
      
      // Check if file exists with current path
      if (path.isAbsolute(module.filePath)) {
        result.fileExists = fs.existsSync(module.filePath);
      } else {
        const constructedPath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
        result.fileExists = fs.existsSync(constructedPath);
        result.constructedPath = constructedPath;
      }
      
      results.push(result);
    }
    
    res.json({
      message: 'Module path debug information',
      totalModules: modules.length,
      modules: results
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;