"use client";

import { useState } from "react";
import { toggleInstrumentLock, updateInstrumentContent } from "./actions";
import { Button } from "@/components/ui/button";

export default function QuestionsClient({ initialInstruments }: { initialInstruments: any[] }) {
  const [instruments, setInstruments] = useState(initialInstruments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleToggleLock = async (id: string, currentlyEditable: boolean) => {
    if (!currentlyEditable) {
      if (!confirm("⚠️ Peringatan: Mengubah instrumen dapat mempengaruhi validitas hasil assessment dan distribusi archetype. Yakin ingin membuka (unlock)?")) {
        return;
      }
    }
    setLoading(true);
    await toggleInstrumentLock(id, currentlyEditable);
    setInstruments(instruments.map(i => i._id === id ? { ...i, editable: !currentlyEditable } : i));
    setLoading(false);
  };

  const startEdit = (inst: any) => {
    setEditingId(inst._id);
    setEditForm(JSON.parse(JSON.stringify(inst))); // deep copy
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    setLoading(true);
    await updateInstrumentContent(editingId!, editForm);
    setInstruments(instruments.map(i => i._id === editingId ? { ...editForm, version: editForm.version + 1 } : i));
    setEditingId(null);
    setEditForm(null);
    setLoading(false);
  };

  return (
    <div className="space-y-8 mt-8">
      {instruments.map((section) => {
        const isEditing = editingId === section._id;
        const currentData = isEditing ? editForm : section;

        return (
          <div key={section.instrumentId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2">
                  {currentData.title} ({currentData.instrumentId})
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full lowercase font-normal">v{currentData.version}</span>
                </h2>
                {isEditing ? (
                  <input 
                    className="w-full text-sm mt-2 border border-slate-300 rounded p-1"
                    value={currentData.instruction}
                    onChange={e => setEditForm({...editForm, instruction: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-slate-500 mt-1">{currentData.instruction}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button 
                  variant={section.editable ? "destructive" : "secondary"} 
                  size="sm" 
                  onClick={() => handleToggleLock(section._id, section.editable)}
                  disabled={loading || isEditing}
                >
                  {section.editable ? "🔓 Unlocked" : "🔒 Locked"}
                </Button>
                {section.editable && !isEditing && (
                  <Button size="sm" onClick={() => startEdit(section)}>Edit Konten</Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Batal</Button>
                    <Button size="sm" onClick={saveEdit} disabled={loading}>Simpan</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold w-12">No</th>
                    <th className="px-6 py-3 font-semibold">Pertanyaan</th>
                    <th className="px-6 py-3 font-semibold w-32">Subscale</th>
                    {isEditing && <th className="px-6 py-3 font-semibold w-16">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.questions.map((q: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {isEditing ? (
                          <input 
                            className="w-full border border-slate-300 rounded p-1"
                            value={q.text}
                            onChange={(e) => {
                              const newQ = [...editForm.questions];
                              newQ[idx].text = e.target.value;
                              setEditForm({...editForm, questions: newQ});
                            }}
                          />
                        ) : q.text}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {isEditing ? (
                          <select
                            className="border border-slate-300 rounded p-1 w-full"
                            value={q.subscale || ""}
                            onChange={(e) => {
                              const newQ = [...editForm.questions];
                              newQ[idx].subscale = e.target.value || undefined;
                              setEditForm({...editForm, questions: newQ});
                            }}
                          >
                            <option value="">-</option>
                            <option value="depression">Depression</option>
                            <option value="anxiety">Anxiety</option>
                            <option value="stress">Stress</option>
                          </select>
                        ) : (
                          q.subscale ? (
                            <span className="inline-flex px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold capitalize">
                              {q.subscale}
                            </span>
                          ) : "-"
                        )}
                      </td>
                      {isEditing && (
                        <td className="px-6 py-4">
                          <button 
                            className="text-red-500 text-xs font-bold"
                            onClick={() => {
                              const newQ = editForm.questions.filter((_: any, i: number) => i !== idx);
                              setEditForm({...editForm, questions: newQ});
                            }}
                          >
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {isEditing && (
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-center">
                        <button 
                          className="text-indigo-600 text-xs font-bold hover:underline"
                          onClick={() => {
                            setEditForm({
                              ...editForm, 
                              questions: [...editForm.questions, { id: `new_${Date.now()}`, text: "", subscale: "" }]
                            });
                          }}
                        >
                          + Tambah Pertanyaan
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Skala Jawaban:</span> 
                {isEditing ? (
                  <div className="flex gap-2 items-center flex-wrap">
                    {currentData.scaleLabels.map((label: string, labelIdx: number) => (
                      <input 
                        key={labelIdx}
                        className="border border-slate-300 rounded px-2 py-1 text-xs w-32"
                        value={label}
                        onChange={(e) => {
                          const newLabels = [...editForm.scaleLabels];
                          newLabels[labelIdx] = e.target.value;
                          setEditForm({...editForm, scaleLabels: newLabels});
                        }}
                      />
                    ))}
                    <button 
                      className="text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded"
                      onClick={() => {
                        setEditForm({
                          ...editForm, 
                          scaleLabels: [...editForm.scaleLabels, `Opsi ${editForm.scaleLabels.length}`]
                        });
                      }}
                    >
                      + Tambah
                    </button>
                    <button 
                      className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded ml-2"
                      onClick={() => {
                        if (editForm.scaleLabels.length > 2) {
                          setEditForm({
                            ...editForm, 
                            scaleLabels: editForm.scaleLabels.slice(0, -1)
                          });
                        }
                      }}
                    >
                      - Kurangi
                    </button>
                  </div>
                ) : (
                  currentData.scaleLabels.join(" | ")
                )}
              </div>
              <div className="text-xs text-slate-400">
                Terakhir diubah oleh: <span className="font-medium text-slate-500">{currentData.updatedBy}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
