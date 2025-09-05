// Temporarily disable Prisma to isolate the issue
// const { prisma } = require('../lib/prisma.js');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test endpoint first
    if (req.query.test === 'true') {
      return res.status(200).json({ 
        message: 'API is working', 
        timestamp: new Date().toISOString(),
        hasDatabase: !!process.env.DATABASE_URL,
        nodeVersion: process.version
      });
    }
    
    if (req.method === 'GET') {
      // Return mock data temporarily
      return res.status(200).json({ 
        files: [],
        message: 'Database temporarily disabled for debugging'
      });
    }

    if (req.method === 'POST') {
      // Mock file upload response
      const { name, type, size, content, section } = req.body;
      
      if (!name || !type || !content || !section) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check file size (5MB limit)
      if (size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }

      return res.status(201).json({ 
        file: {
          id: Date.now(),
          name,
          type,
          size,
          section,
          createdAt: new Date().toISOString()
        },
        message: 'Mock upload successful - database temporarily disabled'
      });
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({ 
        message: 'Mock delete successful - database temporarily disabled' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Always return JSON, never let it bubble up as HTML
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
