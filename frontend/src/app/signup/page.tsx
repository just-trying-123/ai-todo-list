"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | string[]>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.signup(username, password);
      router.push("/login");
    } catch (err: any) {
      // Show all error messages from backend
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") setError(data);
        else if (data.detail) setError(data.detail);
        else setError(Object.values(data).flat() as string[]);
      } else {
        setError("Signup failed. Please try a different username.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 32, background: "#fff", border: "1px solid #ddd", borderRadius: 12, boxShadow: "0 2px 12px #0001" }}>
      <h2 style={{ textAlign: "center", marginBottom: 28, fontSize: 28, fontWeight: 700, color: '#222' }}>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, color: '#222' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6, fontSize: 16, border: '1px solid #bbb', borderRadius: 6, color: '#000', background: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, color: '#222' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6, fontSize: 16, border: '1px solid #bbb', borderRadius: 6, color: '#000', background: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 500, color: '#222' }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 6, fontSize: 16, border: '1px solid #bbb', borderRadius: 6, color: '#000', background: '#fff' }}
          />
        </div>
        {error && (
          <div style={{ color: "red", marginBottom: 18, fontWeight: 500, fontSize: 15 }}>
            {Array.isArray(error) ? error.map((e, i) => <div key={i}>{e}</div>) : error}
          </div>
        )}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, fontSize: 18, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
} 