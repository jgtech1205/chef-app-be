module.exports = (req, res) => {
  res.status(200).json({
    message: 'Test function working!',
    timestamp: new Date().toISOString()
  });
}; 