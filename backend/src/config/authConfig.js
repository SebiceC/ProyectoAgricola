module.exports = {
    saltRounds: 12, // Cost factor for hashing
    pepper: process.env.PEPPER_SECRET || 'default-pepper-secret' // Secret pepper value
  };