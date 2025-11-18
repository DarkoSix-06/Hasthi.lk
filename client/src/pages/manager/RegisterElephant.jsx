import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createElephant } from "../../api/elephant";
import { Loader, Save, MapPin, Calendar, User, StickyNote, Image as ImageIcon, Activity, Syringe } from "lucide-react";

// Brand icon (same as other pages)
const ElephantIcon = ({ className = "w-8 h-8", color = "currentColor" }) => (
  <svg viewBox="0 0 100 100" className={className} fill={color} aria-hidden="true">
    <path d="M20 60c0-15 10-25 25-25s25 10 25 25c0 8-3 15-8 20h-34c-5-5-8-12-8-20z" />
    <circle cx="35" cy="55" r="2" fill="white" />
    <path d="M15 65c-5 0-8 3-8 8s3 8 8 8c2 0 4-1 5-2" />
    <path d="M45 40c-8-5-15-3-20 2" />
    <circle cx="25" cy="75" r="8" opacity="0.1" />
    <circle cx="55" cy="75" r="8" opacity="0.1" />
  </svg>
);

export default function RegisterElephant() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    location: "",
    notes: "",
    // health
    healthStatus: "Unknown",
    weightKg: "",
    heightM: "",
    lastCheckup: "",
    vaccinations: "",
    healthNotes: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // basic client-side validation
  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (form.age !== "" && Number(form.age) < 0) e.age = "Age cannot be negative.";
    if (form.weightKg !== "" && Number(form.weightKg) < 0) e.weightKg = "Weight cannot be negative.";
    if (form.heightM !== "" && Number(form.heightM) < 0) e.heightM = "Height cannot be negative.";
    return e;
  }, [form.name, form.age, form.weightKg, form.heightM]);

  const onImageChange = (file) => {
    setImageFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview("");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (Object.keys(errors).length) return; // don't submit if client-side errors
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("gender", form.gender);
      if (form.location) fd.append("location", form.location.trim());
      if (form.notes) fd.append("notes", form.notes.trim());
      if (form.age !== "") fd.append("age", String(Number(form.age)));

      // health details
      if (form.healthStatus) fd.append("healthStatus", form.healthStatus);
      if (form.weightKg !== "") fd.append("weightKg", String(Number(form.weightKg)));
      if (form.heightM !== "") fd.append("heightM", String(Number(form.heightM)));
      if (form.lastCheckup) fd.append("lastCheckup", form.lastCheckup); // yyyy-mm-dd
      if (form.vaccinations) fd.append("vaccinations", form.vaccinations.trim());
      if (form.healthNotes) fd.append("healthNotes", form.healthNotes.trim());

      if (imageFile) fd.append("image", imageFile);

      await createElephant(fd); // will send multipart/form-data
      nav("/manager/manage-elephant");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <ElephantIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register Elephant</h1>
              <p className="text-gray-600">Add a new elephant to the sanctuary registry.</p>
              <div className="mt-2 w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-emerald-100 max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter elephant name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                ${errors.name ? "border-red-300" : "border-gray-300"}`}
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age (years)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="number"
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                min={0}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
                ${errors.age ? "border-red-300" : "border-gray-300"}`}
              />
            </div>
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Current location (optional)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <div className="relative">
              <StickyNote className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <textarea
                placeholder="Additional notes about the elephant..."
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 cursor-pointer">
                <ImageIcon className="w-4 h-4 mr-2 text-gray-700" />
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImageChange(e.target.files?.[0])}
                />
              </label>
              {imageFile && <span className="text-gray-600 text-sm">{imageFile.name}</span>}
            </div>
            {preview && (
              <div className="mt-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-w-md rounded-xl border object-cover"
                />
              </div>
            )}
          </div>

          {/* Health Section header */}
          <div className="md:col-span-2">
            <div className="mt-1 mb-2 flex items-center gap-2 text-emerald-700">
              <Activity className="w-5 h-5" />
              <h2 className="font-semibold">Health Details</h2>
            </div>
            <div className="h-px bg-emerald-100" />
          </div>

          {/* Health Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Health Status</label>
            <select
              value={form.healthStatus}
              onChange={(e) => setForm({ ...form, healthStatus: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option>Healthy</option>
              <option>Under Treatment</option>
              <option>Recovering</option>
              <option>Unknown</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              min={0}
              step="0.1"
              placeholder="e.g., 2500"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
              ${errors.weightKg ? "border-red-300" : "border-gray-300"}`}
            />
            {errors.weightKg && <p className="mt-1 text-sm text-red-600">{errors.weightKg}</p>}
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (m)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g., 2.7"
              value={form.heightM}
              onChange={(e) => setForm({ ...form, heightM: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors
              ${errors.heightM ? "border-red-300" : "border-gray-300"}`}
            />
            {errors.heightM && <p className="mt-1 text-sm text-red-600">{errors.heightM}</p>}
          </div>

          {/* Last Checkup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Checkup</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="date"
                value={form.lastCheckup}
                onChange={(e) => setForm({ ...form, lastCheckup: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Vaccinations */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Vaccinations</label>
            <div className="relative">
              <Syringe className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g., Anthrax (2024-05-12), Tetanus (2024-06-02)"
                value={form.vaccinations}
                onChange={(e) => setForm({ ...form, vaccinations: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Health Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Health Notes</label>
            <textarea
              placeholder="Any additional health information..."
              rows={4}
              value={form.healthNotes}
              onChange={(e) => setForm({ ...form, healthNotes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Error banner */}
        {err && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">
            {err}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || Object.keys(errors).length > 0}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all font-medium shadow-lg flex items-center"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
