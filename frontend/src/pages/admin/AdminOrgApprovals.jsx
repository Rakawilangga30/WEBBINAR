import { useEffect, useState } from "react";
import api from "../../api";

export default function AdminOrgApprovals() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/organization/applications");
            setApplications(res.data.applications || []);
        } catch (error) {
            console.error("Gagal memuat data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (appId, status) => {
        const reason = prompt(status === 'APPROVED' ? "Catatan Persetujuan (Opsional):" : "Alasan Penolakan:");
        if (status === 'REJECTED' && !reason) return alert("Alasan penolakan wajib diisi!");

        try {
            await api.post(`/admin/organization/applications/${appId}/review`, {
                status: status,
                rejection_reason: reason || ""
            });
            alert(`Aplikasi berhasil ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`);
            loadData(); // Refresh list
        } catch (error) {
            alert("Gagal memproses: " + (error.response?.data?.error || "Error"));
        }
    };

    return (
        <div style={{ background: "white", padding: 25, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#2d3748" }}>📝 Persetujuan Creator</h2>

            {loading ? <p>⏳ Memuat data...</p> : (
                applications.length === 0 ? (
                    <p style={{ color: "#718096", fontStyle: "italic" }}>Tidak ada pengajuan pending saat ini.</p>
                ) : (
                    <div style={{ display: "grid", gap: 20 }}>
                        {applications.map(app => (
                            <div key={app.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 15 }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 5px 0", color: "#2b6cb0" }}>
                                            {app.org_name} 
                                            <span style={{ fontSize: "0.7em", background: "#bee3f8", color: "#2b6cb0", padding: "2px 6px", borderRadius: 4, marginLeft: 8, verticalAlign: "middle" }}>
                                                {app.org_category}
                                            </span>
                                        </h3>
                                        <p style={{ margin: "5px 0", fontSize: 14, color: "#4a5568" }}>
                                            <strong>Pemohon:</strong> User ID {app.user_id} ({app.org_email})
                                        </p>
                                        <p style={{ margin: "10px 0", fontStyle: "italic", background: "#f7fafc", padding: 10, borderRadius: 4 }}>
                                            "{app.reason}"
                                        </p>
                                        {app.org_website && (
                                            <a href={app.org_website} target="_blank" rel="noreferrer" style={{ color: "#3182ce", fontSize: 14, textDecoration: "underline" }}>
                                                🔗 Lihat Website
                                            </a>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => handleReview(app.id, "APPROVED")} style={{ padding: "8px 16px", background: "#48bb78", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>
                                            ✅ Setujui
                                        </button>
                                        <button onClick={() => handleReview(app.id, "REJECTED")} style={{ padding: "8px 16px", background: "#f56565", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>
                                            ❌ Tolak
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}