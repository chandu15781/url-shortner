const { nanoid } = require('nanoid');
const validUrl = require('valid-url');
const Url = require('../models/Url');

// POST /api/shorten
const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    // Validate URL
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!validUrl.isWebUri(originalUrl)) {
      return res.status(400).json({ error: 'Invalid URL. Please include http:// or https://' });
    }

    // Handle custom alias
    let shortCode = customAlias ? customAlias.trim() : nanoid(7);

    // Validate custom alias
    if (customAlias) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        return res.status(400).json({
          error: 'Custom alias can only contain letters, numbers, hyphens, and underscores',
        });
      }

      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(409).json({ error: 'Custom alias already taken. Please choose another.' });
      }
    }

    // Handle expiration
    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ error: 'expiresIn must be a positive number of days' });
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // Create new URL document
    const urlDoc = new Url({
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      expiresAt,
    });

    await urlDoc.save();

    return res.status(201).json({
      success: true,
      data: {
        id: urlDoc._id,
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        shortUrl: `${process.env.BASE_URL}/${urlDoc.shortCode}`,
        clicks: 0,
        expiresAt: urlDoc.expiresAt,
        createdAt: urlDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// GET /:shortCode — redirect
const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode, isActive: true });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found or has been deactivated' });
    }

    // Check expiration
    if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
      urlDoc.isActive = false;
      await urlDoc.save();
      return res.status(410).json({ error: 'This short URL has expired' });
    }

    // Track click
    urlDoc.clicks += 1;
    urlDoc.clickHistory.push({
      timestamp: new Date(),
      referrer: req.headers.referer || 'Direct',
      userAgent: req.headers['user-agent'] || '',
    });

    // Keep only last 100 click history entries
    if (urlDoc.clickHistory.length > 100) {
      urlDoc.clickHistory = urlDoc.clickHistory.slice(-100);
    }

    await urlDoc.save();

    return res.redirect(301, urlDoc.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/stats/:shortCode
const getStats = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    return res.json({
      success: true,
      data: {
        id: urlDoc._id,
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        shortUrl: `${process.env.BASE_URL}/${urlDoc.shortCode}`,
        clicks: urlDoc.clicks,
        isActive: urlDoc.isActive,
        expiresAt: urlDoc.expiresAt,
        createdAt: urlDoc.createdAt,
        recentClicks: urlDoc.clickHistory.slice(-10).reverse(),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/urls — list all URLs (paginated)
const listUrls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [urls, total] = await Promise.all([
      Url.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-clickHistory'),
      Url.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: urls.map((u) => ({
        id: u._id,
        originalUrl: u.originalUrl,
        shortCode: u.shortCode,
        shortUrl: `${process.env.BASE_URL}/${u.shortCode}`,
        clicks: u.clicks,
        isActive: u.isActive,
        expiresAt: u.expiresAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing URLs:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/urls/:shortCode
const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOneAndDelete({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    return res.json({ success: true, message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/urls/:shortCode/toggle
const toggleUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    urlDoc.isActive = !urlDoc.isActive;
    await urlDoc.save();

    return res.json({
      success: true,
      message: `URL ${urlDoc.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: urlDoc.isActive,
    });
  } catch (error) {
    console.error('Error toggling URL:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  shortenUrl,
  redirectUrl,
  getStats,
  listUrls,
  deleteUrl,
  toggleUrl,
};
