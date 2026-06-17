import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, Bus, Trash2, MapPin, Clock, Users, Route as RouteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function BusModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ numberPlate: "", name: "", capacity: "40", driverName: "", driverPhone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm({ numberPlate: "", name: "", capacity: "40", driverName: "", driverPhone: "" }); setError(""); } }, [open]);
  if (!open) return null;
  const field = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";
  const save = async () => {
    if (!form.numberPlate.trim()) { setError("Number plate is required"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, capacity: parseInt(form.capacity) || 40 }); onClose(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Add Bus</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-3">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Number Plate <span className="text-rose-400">*</span></label><input value={form.numberPlate} onChange={(e) => setForm({ ...form, numberPlate: e.target.value })} placeholder="BA 1 KHA 1234" className={field} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Bus Name / Nickname</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bus 1" className={field} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Seat Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={field} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Driver</label><input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Driver Phone</label><input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} className={field} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button><button onClick={save} disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Adding…" : "Add Bus"}</button></div>
      </div>
    </div>
  );
}

function RouteModal({ open, onClose, busId, onSave }: { open: boolean; onClose: () => void; busId: string; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", startPoint: "", endPoint: "", stops: "", fee: "0", tripsPerDay: "2", departureTimes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm({ name: "", startPoint: "", endPoint: "", stops: "", fee: "0", tripsPerDay: "2", departureTimes: "" }); setError(""); } }, [open]);
  if (!open) return null;
  const field = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";
  const save = async () => {
    if (!form.name.trim()) { setError("Route name is required"); return; }
    setSaving(true); setError("");
    try {
      await onSave({
        name: form.name, startPoint: form.startPoint || null, endPoint: form.endPoint || null,
        stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
        fee: parseFloat(form.fee) || 0, tripsPerDay: parseInt(form.tripsPerDay) || 2,
        departureTimes: form.departureTimes.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onClose();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Add Route</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-3">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Route Name <span className="text-rose-400">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Route A" className={field} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">From</label><input value={form.startPoint} onChange={(e) => setForm({ ...form, startPoint: e.target.value })} placeholder="Pulchowk" className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">To</label><input value={form.endPoint} onChange={(e) => setForm({ ...form, endPoint: e.target.value })} placeholder="School" className={field} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Stops (comma separated)</label><input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} placeholder="Kupondole, Jawalakhel, Lagankhel" className={field} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Monthly Fee (Rs)</label><input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Trips / day</label><input type="number" value={form.tripsPerDay} onChange={(e) => setForm({ ...form, tripsPerDay: e.target.value })} className={field} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Departure Times (comma separated)</label><input value={form.departureTimes} onChange={(e) => setForm({ ...form, departureTimes: e.target.value })} placeholder="07:00, 15:30" className={field} /></div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button><button onClick={save} disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Adding…" : "Add Route"}</button></div>
      </div>
    </div>
  );
}

export default function Transport() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busModal, setBusModal] = useState(false);
  const [routeModal, setRouteModal] = useState<string | null>(null);

  const load = () => { setLoading(true); api.admin.buses().then((d: any) => setBuses(d.buses ?? [])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transport</h1>
            <p className="text-sm text-gray-500 mt-0.5">{buses.length} buses · manage fleet, routes & timings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></button>
            <button onClick={() => setBusModal(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700"><Plus className="w-3.5 h-3.5" /> Add Bus</button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
        ) : buses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Bus className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No buses yet. <button onClick={() => setBusModal(true)} className="text-blue-600">Add your first bus →</button></p>
          </div>
        ) : (
          <div className="space-y-4">
            {buses.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Bus className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.name ?? b.numberPlate} <span className="font-mono text-xs text-gray-400 ml-1">{b.numberPlate}</span></p>
                      <p className="text-xs text-gray-400">Capacity {b.capacity}{b.driverName ? ` · Driver ${b.driverName}` : ""}{b.driverPhone ? ` (${b.driverPhone})` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setRouteModal(b.id)} className="text-xs flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100"><Plus className="w-3 h-3" /> Route</button>
                    <button onClick={async () => { if (confirm("Delete this bus and all its routes?")) { await api.admin.deleteBus(b.id); load(); } }} className="p-1.5 text-gray-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {b.routes.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 grid sm:grid-cols-2 gap-3">
                    {b.routes.map((r: any) => (
                      <div key={r.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><RouteIcon className="w-3.5 h-3.5 text-blue-400" />{r.name}</p>
                          <button onClick={async () => { if (confirm("Delete this route?")) { await api.admin.deleteBusRoute(r.id); load(); } }} className="p-0.5 text-gray-300 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        {(r.startPoint || r.endPoint) && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.startPoint} → {r.endPoint}</p>}
                        {r.stops?.length > 0 && <p className="text-[11px] text-gray-400 mt-1">Stops: {r.stops.join(" · ")}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">Rs {r.fee}/mo</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{r.tripsPerDay}×/day</span>
                          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{r.studentCount}</span>
                        </div>
                        {r.departureTimes?.length > 0 && <p className="text-[11px] text-gray-400 mt-1">Departs: {r.departureTimes.join(", ")}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BusModal open={busModal} onClose={() => setBusModal(false)} onSave={async (d) => { await api.admin.createBus(d); load(); }} />
      {routeModal && <RouteModal open={!!routeModal} onClose={() => setRouteModal(null)} busId={routeModal} onSave={async (d) => { await api.admin.createBusRoute(routeModal!, d); load(); }} />}
    </>
  );
}
