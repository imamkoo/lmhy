"use client";

import { useState } from "react";
import { createArchetype, updateArchetype, deleteArchetype } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ArchetypesClient({ initialArchetypes }: { initialArchetypes: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const defaultForm = {
    archetypeId: "", name: "", emoji: "", imageUrl: "", tagline: "", description: "", signals: "", gradient: "", accentColor: ""
  };
  const [form, setForm] = useState(defaultForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleEdit = (arch: any) => {
    setForm({
      ...arch,
      imageUrl: arch.imageUrl || "",
      signals: arch.signals.join(", "),
    });
    setEditingId(arch._id);
    setOpen(true);
  };

  const handleNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm({ ...form, imageUrl: data.url });
      } else {
        alert("Gagal upload gambar: " + data.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan saat upload gambar.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Ensure imageUrl is included in formData
    formData.set("imageUrl", form.imageUrl);

    if (editingId) {
      await updateArchetype(editingId, formData);
    } else {
      await createArchetype(formData);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Archetypes</h1>
          <p className="text-slate-500 mt-1">Kelola profil psikologis yang akan di-assign ke user.</p>
        </div>
        <Button onClick={handleNew}>+ Tambah Archetype</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Archetype" : "Tambah Archetype"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>ID (Unique)</Label>
              <Input name="archetypeId" value={form.archetypeId} onChange={(e) => setForm({ ...form, archetypeId: e.target.value })} required placeholder="e.g. silent_burnout" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label>Icon</Label>
                <div className="relative group mt-1 h-16 w-full rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt="Icon" className="w-full h-full object-cover bg-white" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center justify-center h-full text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Upload overlay */}
                  <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold cursor-pointer transition-opacity">
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                </div>
                {uploadingImage && <p className="text-[10px] text-indigo-500 mt-1">Uploading...</p>}
              </div>
              <div className="col-span-3">
                <Label>Nama</Label>
                <Input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="The Silent Burnout" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input name="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} required placeholder="Lelah tapi terus berjalan." />
            </div>
            <div>
              <Label>Deskripsi Lengkap</Label>
              <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full h-24 p-3 rounded-md border border-slate-200 text-sm" placeholder="Kamu mungkin merasa..."></textarea>
            </div>
            <div>
              <Label>Signals (Pisahkan dengan koma)</Label>
              <Input name="signals" value={form.signals} onChange={(e) => setForm({ ...form, signals: e.target.value })} required placeholder="Sulit bangun pagi, Sering menahan marah" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tailwind Gradient</Label>
                <Input name="gradient" value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} placeholder="from-slate-800 to-slate-900" />
              </div>
              <div>
                <Label>Accent Color (Hex)</Label>
                <Input name="accentColor" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} placeholder="#334155" />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialArchetypes.map((arch: any) => (
          <div key={arch._id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${arch.gradient}`}></div>
            <div className="flex justify-between items-start mb-3">
              {arch.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={arch.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt={arch.name} className="w-10 h-10 object-cover rounded-md bg-slate-100 shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-100 shadow-inner flex items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(arch)} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Edit</button>
                <button onClick={() => deleteArchetype(arch._id)} className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Hapus</button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-800">{arch.name}</h3>
            <p className="text-sm text-slate-500 italic mb-3">"{arch.tagline}"</p>
            <div className="flex flex-wrap gap-1">
              {arch.signals.slice(0, 2).map((s: string) => (
                <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {arch.signals.length > 2 && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">+{arch.signals.length - 2}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
