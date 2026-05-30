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
import { TeamSettings } from "./TeamSettings";
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
  Bell,
  Search,
  Users,
  Puzzle,
  Plus,
  X,
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
  const [tab, setTab] = useState<"build" | "general" | "team" | "notifications" | "seo" | "integrations">("build");
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
  // Mobile-only: which drawer is open ("add" = field palette, "edit" = field settings)
  const [mobileDrawer, setMobileDrawer] = useState<"add" | "edit" | null>(null);

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
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard/forms"
            className="flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-whatsapp-deep"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Back to Forms</span>
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-32 border-0 bg-transparent text-base font-bold focus:ring-0 sm:max-w-xs sm:w-auto sm:text-lg"
          />
          <span
            className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${
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
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestSave(false)}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="whatsapp" size="sm" showWhatsAppIcon onClick={() => requestSave(true)} disabled={saving}>
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Publish</span>
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
          onClick={() => setTab("general")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            tab !== "build"
              ? "border-whatsapp text-whatsapp-deep"
              : "border-transparent text-brand-muted hover:text-brand-text"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {tab === "build" ? (
        <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Palette: inline column on desktop only */}
          <div className="hidden lg:flex">
            <FieldPalette onAddField={handleAddField} />
          </div>

          <FormCanvas
            fields={fields}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              // On mobile, tapping a field opens the edit drawer
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setMobileDrawer("edit");
              }
            }}
            onReorder={setFields}
            onDelete={(id) => {
              setFields((prev) => prev.filter((f) => f.id !== id));
              if (selectedId === id) setSelectedId(null);
            }}
            formTitle={title}
            formDescription={description}
          />

          {/* Editor: inline column on desktop only */}
          <div className="hidden lg:flex">
            <FieldEditor
              field={selectedField}
              onUpdate={handleUpdateField}
              whatsappTemplate={whatsappTemplate}
              onWhatsappTemplateChange={setWhatsappTemplate}
            />
          </div>

          {/* Mobile floating "Add Field" button */}
          <button
            onClick={() => setMobileDrawer("add")}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-whatsapp px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 lg:hidden"
          >
            <Plus className="h-5 w-5" />
            Add Field
          </button>

          {/* Mobile drawers */}
          {mobileDrawer && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileDrawer(null)}
                aria-hidden="true"
              />
              <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
                {mobileDrawer === "add" ? (
                  <>
                    <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                        Add a field
                      </span>
                      <button
                        onClick={() => setMobileDrawer(null)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-gray-100"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <FieldPalette
                        vertical
                        onAddField={(type) => {
                          handleAddField(type);
                          setMobileDrawer("edit");
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <FieldEditor
                    drawer
                    field={selectedField}
                    onUpdate={handleUpdateField}
                    onBack={() => setMobileDrawer(null)}
                    onDelete={
                      selectedField
                        ? () => {
                            setFields((prev) => prev.filter((f) => f.id !== selectedField.id));
                            setSelectedId(null);
                            setMobileDrawer(null);
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
          {/* Settings Sidebar — Tally-style */}
          <nav className="flex w-full shrink-0 gap-2 overflow-x-auto border-b border-brand-border bg-white p-3 lg:w-56 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            {[
              { key: "general", label: "General", icon: Settings },
              { key: "team", label: "Team", icon: Users },
              { key: "notifications", label: "Notifications", icon: Bell },
              { key: "seo", label: "SEO", icon: Search },
              { key: "integrations", label: "Integrations", icon: Puzzle },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`flex w-auto shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full lg:gap-3 ${
                  tab === item.key
                    ? "bg-whatsapp/10 text-whatsapp-deep"
                    : "text-brand-muted hover:bg-gray-50 hover:text-brand-text"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Settings Content */}
          <div className="flex-1 overflow-auto bg-brand-bg/50 p-6">
            <div className="mx-auto max-w-2xl">
              {tab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-text">General Settings</h3>
                    <p className="mt-1 text-sm text-brand-muted">Configure your form{"'"}s basic settings.</p>
                  </div>
                  <div>
                    <Label>WhatsApp Number *</Label>
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+60123456789"
                    />
                    <p className="mt-1 text-xs text-brand-muted">Include country code. Leads will be sent to this number.</p>
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
                  <div className="flex justify-end">
                    <Button variant="whatsapp" size="sm" onClick={() => handleSave(false)}>
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {tab === "team" && <TeamSettings formId={formId} />}

              {tab === "notifications" && (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-brand-muted">Coming soon</p>
                </div>
              )}

              {tab === "seo" && (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-brand-muted">Coming soon</p>
                </div>
              )}

              {tab === "integrations" && (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-brand-muted">Coming soon</p>
                </div>
              )}
            </div>
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
