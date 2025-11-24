// controllers/enquiryController.js
const Enquiry = require('../models/Enquiry');
const Product = require('../models/Product');
const { sendEnquiryEmail } = require('../utils/mailer');

exports.createEnquiry = async (req, res) => {
  try {
    // Accept old + new shapes
    const {
      name = '',
      email = '',
      phone = '',
      topic = '',
      message = '',
      product: legacyProductId, // legacy single product
      categoryId = '',
      categoryName = '',
      productIds: rawProductIds = [],
      allProductsOfCategory: rawAllOfCat = false,
      consent
    } = req.body || {};

    // normalize booleans / arrays
    const allProductsOfCategory =
      typeof rawAllOfCat === 'string' ? rawAllOfCat === 'true' : !!rawAllOfCat;

    let productIds = Array.isArray(rawProductIds) ? rawProductIds : [];
    if (typeof rawProductIds === 'string') {
      productIds = rawProductIds.split(',').map(s => s.trim()).filter(Boolean);
    }

    // basic input sanity - name and message are required, and at least one of email or phone
    const nameTrimmed = name.trim();
    const emailTrimmed = email.trim();
    const phoneTrimmed = phone.trim();
    const messageTrimmed = message.trim();
    
    if (!nameTrimmed || !messageTrimmed) {
      return res.status(400).json({ message: 'Name and message are required.' });
    }
    
    if (!emailTrimmed && !phoneTrimmed) {
      return res.status(400).json({ message: 'Please provide either email or phone.' });
    }

    // persist enquiry (schema-safe: unknown fields are ignored if not in model)
    const enquiry = new Enquiry({
      name: nameTrimmed,
      email: emailTrimmed || undefined, // Only set if provided
      message: messageTrimmed,
      product: legacyProductId || undefined, // keep legacy compatibility
      phone: phone || undefined,
      topic: topic || undefined,
      categoryId: categoryId || undefined,
      categoryName: categoryName || undefined,
      productIds: productIds.length ? productIds : undefined,
      allProductsOfCategory: allProductsOfCategory || undefined,
      consent: typeof consent === 'boolean' ? consent : undefined,
      metadata: {
        ip: (req.headers['x-forwarded-for'] || req.ip || '').toString(),
        ua: (req.headers['user-agent'] || '').toString()
      }
    });
    await enquiry.save();

    // Resolve product(s) for the email
    let product = null;               // legacy single product doc (name only)
    let productNames = [];            // array of names when multiple selected

    if (!allProductsOfCategory && productIds.length) {
      const docs = await Product.find({ _id: { $in: productIds } })
        .select('name').lean();
      productNames = (docs || []).map(d => d.name).filter(Boolean);
    } else if (legacyProductId) {
      product = await Product.findById(legacyProductId).select('name').lean().catch(() => null);
    }

    // Build & send email to admin
    let emailSent = false;
    try {
      // Use email if provided, otherwise use a placeholder (phone-only enquiries)
      const fromEmail = emailTrimmed || `noreply+phone@${process.env.ADMIN_EMAIL?.split('@')[1] || 'enquiry.local'}`;
      await sendEnquiryEmail({
        to: process.env.ADMIN_EMAIL,  // REQUIRED: set in env
        fromEmail: fromEmail,
        fromName: enquiry.name,
        message: enquiry.message,

        // enriched fields
        phone,
        topic,
        consent: typeof consent === 'boolean' ? consent : undefined,
        categoryId,
        categoryName,
        allProductsOfCategory,
        productNames,                 // array
        productIds,                   // array
        product,                      // legacy single {name}
        meta: {
          receivedAt: enquiry.createdAt,
          ip: enquiry?.metadata?.ip,
          ua: enquiry?.metadata?.ua
        },

        // optional custom subject (fallback is auto-generated)
        // subject: `Website Enquiry • ${categoryName || '—'} • ${name}`
      });
      emailSent = true;
    } catch (mailErr) {
      console.error('Email send failed:', mailErr.message);
      // do not fail the API just because email failed
    }

    res.status(201).json({ ...enquiry.toObject(), emailSent });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Failed to create enquiry' });
  }
};

exports.getEnquiries = async (req, res) => {
  const enquiries = await Enquiry.find().populate('product');
  res.json(enquiries);
};

const ALLOWED_STATUSES = new Set(['new', 'in_progress', 'closed']);

exports.updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isRead } = req.body;

    const update = {};
    if (typeof status !== 'undefined') {
      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      update.status = status;
    }
    if (typeof isRead !== 'undefined') {
      update.isRead = typeof isRead === 'string' ? isRead === 'true' : !!isRead;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const doc = await Enquiry.findByIdAndUpdate(id, update, { new: true }).populate('product');
    if (!doc) return res.status(404).json({ message: 'Enquiry not found' });
    return res.json(doc);
  } catch (err) {
    console.error('updateEnquiry error:', err);
    return res.status(400).json({ message: err.message || 'Failed to update enquiry' });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Enquiry.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Enquiry not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('deleteEnquiry error:', err);
    return res.status(400).json({ message: err.message || 'Failed to delete enquiry' });
  }
};
