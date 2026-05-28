"use client";

import { useState, useCallback } from "react";
import type { FormField, FieldType } from "@/lib/form-schema";
import { createDefaultField } from "@/lib/form-schema";
import { FieldPalette } from "./FieldPalette";
import { FormCanvas } from "./FormCanvas";
import { FieldEditor } from "./FieldEditor";
import { PreviewModal } from "./PreviewModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { getFormPublicUrl } from "@/lib/forms";
import { slugify } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Eye,
  Save,
  Globe,
  Copy,
  Check,
  Settings,
  Layout,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface FormBuilderProps {
  formId: string;
  initialData: {
    title: string;
    slug: string;
    whatsapp_number: string;
    cta_text: string;
    description: string;
    status: "draft" | "published";
    fields: FormField[];
  };
}

export function FormBuilder({ formId, initialData }: FormBuilderProps) {
  const [tab, setTab] = useState<"build" | "settings">("build");
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug);
  const [whatsappNumber, setWhatsappNumber] = useState(initialData.whatsapp_number);
  const [ctaText, setCtaText] = useState(initialData.cta_text);
  const [description, setDescription] = useState(initialData.description);
  const [status, setStatus] = useState(initialData.status);
  const [fields, setFields] = useState<FormField[]>(initialData.fields);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialData.fields[0]?.id ?? null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    "Hi, I would like to submit my details:\nName:\nPhone:\nEmail:\nService:\nQuantity:\nPreferred Date:\nMessage:"
  );
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "publish" | null>(null);

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  const handleAddField = (type: FieldType) => {
    const field = createDefaultField(type, fields.length);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  };

  const handleUpdateField = (updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleSave = useCallback(
    async (publish = false) => {
      setSaving(true);
      setMessage("");

      try {
        const res = await fetch(`/api/forms/${formId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slugify(slug) || slug,
            whatsapp_number: whatsappNumber,
            cta_text: ctaText,
            description,
            status: publish ? "published" : status,
            fields,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.error ?? "Failed to save");
          toast(data.error ?? "Failed to save", "error");
          setSaving(false);
          return;
        }

        if (publish) setStatus("published");
        toast(publish ? "Form published!" : "Saved successfully", "success");
        setSaving(false);
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setMessage("Network error. Please check your connection and try again.");
        toast("Network error. Please try again.", "error");
        setSaving(false);
      }
    },
    [formId, title, slug, whatsappNumber, ctaText, description, status, fields]
  );

  const requestSave = (publish: boolean) => {
    if (!publish) {
      handleSave(false);
      return;
    }
    // Publish requires confirmation if no fields
    if (fields.length === 0) {
      toast("Add at least one field before publishing", "error");
      return;
    }
    setConfirmAction("publish");
    setConfirmModal(true);
  };

  const handleCopyLink = async () => {
    const url = getFormPublicUrl(slug);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-brand-bg">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-border bg-white px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/forms"
            className="flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-whatsapp-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Forms</span>
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-xs border-0 bg-transparent text-lg font-bold focus:ring-0"
          />
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === "published"
                ? "bg-whatsapp/10 text-whatsapp-deep"
                : "bg-gray-100 text-brand-muted"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {message && (
            <span className="text-sm text-whatsapp-deep">{message}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestSave(false)}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="whatsapp" size="sm" showWhatsAppIcon onClick={() => requestSave(true)} disabled={saving}>
            <Globe className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </header>

      <div className="flex border-b border-brand-border bg-white px-4">
        <button
          onClick={() => setTab("build")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            tab === "build"
              ? "border-whatsapp text-whatsapp-deep"
              : "border-transparent text-brand-muted hover:text-brand-text"
          }`}
        >
          <Layout className="h-4 w-4" />
          Build
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            tab === "settings"
              ? "border-whatsapp text-whatsapp-deep"
              : "border-transparent text-brand-muted hover:text-brand-text"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {tab === "build" ? (
        <div className="flex flex-1 overflow-hidden">
          <FieldPalette onAddField={handleAddField} />
          <FormCanvas
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={setFields}
            onDelete={(id) => {
              setFields((prev) => prev.filter((f) => f.id !== id));
              if (selectedId === id) setSelectedId(null);
            }}
            formTitle={title}
            formDescription={description}
          />
          <FieldEditor
            field={selectedField}
            onUpdate={handleUpdateField}
            whatsappTemplate={whatsappTemplate}
            onWhatsappTemplateChange={setWhatsappTemplate}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-lg space-y-6">
            <div>
              <Label>WhatsApp Number *</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+60123456789"
              />
              <p className="mt-1 text-xs text-brand-muted">
                Include country code. Leads will be sent to this number.
              </p>
            </div>

            <div>
              <Label>Default WhatsApp Message Template</Label>
              <Textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="min-h-[140px] font-mono text-sm"
              />
            </div>

            <div>
              <Label>Form URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/f/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="my-contact-form"
                />
              </div>
            </div>

            <div>
              <Label>CTA Button Text</Label>
              <Input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Submit on WhatsApp"
              />
            </div>

            <div>
              <Label>Form Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description shown on the public form"
              />
            </div>

            {status === "published" && (
              <div className="rounded-xl border border-whatsapp/20 bg-whatsapp/5 p-4">
                <Label>Share Link</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    readOnly
                    value={getFormPublicUrl(slug)}
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? (
                      <Check className="h-4 w-4 text-whatsapp" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        ctaText={ctaText}
        whatsappNumber={whatsappNumber}
        fields={fields}
        formId={formId}
      />

      {/* Publish Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(false)}>
          <div
            className="mx-4 max-w-sm rounded-2xl border border-brand-border bg-white p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">Publish Form?</h3>
            </div>
            <p className="mb-6 text-sm text-brand-muted">
              This will make your form publicly accessible. Anyone with the link can view and submit to this form.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmModal(false)}>
                Cancel
              </Button>
              <Button
                variant="whatsapp"
                className="flex-1"
                showWhatsAppIcon
                onClick={() => {
                  setConfirmModal(false);
                  handleSave(true);
                }}
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
