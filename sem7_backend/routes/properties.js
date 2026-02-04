const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { 
  sendPropertyApprovalEmail, 
  sendPropertyRejectionEmail, 
  sendPropertyLiveEmail 
} = require('../utils/email');

const router = express.Router();

// Configure multer for property image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/properties');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ========================================
// PUBLIC ENDPOINTS (No Authentication)
// ========================================

// Get featured properties (PUBLIC - only fully approved)
router.get('/featured', async (req, res) => {
  try {
    const properties = await getAll(`
      SELECT 
        p.*,
        u.Name as OwnerName,
        a.Name as AgentName
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.Status = 'active' 
        AND p.OwnerApprovalStatus = 'approved'
        AND p.AdminApprovalStatus = 'approved'
        AND p.IsFeatured = 1
      ORDER BY p.CreatedAt DESC
      LIMIT 6
    `);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured properties',
      error: error.message
    });
  }
});

// Get ALL owner properties (pending, approved, rejected) - MUST BE BEFORE /:id route
router.get('/owner/my-properties', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    if (userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can access this endpoint'
      });
    }
    
    const properties = await getAll(`
      SELECT p.*, a.Name as AgentName, a.Email as AgentEmail, a.MobileNo as AgentMobile
      FROM Properties p
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.OwnerId = ?
      ORDER BY 
        CASE p.OwnerApprovalStatus 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END, p.CreatedAt DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get owner properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Get properties pending owner approval (for users) - MUST BE BEFORE /:id route
router.get('/pending-owner-approval', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    if (userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can access this endpoint'
      });
    }
    
    const properties = await getAll(`
      SELECT p.*, a.Name as AgentName, a.Email as AgentEmail, a.MobileNo as AgentMobile
      FROM Properties p
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.OwnerId = ? AND p.OwnerApprovalStatus = 'pending'
      ORDER BY p.CreatedAt DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get pending owner approval properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Get ALL properties for admin - MUST BE BEFORE /:id route
router.get('/admin/all-properties', authenticate, async (req, res) => {
  try {
    const userType = req.user.userType;
    
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this endpoint'
      });
    }
    
    const properties = await getAll(`
      SELECT 
        p.*,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        u.MobileNo as OwnerMobile,
        a.Name as AgentName,
        a.Email as AgentEmail,
        a.MobileNo as AgentMobile
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      ORDER BY p.CreatedAt DESC
    `);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get all properties for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Get properties pending admin approval (for admins) - MUST BE BEFORE /:id route
router.get('/pending-admin-approval', authenticate, async (req, res) => {
  try {
    const userType = req.user.userType;
    
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this endpoint'
      });
    }
    
    const properties = await getAll(`
      SELECT p.*, u.Name as OwnerName, a.Name as AgentName
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.OwnerApprovalStatus = 'approved' AND p.AdminApprovalStatus = 'pending'
      ORDER BY p.CreatedAt DESC
    `);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get pending admin approval properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Get agent's properties - MUST BE BEFORE /:id route
router.get('/agent/my-properties', authenticate, async (req, res) => {
  try {
    const agentId = req.user.id;
    const userType = req.user.userType;
    
    console.log('🔍 Agent Properties Request:', {
      agentId,
      userType,
      userEmail: req.user.email
    });
    
    if (userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can access their properties'
      });
    }
    
    // First, let's check all properties in the database
    const allProperties = await getAll('SELECT Id, Title, AgentId FROM Properties');
    console.log('📋 All properties in database:', allProperties.length);
    console.log('📋 Sample properties:', allProperties.slice(0, 3));
    
    const properties = await getAll(`
      SELECT 
        p.*,
        u.Name as OwnerName,
        u.Email as OwnerEmail
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      WHERE p.AgentId = ?
      ORDER BY p.CreatedAt DESC
    `, [agentId]);
    
    console.log('✅ Agent properties found:', properties.length);
    if (properties.length > 0) {
      console.log('📋 First property:', {
        Id: properties[0].Id,
        Title: properties[0].Title,
        AgentId: properties[0].AgentId
      });
    }
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get agent properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Get all properties with filters (PUBLIC - only show approved properties)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      propertyType, 
      city, 
      minPrice, 
      maxPrice,
      bedrooms
    } = req.query;
    
    // Public route - Only show properties that are fully approved and active
    let query = `
      SELECT 
        p.*,
        u.Name as OwnerName,
        a.Name as AgentName
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.Status = 'active' 
        AND p.OwnerApprovalStatus = 'approved'
        AND p.AdminApprovalStatus = 'approved'
    `;
    const params = [];
    
    if (type) {
      query += ' AND p.ListingType = ?';
      params.push(type);
    }
    
    if (propertyType) {
      query += ' AND p.PropertyType = ?';
      params.push(propertyType);
    }
    
    if (city) {
      query += ' AND p.City LIKE ?';
      params.push(`%${city}%`);
    }
    
    if (minPrice) {
      query += ' AND p.Price >= ?';
      params.push(minPrice);
    }
    
    if (maxPrice) {
      query += ' AND p.Price <= ?';
      params.push(maxPrice);
    }
    
    if (bedrooms) {
      query += ' AND p.Bedrooms >= ?';
      params.push(bedrooms);
    }
    
    query += ' ORDER BY p.CreatedAt DESC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const properties = await getAll(query, params);
    
    // Get images for each property - Include MainImage + all gallery images
    const propertiesWithImages = await Promise.all(
      properties.map(async (property) => {
        // Get ALL images from PropertyImages table
        const images = await getAll(
          'SELECT Id, ImagePath, ImageType, DisplayOrder FROM PropertyImages WHERE PropertyId = ? ORDER BY DisplayOrder',
          [property.Id]
        );
        
        // Process images with full URLs
        const processedImages = images.map(img => {
          let imagePath = img.ImagePath;
          if (imagePath && !imagePath.startsWith('http')) {
            // Ensure proper path format
            if (!imagePath.startsWith('/')) {
              imagePath = '/' + imagePath;
            }
            // Add full URL - don't add it here, let frontend add it
            return {
              ...img,
              ImageURL: imagePath // Keep relative path
            };
          }
          return {
            ...img,
            ImageURL: imagePath || img.ImageURL
          };
        });
        
        // Process MainImage with full URL
        let mainImageUrl = null;
        if (property.MainImage) {
          mainImageUrl = property.MainImage.startsWith('http') 
            ? property.MainImage 
            : property.MainImage;
        } else if (processedImages.length > 0) {
          mainImageUrl = processedImages[0].ImageURL;
        }
        
        // Remove the database 'Images' field to avoid duplicate key with our 'images' array
        const { Images, ...propertyWithoutImages } = property;
        
        return {
          ...propertyWithoutImages,
          images: processedImages,
          MainImage: mainImageUrl,
          PropertyImage: mainImageUrl // For backward compatibility
        };
      })
    );
    
    console.log('📋 Properties with images:', propertiesWithImages.length);
    if (propertiesWithImages.length > 0) {
      console.log('📷 Sample property image data:', {
        propertyId: propertiesWithImages[0].Id,
        MainImage: propertiesWithImages[0].MainImage,
        PropertyImage: propertiesWithImages[0].PropertyImage,
        imagesCount: propertiesWithImages[0].images?.length
      });
    }
    
    // Get total count (only approved and active properties)
    let countQuery = `SELECT COUNT(*) as total FROM Properties p 
      WHERE p.Status = 'active' 
        AND p.OwnerApprovalStatus = 'approved'
        AND p.AdminApprovalStatus = 'approved'`;
    const countParams = [];
    
    // Apply same filters to count
    if (type) {
      countQuery += ' AND p.ListingType = ?';
      countParams.push(type);
    }
    if (propertyType) {
      countQuery += ' AND p.PropertyType = ?';
      countParams.push(propertyType);
    }
    if (city) {
      countQuery += ' AND p.City LIKE ?';
      countParams.push(`%${city}%`);
    }
    if (minPrice) {
      countQuery += ' AND p.Price >= ?';
      countParams.push(minPrice);
    }
    if (maxPrice) {
      countQuery += ' AND p.Price <= ?';
      countParams.push(maxPrice);
    }
    if (bedrooms) {
      countQuery += ' AND p.Bedrooms >= ?';
      countParams.push(bedrooms);
    }
    
    const { total } = await getOne(countQuery, countParams);
    
    res.json({
      success: true,
      data: {
        properties: propertiesWithImages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// Diagnostic: Check PropertyImages table for a specific property
router.get('/:id/images-debug', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('\n🔍 DIAGNOSTIC: Checking PropertyImages for PropertyId:', id);
    
    // Check if property exists
    const property = await getOne('SELECT Id, Title, MainImage FROM Properties WHERE Id = ?', [id]);
    console.log('Property found:', property);
    
    // Get all images for this property
    const images = await getAll('SELECT * FROM PropertyImages WHERE PropertyId = ?', [id]);
    console.log('Images found:', images.length);
    
    // Get count
    const count = await getOne('SELECT COUNT(*) as count FROM PropertyImages WHERE PropertyId = ?', [id]);
    console.log('Image count:', count);
    
    res.json({
      success: true,
      data: {
        property: property,
        imageCount: count?.count || 0,
        images: images,
        diagnostic: {
          hasProperty: !!property,
          hasImages: images.length > 0,
          imagesDetail: images.map(img => ({
            id: img.Id,
            path: img.ImagePath,
            type: img.ImageType,
            order: img.DisplayOrder,
            pathStartsWith: img.ImagePath?.substring(0, 20)
          }))
        }
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: 'Diagnostic failed',
      error: error.message
    });
  }
});

// Get user's liked properties - MUST BE BEFORE /:id route
router.get('/liked', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    if (userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can access liked properties'
      });
    }
    
    console.log('💖 Fetching liked properties for user:', userId);
    
    // Get liked properties with full property details
    const likedProperties = await getAll(`
      SELECT 
        p.*,
        pl.CreatedAt as LikedAt,
        a.Name as AgentName,
        a.Email as AgentEmail,
        a.MobileNo as AgentMobile
      FROM PropertyLikes pl
      INNER JOIN Properties p ON pl.PropertyId = p.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE pl.UserId = ?
      ORDER BY pl.CreatedAt DESC
    `, [userId]);
    
    console.log('✅ Found', likedProperties.length, 'liked properties');
    
    res.json({
      success: true,
      data: likedProperties
    });
  } catch (error) {
    console.error('Get liked properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch liked properties',
      error: error.message
    });
  }
});

// Get single property by ID (PUBLIC) - MUST BE AFTER all specific routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await getOne(`
      SELECT 
        p.*,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        u.MobileNo as OwnerMobile,
        a.Name as AgentName,
        a.Email as AgentEmail,
        a.MobileNo as AgentMobile
      FROM Properties p
      LEFT JOIN Users u ON p.OwnerId = u.Id
      LEFT JOIN Agents a ON p.AgentId = a.Id
      WHERE p.Id = ?
    `, [id]);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // For public access, only show fully approved properties
    // (This is a public endpoint, so we restrict access)
    const isAuthenticated = req.headers.authorization;
    if (!isAuthenticated && 
        (property.Status !== 'active' || 
         property.OwnerApprovalStatus !== 'approved' || 
         property.AdminApprovalStatus !== 'approved')) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not available'
      });
    }
    
    // Increment view count
    await runQuery('UPDATE Properties SET Views = Views + 1 WHERE Id = ?', [id]);
    
    // Get ALL property images from PropertyImages table
    console.log('\n🔍 Fetching images for PropertyId:', id);
    const images = await getAll('SELECT * FROM PropertyImages WHERE PropertyId = ? ORDER BY DisplayOrder', [id]);
    console.log('📸 Raw images from DB:', images.length, 'images');
    
    // Map images to include properly formatted ImageURL with full path
    const mappedImages = images.map((img, index) => {
      console.log(`\n📸 Processing image ${index + 1}:`, {
        Id: img.Id,
        PropertyId: img.PropertyId,
        ImagePath: img.ImagePath,
        ImageType: img.ImageType,
        DisplayOrder: img.DisplayOrder
      });
      
      const imagePath = img.ImagePath || img.ImageURL;
      if (!imagePath) {
        console.log('⚠️  No image path for image:', img);
        return null;
      }
      
      // Ensure path starts with /uploads/properties/
      let cleanPath = imagePath;
      
      // Remove any leading slashes first
      cleanPath = cleanPath.replace(/^\/+/, '');
      
      // Ensure it has the proper prefix
      if (!cleanPath.startsWith('uploads/properties/')) {
        cleanPath = 'uploads/properties/' + cleanPath.replace(/^uploads\/properties\//, '');
      }
      
      // Add leading slash
      cleanPath = '/' + cleanPath;
      
      console.log(`✅ Cleaned path for image ${index + 1}:`, cleanPath);
      
      return {
        Id: img.Id,
        PropertyId: img.PropertyId,
        ImageType: img.ImageType,
        DisplayOrder: img.DisplayOrder,
        ImagePath: cleanPath,
        ImageURL: cleanPath // Frontend uses ImageURL
      };
    }).filter(img => img !== null);
    
    // Get property facilities
    const facilities = await getAll('SELECT FacilityName FROM PropertyFacilities WHERE PropertyId = ?', [id]);
    
    console.log('\n📷 Final Property Images Summary:');
    console.log('  PropertyId:', id);
    console.log('  MainImage:', property.MainImage);
    console.log('  Gallery Images Count:', mappedImages.length);
    mappedImages.forEach((img, idx) => {
      console.log(`  Image ${idx + 1}:`, {
        type: img.ImageType,
        path: img.ImagePath,
        url: img.ImageURL,
        fullURL: `http://localhost:5000${img.ImageURL}`
      });
    });
    console.log('\n');
    
    // Remove the database 'Images' field to avoid duplicate key
    const { Images, ...propertyWithoutImages } = property;
    
    const responseData = {
      ...propertyWithoutImages,
      images: mappedImages,
      facilities: facilities.map(f => f.FacilityName)
    };
    
    console.log('\n✅ Sending response with', mappedImages.length, 'images\n');
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error.message
    });
  }
});

// ========================================
// PROTECTED ENDPOINTS (Authentication Required)
// ========================================

// Like a property
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('❤️  User', userId, 'liking property', id);
    
    // Check if property exists
    const property = await getOne('SELECT Id FROM Properties WHERE Id = ?', [id]);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if already liked
    const existingLike = await getOne(
      'SELECT * FROM PropertyLikes WHERE UserId = ? AND PropertyId = ?',
      [userId, id]
    );
    
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this property'
      });
    }
    
    // Add like
    await runQuery(
      'INSERT INTO PropertyLikes (UserId, PropertyId) VALUES (?, ?)',
      [userId, id]
    );
    
    console.log('✅ Property liked successfully');
    
    res.json({
      success: true,
      message: 'Property liked successfully'
    });
  } catch (error) {
    console.error('Like property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like property',
      error: error.message
    });
  }
});

// Unlike a property
router.delete('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('💔 User', userId, 'unliking property', id);
    
    // Check if property exists
    const property = await getOne('SELECT Id FROM Properties WHERE Id = ?', [id]);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if liked
    const existingLike = await getOne(
      'SELECT * FROM PropertyLikes WHERE UserId = ? AND PropertyId = ?',
      [userId, id]
    );
    
    if (!existingLike) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this property'
      });
    }
    
    // Remove like
    await runQuery(
      'DELETE FROM PropertyLikes WHERE UserId = ? AND PropertyId = ?',
      [userId, id]
    );
    
    console.log('✅ Property unliked successfully');
    
    res.json({
      success: true,
      message: 'Property unliked successfully'
    });
  } catch (error) {
    console.error('Unlike property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike property',
      error: error.message
    });
  }
});

// Create new property (Agent only)
router.post('/', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const agentId = req.user.id;
    const userType = req.user.userType;
    
    // Verify user is an agent
    if (userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can create properties'
      });
    }
    
    const {
      ownerId,
      ownerName,
      ownerUsercode,
      type,
      propertyType,
      title,
      description,
      price,
      size,
      address,
      city,
      state,
      pincode,
      bedrooms,
      bathrooms,
      balconies,
      propertyAge,
      facing,
      houseType,
      furnishing,
      facilities
    } = req.body;
    
    // Validate required fields
    if (!ownerId || !type || !propertyType || !description || !price || !size || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    console.log('📝 Creating property with:', {
      ownerId,
      ownerName,
      ownerUsercode,
      agentId,
      type,
      propertyType,
      city
    });
    
    // Generate title if not provided
    const propertyTitle = title || `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${city}`;
    
    // Get agent name
    const agent = await getOne('SELECT Name FROM Agents WHERE Id = ?', [agentId]);
    
    // Parse facilities if it's a string
    const facilitiesArray = typeof facilities === 'string' ? JSON.parse(facilities) : facilities;
    const facilitiesJSON = JSON.stringify(facilitiesArray || []);
    
    // Insert property with 'pending' status (requires owner & admin approval)
    const result = await runQuery(`
      INSERT INTO Properties (
        OwnerId, OwnerName, OwnerUsercode, AgentId, AgentName,
        ListingType, PropertyType, Title, Description, Price, Size,
        Address, City, State, Pincode,
        Bedrooms, Bathrooms, Balconies, PropertyAge, Facing, HouseType, Furnishing,
        Facilities, Status, OwnerApprovalStatus, AdminApprovalStatus, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      ownerId, ownerName, ownerUsercode, agentId, agent?.Name || '',
      type, propertyType, propertyTitle, description, price, size,
      address, city, state, pincode || null,
      bedrooms || null, bathrooms || null, balconies || null, 
      propertyAge || null, facing || null, houseType || null, furnishing || null,
      facilitiesJSON, 'pending', 'pending', 'pending'
    ]);
    
    const propertyId = result.id;
    
    // Validate propertyId was created successfully
    if (!propertyId) {
      throw new Error('Failed to create property - no ID returned');
    }
    
    console.log('✅ Property created with ID:', propertyId);
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      console.log(`📸 Processing ${req.files.length} image(s) for property ${propertyId}`);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imagePath = `/uploads/properties/${file.filename}`;
        const imageType = i === 0 ? 'main' : 'gallery';
        
        console.log(`  → Inserting image ${i + 1}: ${imagePath} (type: ${imageType})`);
        
        await runQuery(`
          INSERT INTO PropertyImages (PropertyId, ImagePath, ImageType, DisplayOrder)
          VALUES (?, ?, ?, ?)
        `, [propertyId, imagePath, imageType, i]);
        
        // Set main image
        if (i === 0) {
          await runQuery('UPDATE Properties SET MainImage = ? WHERE Id = ?', [imagePath, propertyId]);
        }
      }
      
      console.log(`✅ Successfully inserted ${req.files.length} image(s)`);
    } else {
      console.log('ℹ️  No images uploaded for this property');
    }
    
    // Insert facilities
    if (facilitiesArray && facilitiesArray.length > 0) {
      for (const facility of facilitiesArray) {
        await runQuery(`
          INSERT INTO PropertyFacilities (PropertyId, FacilityName)
          VALUES (?, ?)
        `, [propertyId, facility]);
      }
    }
    
    // Get the created property
    const property = await getOne('SELECT * FROM Properties WHERE Id = ?', [propertyId]);
    
    // Send notification to owner for approval
    try {
      await runQuery(`
        INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        ownerId,
        'property_approval_request',
        'Property Approval Required',
        `Agent ${agent?.Name || 'Unknown'} has listed your property "${propertyTitle}" for ${type}. Please review and approve.`,
        propertyId
      ]);
      console.log(`✅ Notification sent to owner (UserId: ${ownerId})`);
    } catch (notifError) {
      console.error('⚠️  Failed to send notification to owner:', notifError.message);
    }
    
    // Send notification to all admins for awareness
    try {
      const admins = await getAll('SELECT Id FROM Admins WHERE IsActive = 1');
      for (const admin of admins) {
        await runQuery(`
          INSERT INTO Notifications (AdminId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
          VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `, [
          admin.Id,
          'property_pending_admin',
          'New Property Awaiting Approval',
          `Property "${propertyTitle}" by ${agent?.Name || 'Unknown'} is pending owner approval.`,
          propertyId
        ]);
      }
      console.log(`✅ Notifications sent to ${admins.length} admin(s)`);
    } catch (adminNotifError) {
      console.error('⚠️  Failed to send notification to admins:', adminNotifError.message);
    }
    
    console.log('✅ Property created successfully:', propertyId);
    console.log('📧 Approval workflow initiated: Owner → Admin → Live');
    
    res.status(201).json({
      success: true,
      message: 'Property submitted successfully. Pending owner and admin approval.',
      data: property
    });
  } catch (error) {
    console.error('❌ Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
});

// Update property
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;
    const userType = req.user.userType;
    
    if (userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can update properties'
      });
    }
    
    // Verify property belongs to agent
    const property = await getOne('SELECT * FROM Properties WHERE Id = ? AND AgentId = ?', [id, agentId]);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to update it'
      });
    }
    
    const {
      type, propertyType, title, description, price, size,
      address, city, state, pincode,
      bedrooms, bathrooms, balconies, propertyAge, facing, houseType, furnishing,
      status
    } = req.body;
    
    await runQuery(`
      UPDATE Properties SET
        ListingType = COALESCE(?, ListingType),
        PropertyType = COALESCE(?, PropertyType),
        Title = COALESCE(?, Title),
        Description = COALESCE(?, Description),
        Price = COALESCE(?, Price),
        Size = COALESCE(?, Size),
        Address = COALESCE(?, Address),
        City = COALESCE(?, City),
        State = COALESCE(?, State),
        Pincode = COALESCE(?, Pincode),
        Bedrooms = COALESCE(?, Bedrooms),
        Bathrooms = COALESCE(?, Bathrooms),
        Balconies = COALESCE(?, Balconies),
        PropertyAge = COALESCE(?, PropertyAge),
        Facing = COALESCE(?, Facing),
        HouseType = COALESCE(?, HouseType),
        Furnishing = COALESCE(?, Furnishing),
        Status = COALESCE(?, Status),
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `, [
      type, propertyType, title, description, price, size,
      address, city, state, pincode,
      bedrooms, bathrooms, balconies, propertyAge, facing, houseType, furnishing,
      status, id
    ]);
    
    const updatedProperty = await getOne('SELECT * FROM Properties WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
});

// Delete property
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;
    const userType = req.user.userType;
    
    if (userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can delete properties'
      });
    }
    
    // Verify property belongs to agent
    const property = await getOne('SELECT * FROM Properties WHERE Id = ? AND AgentId = ?', [id, agentId]);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have permission to delete it'
      });
    }
    
    await runQuery('DELETE FROM Properties WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
});

// ========================================
// APPROVAL ENDPOINTS
// ========================================

// Owner approves/rejects property
router.post('/:id/owner-approval', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;
    const { action, reason } = req.body; // action: 'approve' or 'reject'
    
    // Verify user is the owner
    if (userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can approve/reject properties'
      });
    }
    
    const property = await getOne('SELECT * FROM Properties WHERE Id = ? AND OwnerId = ?', [id, userId]);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you are not the owner'
      });
    }
    
    if (property.OwnerApprovalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Property already ${property.OwnerApprovalStatus} by owner`
      });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }
    
    if (action === 'approve') {
      // Owner approved - now needs admin approval
      await runQuery(`
        UPDATE Properties 
        SET OwnerApprovalStatus = 'approved',
            OwnerApprovedAt = CURRENT_TIMESTAMP,
            UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = ?
      `, [id]);
      
      // Notify agent
      await runQuery(`
        INSERT INTO Notifications (AgentId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.AgentId,
        'property_owner_approved',
        'Property Approved by Owner',
        `Owner has approved your property listing "${property.Title}". Awaiting admin approval.`,
        id
      ]);
      
      // Notify admins - property is now pending their approval
      const admins = await getAll('SELECT Id FROM Admins WHERE IsActive = 1');
      for (const admin of admins) {
        await runQuery(`
          INSERT INTO Notifications (AdminId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
          VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `, [
          admin.Id,
          'property_pending_admin_approval',
          'Property Pending Your Approval',
          `Property "${property.Title}" has been approved by owner. Please review for final approval.`,
          id
        ]);
      }
      
      // Get owner details for email
      const owner = await getOne('SELECT Name, Email FROM Users WHERE Id = ?', [property.OwnerId]);
      
      // Send approval confirmation email to owner
      if (owner && owner.Email) {
        await sendPropertyApprovalEmail(owner.Email, owner.Name, {
          title: property.Title,
          propertyType: property.PropertyType,
          city: property.City,
          price: property.Price,
          listingType: property.ListingType,
          agentName: property.AgentName,
          propertyId: id
        });
      }
      
      console.log(`✅ Property ${id} approved by owner. Pending admin approval.`);
      console.log(`📧 Approval confirmation email sent to: ${owner?.Email}`);
      
      return res.json({
        success: true,
        message: 'Property approved successfully. Pending admin approval.'
      });
    } else {
      // Owner rejected
      await runQuery(`
        UPDATE Properties 
        SET OwnerApprovalStatus = 'rejected',
            OwnerRejectionReason = ?,
            Status = 'inactive',
            UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = ?
      `, [reason || 'No reason provided', id]);
      
      // Notify agent
      await runQuery(`
        INSERT INTO Notifications (AgentId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.AgentId,
        'property_owner_rejected',
        'Property Rejected by Owner',
        `Owner has rejected your property listing "${property.Title}". Reason: ${reason || 'No reason provided'}`,
        id
      ]);
      
      // Get owner details for email
      const owner = await getOne('SELECT Name, Email FROM Users WHERE Id = ?', [property.OwnerId]);
      
      // Send rejection confirmation email to owner
      if (owner && owner.Email) {
        await sendPropertyRejectionEmail(owner.Email, owner.Name, {
          title: property.Title,
          propertyType: property.PropertyType,
          city: property.City,
          agentName: property.AgentName
        }, reason);
      }
      
      console.log(`❌ Property ${id} rejected by owner.`);
      console.log(`📧 Rejection confirmation email sent to: ${owner?.Email}`);
      
      return res.json({
        success: true,
        message: 'Property rejected successfully.'
      });
    }
  } catch (error) {
    console.error('Owner approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process owner approval',
      error: error.message
    });
  }
});

// Admin approves/rejects property
router.post('/:id/admin-approval', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const userType = req.user.userType;
    const { action, reason, notes } = req.body; // action: 'approve' or 'reject'
    
    // Verify user is an admin
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve/reject properties'
      });
    }
    
    const property = await getOne('SELECT * FROM Properties WHERE Id = ?', [id]);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if owner has approved first
    if (property.OwnerApprovalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Property must be approved by owner first. Current status: ${property.OwnerApprovalStatus}`
      });
    }
    
    if (property.AdminApprovalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Property already ${property.AdminApprovalStatus} by admin`
      });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }
    
    if (action === 'approve') {
      // Admin approved - property goes live
      await runQuery(`
        UPDATE Properties 
        SET AdminApprovalStatus = 'approved',
            AdminApprovedAt = CURRENT_TIMESTAMP,
            AdminApprovedBy = ?,
            ApprovalNotes = ?,
            Status = 'active',
            PublishedAt = CURRENT_TIMESTAMP,
            UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = ?
      `, [adminId, notes || null, id]);
      
      // Notify agent - property is now live
      await runQuery(`
        INSERT INTO Notifications (AgentId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.AgentId,
        'property_approved_live',
        'Property is Now Live!',
        `Congratulations! Your property listing "${property.Title}" has been approved and is now live.`,
        id
      ]);
      
      // Notify owner - property is live
      await runQuery(`
        INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.OwnerId,
        'property_live',
        'Your Property is Live',
        `Your property "${property.Title}" is now live and available for ${property.ListingType}.`,
        id
      ]);
      
      // Get owner details for email
      const owner = await getOne('SELECT Name, Email FROM Users WHERE Id = ?', [property.OwnerId]);
      
      // Send property live email to owner
      if (owner && owner.Email) {
        await sendPropertyLiveEmail(owner.Email, owner.Name, {
          title: property.Title,
          propertyType: property.PropertyType,
          city: property.City,
          price: property.Price,
          listingType: property.ListingType,
          propertyId: id
        });
      }
      
      console.log(`✅ Property ${id} approved by admin ${adminId}. Now LIVE!`);
      console.log(`📧 Property live email sent to owner: ${owner?.Email}`);
      
      return res.json({
        success: true,
        message: 'Property approved successfully and is now live.'
      });
    } else {
      // Admin rejected
      await runQuery(`
        UPDATE Properties 
        SET AdminApprovalStatus = 'rejected',
            AdminRejectionReason = ?,
            AdminApprovedBy = ?,
            ApprovalNotes = ?,
            Status = 'inactive',
            UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = ?
      `, [reason || 'No reason provided', adminId, notes || null, id]);
      
      // Notify agent
      await runQuery(`
        INSERT INTO Notifications (AgentId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.AgentId,
        'property_admin_rejected',
        'Property Rejected by Admin',
        `Admin has rejected your property listing "${property.Title}". Reason: ${reason || 'No reason provided'}`,
        id
      ]);
      
      // Notify owner
      await runQuery(`
        INSERT INTO Notifications (UserId, Type, Title, Message, RelatedId, IsRead, CreatedAt)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [
        property.OwnerId,
        'property_admin_rejected',
        'Property Rejected by Admin',
        `Your property "${property.Title}" was rejected by admin. Reason: ${reason || 'No reason provided'}`,
        id
      ]);
      
      console.log(`❌ Property ${id} rejected by admin ${adminId}.`);
      
      return res.json({
        success: true,
        message: 'Property rejected successfully.'
      });
    }
  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process admin approval',
      error: error.message
    });
  }
});

  module.exports = router;
