const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Module = require('../models/Module');

// --- Cloudinary Setup for Modules ---
const cloudinary = require('cloudinary').v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage + manual Cloudinary upload for reliability
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
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
    
    const fixedModules = modules.map(module => {
      const moduleObj = module.toObject();

      if (!moduleObj.cloudinaryUrl && moduleObj.publicId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const fileExtension = moduleObj.fileName?.split('.').pop()?.toLowerCase();
        const extensionSuffix = fileExtension ? '.' + fileExtension : '';
        moduleObj.cloudinaryUrl = 'https://res.cloudinary.com/' + cloudName + '/raw/upload/' + moduleObj.publicId + extensionSuffix;
      }

      if (!moduleObj.viewerUrl && moduleObj.cloudinaryUrl) {
        // Always use Google Docs Viewer - Cloudinary raw URLs auto-download
        moduleObj.viewerUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(moduleObj.cloudinaryUrl) + '&embedded=true';
      }

      return moduleObj;
    });
    
    res.json(fixedModules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload a new module (memory storage + manual Cloudinary upload)
router.post('/upload', (req, res, next) => {
  uploadMemory.single('module')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size must be less than 10MB' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, classId, uploadedBy } = req.body;
    
    if (!title || !classId || !uploadedBy) {
      return res.status(400).json({ message: 'Title, Class ID, and Uploaded By are required' });
    }
    
    console.log('Uploading module to Cloudinary:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    
    // Upload buffer to Cloudinary manually
    // Include file extension in public_id so the URL has the correct format
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'taskhub/modules',
          public_id: 'module-' + Date.now() + fileExtension,
          resource_type: 'raw',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    
    console.log('Cloudinary upload result:', {
      public_id: cloudinaryResult.public_id,
      secure_url: cloudinaryResult.secure_url,
      bytes: cloudinaryResult.bytes,
      resource_type: cloudinaryResult.resource_type,
    });
    
    const cloudinaryUrl = cloudinaryResult.secure_url;
    
    // Create viewer URL - always use Google Docs Viewer for inline viewing
    // (Cloudinary raw URLs trigger download by default)
    const viewerUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(cloudinaryUrl) + '&embedded=true';
    
    const module = new Module({
      title: title.trim(),
      description: description ? description.trim() : '',
      fileName: req.file.originalname,
      filePath: cloudinaryResult.public_id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      classId,
      uploadedBy,
      uploadDate: new Date(),
      cloudinaryUrl: cloudinaryUrl,
      viewerUrl: viewerUrl,
      publicId: cloudinaryResult.public_id,
      resourceType: cloudinaryResult.resource_type || 'raw'
    });
    
    await module.save();
    await module.populate('uploadedBy', 'name email');
    
    console.log('Module saved successfully:', module._id, module.title);
    
    res.status(201).json({
      message: 'Module uploaded successfully',
      module
    });
  } catch (error) {
    console.error('Error uploading module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download a module
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Increment download count
    try {
      await module.incrementDownloadCount();
    } catch (err) {
      console.warn('Could not increment download count:', err.message);
    }
    
    if (module.cloudinaryUrl) {
      const downloadUrl = module.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.redirect(downloadUrl);
    }
    
    // Legacy local files
    let filePath;
    if (path.isAbsolute(module.filePath)) {
      filePath = module.filePath;
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename="'+module.fileName+'"');
    res.setHeader('Content-Type', module.mimeType);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error downloading module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// View a module
router.get('/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    
    const module = await Module.findById(id);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    if (module.cloudinaryUrl) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Always redirect to Google Docs Viewer for inline viewing
      // Cloudinary raw URLs trigger auto-download
      const viewerUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(module.cloudinaryUrl) + '&embedded=true';
      return res.redirect(viewerUrl);
    }
    
    // Legacy local files
    let filePath;
    if (path.isAbsolute(module.filePath)) {
      filePath = module.filePath;
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.setHeader('Content-Type', module.mimeType);
    res.setHeader('Content-Disposition', 'inline; filename="'+module.fileName+'"');
    fs.createReadStream(filePath).pipe(res);
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
    
    if (module.publicId && module.cloudinaryUrl) {
      try {
        await cloudinary.uploader.destroy(module.publicId, { resource_type: module.resourceType || 'raw' });
      } catch (cloudinaryError) {
        console.warn('Could not delete file from Cloudinary:', cloudinaryError.message);
      }
    }
    
    if (module.filePath && !module.cloudinaryUrl) {
      let filePath = path.isAbsolute(module.filePath) ? module.filePath : path.join(__dirname, '..', 'uploads', 'modules', module.filePath);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }
    
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid module ID format' });
    }
    const module = await Module.findById(id).populate('uploadedBy', 'name email');
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix existing modules - migrate URLs
router.post('/fix-urls', async (req, res) => {
  try {
    const modules = await Module.find({});
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let fixedCount = 0;
    
    for (const module of modules) {
      let updated = false;
      if (!module.cloudinaryUrl && module.publicId) {
        module.cloudinaryUrl = 'https://res.cloudinary.com/'+cloudName+'/raw/upload/'+module.publicId;
        updated = true;
      }
      if (!module.viewerUrl && module.cloudinaryUrl) {
        module.viewerUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(module.cloudinaryUrl) + '&embedded=true';
        updated = true;
      }
      if (!module.resourceType) { module.resourceType = 'raw'; updated = true; }
      if (updated) { await module.save(); fixedCount++; }
    }
    
    res.json({ message: 'Fixed '+fixedCount+' modules', totalModules: modules.length, fixedModules: fixedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
