const { getOne } = require('../config/database');

/**
 * Generate unique user code based on role with retry mechanism
 * @param {string} role - User role (buyer, seller, both, agent)
 * @param {string} table - Table name (Users or Agents)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} Generated unique user code
 */
const generateUserCode = async (role, table = 'Users', maxRetries = 10) => {
  // Define role prefixes
  const rolePrefixes = {
    'buyer': 'buy',
    'seller': 'sel',
    'both': 'bot',
    'agent': 'age'
  };

  // Get prefix for role (default to 'usr' if role not found)
  const prefix = rolePrefixes[role.toLowerCase()] || 'usr';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get the latest usercode with this prefix from the table
      const query = `
        SELECT UserCode 
        FROM ${table} 
        WHERE UserCode LIKE '${prefix}-%' 
        ORDER BY CAST(SUBSTR(UserCode, ${prefix.length + 2}) AS INTEGER) DESC 
        LIMIT 1
      `;
      
      const result = await getOne(query);
      
      let nextNumber = 1001; // Start from 1001
      
      if (result && result.UserCode) {
        // Extract number from existing code (e.g., "buy-1001" -> 1001)
        const currentNumber = parseInt(result.UserCode.split('-')[1]);
        nextNumber = currentNumber + 1;
      }
      
      // Add small random delay to reduce race conditions (0-100ms)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      }
      
      // Generate new code (e.g., "buy-1001")
      const userCode = `${prefix}-${nextNumber}`;
      
      // Check if this code already exists (double-check for uniqueness)
      const checkQuery = `SELECT UserCode FROM ${table} WHERE UserCode = ?`;
      const existing = await getOne(checkQuery, [userCode]);
      
      if (!existing) {
        // Code is unique, return it
        console.log(`✅ Generated unique UserCode: ${userCode} (attempt ${attempt + 1})`);
        return userCode;
      } else {
        console.log(`⚠️  UserCode ${userCode} already exists, retrying... (attempt ${attempt + 1})`);
        // Code exists, retry
        continue;
      }
      
    } catch (error) {
      console.error(`Error generating user code (attempt ${attempt + 1}):`, error);
      
      // On last attempt, use timestamp-based fallback
      if (attempt === maxRetries - 1) {
        const fallbackCode = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log(`⚠️  Using fallback code: ${fallbackCode}`);
        return fallbackCode;
      }
    }
  }
  
  // If all retries fail, use timestamp-based code with random component
  const emergencyCode = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  console.error(`❌ All retries failed, using emergency code: ${emergencyCode}`);
  return emergencyCode;
};

/**
 * Generate user code for buyer/seller/both
 * @param {string} role - User role
 * @returns {Promise<string>} Generated user code
 */
const generateUserUserCode = async (role) => {
  return await generateUserCode(role, 'Users');
};

/**
 * Generate user code for agent
 * @returns {Promise<string>} Generated user code
 */
const generateAgentUserCode = async () => {
  return await generateUserCode('agent', 'Agents');
};

module.exports = {
  generateUserCode,
  generateUserUserCode,
  generateAgentUserCode
};
