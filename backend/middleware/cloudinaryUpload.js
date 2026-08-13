const { Readable } = require('stream');

function uploadFile(cloudinary, file, folder) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        resource_type: 'auto',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) return reject(error);

        Object.assign(file, {
          path: result.secure_url,
          url: result.url,
          secure_url: result.secure_url,
          filename: result.public_id,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
        resolve();
      }
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

function uploadToCloudinary(cloudinary, folder) {
  return async (req, res, next) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      await Promise.all(files.map((file) => uploadFile(cloudinary, file, folder)));
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { uploadToCloudinary };
