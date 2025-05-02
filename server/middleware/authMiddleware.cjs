function isAuthenticated(req, res, next) {
    if (req.session && req.session.user && req.session.user.user_id) {
      return next(); 
    } else {
      return res.status(401).json({ error: "Unauthorized: Authentication required." });
    }
  }
  
  module.exports = { isAuthenticated };