const checkAuth = async () => {
    try {
        const response = await fetch("/api/auth/check-auth", { credentials: "include" });

<<<<<<< HEAD
function CheckAuth() {
    return (
        <>
            
        </>
    );
}
export default CheckAuth;
=======
        if (!response.ok) {
            throw new Error("Not authenticated");
        }

        const data = await response.json();

        if (!data.authenticated || !data.user) {
            return { authenticated: false, user: null };
        }

        return { authenticated: true, user: data.user };
    } catch (error) {
        console.log("Error checking auth:", error);
        return { authenticated: false, user: null };
    }
};

export default checkAuth;
>>>>>>> 4153a456c082424e8f5a7f39ab59f874e6b0839d
