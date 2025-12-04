"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useRouter } from "next/navigation";
import { apiService, AdminMenuItem } from "../../utils/api";

const AdminHomePage = () => {
  const [menu, setMenu] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isLoggedIn, logout } = useUser();

  useEffect(() => {
    // Gate admin page: allow either a sessionStorage admin flag (admin login flow)
    // or a logged-in user with role 'admin'. Otherwise redirect to admin login.
    const isAdminSession = typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "1";
    const userIsAdmin = !!(user && (user.role === 'admin' || (user as any).is_admin === true));
    if (!isAdminSession && !userIsAdmin) {
      router.push("/pages/adminlogin");
      return;
    }

    apiService
      .getAdminHome()
      .then((data) => {
        setMenu(data.menu);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // Admin logout handler
  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      // Invalidate server refresh token if present (sessionStorage kept for legacy flows)
      const refreshToken = sessionStorage.getItem("refreshToken") || (localStorage.getItem('cinema_tokens') ? JSON.parse(localStorage.getItem('cinema_tokens') as string).refreshToken : null);
      if (refreshToken) {
        try {
          await apiService.fetchApi('/api/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) {
          // ignore errors during logout
        }
      }

      // Clear both legacy sessionStorage and app localStorage tokens/user
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("isAdmin");
      try { localStorage.removeItem('cinema_tokens'); } catch {}
      try { localStorage.removeItem('cinema_user'); } catch {}
      // Update UserContext
      try { logout(); } catch {}

      window.dispatchEvent(new Event("storage"));
    }
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <div className="glass-card p-8 text-white text-xl">
          Loading admin menu...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex flex-col items-center justify-center">
      <div className="glass-card p-8 w-full max-w-xl flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Admin Main Menu
        </h1>
        <ul className="space-y-4 w-full mb-8">
          {menu.map((item) => (
            <li key={item.path}>
              <button
                className="w-full glass-button py-4 rounded-lg font-bold text-white text-lg hover:text-gray-200 shadow-lg transition-all duration-200"
                onClick={() => {
                  // Remove all leading slashes and all leading "admin/" or "/admin/"
                  let cleanPath = item.path.replace(/^\/+/, ""); // remove leading slashes
                  cleanPath = cleanPath.replace(/^admin\//, ""); // remove leading admin/
                  cleanPath = cleanPath.replace(
                    /^pages\/admin\//,
                    ""
                  ); // remove leading pages/admin/ if present
                  const targetPath = `/pages/admin/${cleanPath}`;
                  router.push(targetPath);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-center w-full">
          <button
            className="mt-4 px-6 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;