const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check-auth", {
        method: "GET",
        credentials: "include", 
      });
  
      if (!response.ok) {
        return { authenticated: false, user: null };
      }
  
      const data = await response.json();
      return { authenticated: true, user: data.user };
    } catch (error) {
      console.error("Error checking authentication:", error);
      return { authenticated: false, user: null };
    }
  };
  
  export default checkAuth;