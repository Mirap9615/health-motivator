import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import checkAuth from "./CheckAuth.jsx"; 

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });

                const authStatus = await checkAuth();
                if (!authStatus.authenticated) {
                    navigate("/login");
                }
            } catch (error) {
                console.error("Logout failed:", error);
            }
        };

        performLogout();
    }, [navigate]);

    return <div>Logging out...</div>;
};

export default Logout;