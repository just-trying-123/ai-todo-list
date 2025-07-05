"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 32, background: "#fff", border: "1px solid #ddd", borderRadius: 12, boxShadow: "0 2px 12px #0001" }}>
      <h2 style={{ textAlign: "center", marginBottom: 28, fontSize: 28, fontWeight: 700, color: '#222' }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, color: '#333' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6, fontSize: 16, border: '1px solid #bbb', borderRadius: 6, color: '#000', background: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, color: '#333' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6, fontSize: 16, border: '1px solid #bbb', borderRadius: 6, color: '#000', background: '#fff' }}
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: 18, fontWeight: 500, fontSize: 15 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, fontSize: 18, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
} 