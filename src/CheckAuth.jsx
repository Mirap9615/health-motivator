const checkAuth = async () => {
    try {
        console.log("Starting auth check...");
        const response = await fetch("/api/auth/check", { credentials: "include" });
        console.log("Auth response status:", response.status);

        if (!response.ok) {
            throw new Error("Not authenticated");
        }

        const data = await response.json();
        console.log("Auth data:", data);

        if (!data.authenticated || !data.user) {
            console.log("Not authenticated based on response data");
            return { authenticated: false, user: null };
        }

        console.log("Authentication successful");
        return { authenticated: true, user: data.user };
    } catch (error) {
        console.log("Error checking auth:", error);
        return { authenticated: false, user: null };
    }
};

export default checkAuth;
