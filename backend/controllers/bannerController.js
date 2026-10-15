const Banner = require('../models/Banner');
const fsPromises = require('fs/promises');
const path = require('path');

const removeBannerFile = async (imageUrl) => {
  if (!imageUrl?.startsWith('/uploads/banners/')) return;
  const filePath = path.join(__dirname, '../public/uploads/banners', path.basename(imageUrl));
  await fsPromises.unlink(filePath).catch(() => {});
};

const getBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ key: 'main', isActive: true }).lean();
    return res.status(200).json({ success: true, banner: banner || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not load banner' });
  }
};

const updateBannerContent = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const subtitle = String(req.body.subtitle || '').trim();

    if (title.length > 140 || subtitle.length > 500) {
      return res.status(400).json({ message: 'Banner title or subtitle is too long' });
    }

    const banner = await Banner.findOneAndUpdate(
      { key: 'main' },
      { $set: { title, subtitle, isActive: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not save banner content' });
  }
};

const uploadBannerImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please select a banner image' });

  try {
    const previous = await Banner.findOne({ key: 'main' }).select('imageUrl');
    const imageUrl = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.findOneAndUpdate(
      { key: 'main' },
      { $set: { imageUrl, isActive: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await removeBannerFile(previous?.imageUrl);
    return res.status(200).json({ success: true, banner, bannerUrl: imageUrl });
  } catch (error) {
    await removeBannerFile(`/uploads/banners/${req.file.filename}`);
    return res.status(500).json({ success: false, message: 'Could not upload banner image' });
  }
};

const removeBanner = async (req, res) => {
  try {
    const banner = await Banner.findOneAndDelete({ key: 'main' });
    if (!banner) return res.status(404).json({ success: false, message: 'No main banner to remove' });

    await removeBannerFile(banner.imageUrl);
    return res.status(200).json({ success: true, message: 'Main banner removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not remove banner' });
  }
};

module.exports = { getBanner, updateBannerContent, uploadBannerImage, removeBanner };