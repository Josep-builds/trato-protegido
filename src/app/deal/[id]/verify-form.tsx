"use client";

import { useState, useTransition } from "react";
import { verifyBuyer } from "./actions";
import SimulatedBadge from "../../simulated-badge";

export default function VerifyForm({ dealId }: { dealId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(formData: FormData) {
    formData.set("deal_id", dealId);
    setResult(null);
    startTransition(async () => {
      const res = await verifyBuyer(formData);
      setResult(res);
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Identity verification</h3>
        <SimulatedBadge label="Identity check" />
      </div>
      <p className="text-xs text-zinc-500">
        Upload a photo of your ID and a selfie. This is checked automatically —
        it is not a real identity verification.
      </p>

      <form action={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="id_photo" className="block text-xs font-medium text-zinc-700">
            ID photo
          </label>
          <input
            id="id_photo"
            name="id_photo"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            required
            className="mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label htmlFor="selfie" className="block text-xs font-medium text-zinc-700">
            Selfie
          </label>
          <input
            id="selfie"
            name="selfie"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            required
            className="mt-1 w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Checking..." : "Submit for verification"}
        </button>
      </form>

      {result && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? "Passed: " : "Failed: "}
          {result.message}
        </p>
      )}
    </div>
  );
}
