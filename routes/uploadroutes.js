const express = require('express');
const cloudinary = require('../config/cloudinary');
const router = express.Router();

// OPTIONAL: protect this route if only admins are allowed to upload
// const verify = require('../middleware/verifyToken');

router.get('/signature', /* verify, */ (req, res) => {
  try {
    const timestamp   = Math.floor(Date.now() / 1000);
    const folder      = process.env.CLOUDINARY_FOLDER || 'Kubereshwar';
    const uploadPreset= process.env.CLOUDINARY_UPLOAD_PRESET || 'kubereshwar';

    // These must match what the client will send to Cloudinary
    const paramsToSign = { timestamp, folder, upload_preset: uploadPreset };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      uploadPreset
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate signature' });
  }
});

module.exports = router;
