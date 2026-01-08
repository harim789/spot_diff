import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

export type MeUser = { id: string; username: string; role: "USER" | "ADMIN"; createdAt: string; };

type MeResponse = { user: MeUser };

type AuthContextValue = {
    me: MeUser | null;
    refreshMe: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: { children: React.ReactNode}) {
    const [me, setMe] = useState<MeUser | null>(null);

    const refreshMe = async () => {
        try {
            const data = await apiFetch<MeResponse>("/api/auth/me");
            setMe(data.user);
        } catch {
            setMe(null);
        }
    };

    const logout = async () => {
        await apiFetch("/api/auth/logout", {method: "POST"});
        await refreshMe();
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshMe();
    }, []);

    const value = useMemo(() => ({ me, refreshMe, logout }), [me]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth () {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}