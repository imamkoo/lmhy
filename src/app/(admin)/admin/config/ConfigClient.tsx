"use client";

import { useState } from "react";
import { updateConfig } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConfigClient({ initialConfig }: { initialConfig: any }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    await updateConfig(formData);
    setSaving(false);
    alert("Konfigurasi berhasil disimpan!");
  };

  const c = initialConfig || {
    thresholds: {
      depression: { mild: 10, moderate: 14, severe: 21, extremely_severe: 28 },
      anxiety: { mild: 8, moderate: 10, severe: 15, extremely_severe: 20 },
      stress: { mild: 15, moderate: 19, severe: 26, extremely_severe: 34 },
    },
    weights: { phq9: 0.3, gad7: 0.25, dass_depression: 0.2, dass_anxiety: 0.15, dass_stress: 0.1 }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Konfigurasi Engine</h1>
        <p className="text-slate-500 mt-1">Atur ambang batas severity dan bobot kalkulasi Mental Battery.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Thresholds Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Severity Thresholds (DASS-21, PHQ-9, GAD-7)</h2>
          
          <div className="space-y-6">
            {['depression', 'anxiety', 'stress'].map((scale) => (
              <div key={scale} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                <h3 className="font-semibold text-slate-700 capitalize mb-3">{scale}</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Mild</Label>
                    <Input type="number" step="0.1" name={`${scale.charAt(0)}_mild`} defaultValue={c.thresholds?.[scale]?.mild} required />
                  </div>
                  <div>
                    <Label className="text-xs">Moderate</Label>
                    <Input type="number" step="0.1" name={`${scale.charAt(0)}_moderate`} defaultValue={c.thresholds?.[scale]?.moderate} required />
                  </div>
                  <div>
                    <Label className="text-xs">Severe</Label>
                    <Input type="number" step="0.1" name={`${scale.charAt(0)}_severe`} defaultValue={c.thresholds?.[scale]?.severe} required />
                  </div>
                  <div>
                    <Label className="text-xs">Extremely Severe</Label>
                    <Input type="number" step="0.1" name={`${scale.charAt(0)}_extremely_severe`} defaultValue={c.thresholds?.[scale]?.extremely_severe} required />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weights Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Formula Weights</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label className="text-xs">PHQ-9</Label>
              <Input type="number" step="0.01" name="w_phq9" defaultValue={c.weights?.phq9} required />
            </div>
            <div>
              <Label className="text-xs">GAD-7</Label>
              <Input type="number" step="0.01" name="w_gad7" defaultValue={c.weights?.gad7} required />
            </div>
            <div>
              <Label className="text-xs">DASS (D)</Label>
              <Input type="number" step="0.01" name="w_dass_depression" defaultValue={c.weights?.dass_depression} required />
            </div>
            <div>
              <Label className="text-xs">DASS (A)</Label>
              <Input type="number" step="0.01" name="w_dass_anxiety" defaultValue={c.weights?.dass_anxiety} required />
            </div>
            <div>
              <Label className="text-xs">DASS (S)</Label>
              <Input type="number" step="0.01" name="w_dass_stress" defaultValue={c.weights?.dass_stress} required />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Total harus mendekati 1.0 (100%). Digunakan untuk menghitung persentase Mental Battery.</p>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
      </form>
    </div>
  );
}
