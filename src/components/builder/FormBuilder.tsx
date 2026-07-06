"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { FormField, FieldType } from "@/lib/form-schema";
import { createDefaultField } from "@/lib/form-schema";
import { syncTemplateWithFields } from "@/lib/template-sync";
import {
  fieldsStructureKey,
  getInitialWhatsappTemplate,
  getWhatsappTemplateFromForm,
} from "@/lib/form-settings";
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
import { cn } from "@/lib/utils";

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
    whatsappTemplate?: string;
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
  const [whatsappTemplate, setWhatsappTemplate] = useState(() =>
    getInitialWhatsappTemplate(initialData.whatsappTemplate, initialData.fields)
  );
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "publish" | null>(null);
  const [mobileDrawer, setMobileDrawer] = useState<"add" | "edit" | null>(null);
  const lastSyncedFieldsKey = useRef(fieldsStructureKey(initialData.fields));

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  // Sync template only when fields are added, removed, or renamed — not on first load.
  useEffect(() => {
    const nextKey = fieldsStructureKey(fields);
    if (nextKey === lastSyncedFieldsKey.current) return;
    lastSyncedFieldsKey.current = nextKey;
    setWhatsappTemplate((prev) => syncTemplateWithFields(prev, fields));
  }, [fields]);

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
            settings: { whatsapp_template: whatsappTemplate },
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

        const savedTemplate = getWhatsappTemplateFromForm(data.form ?? {});
        if (savedTemplate) {
          setWhatsappTemplate(savedTemplate);
        }

        toast(publish ? "Form published!" : "Saved successfully", "success");
        setSaving(false);
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setMessage("Network error. Please check your connection and try again.");
        toast("Network error. Please try again.", "error");
        setSaving(false);
      }
    },
    [formId, title, slug, whatsappNumber, ctaText, description, status, fields, whatsappTemplate]
  );

  const requestSave = (publish: boolean) => {
    if (!publish) {
      handleSave(false);
      return;
    }
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

  const tabs = [
    { key: "build" as const, label: "Build", icon: Layout },
    { key: "general" as const, label: "Settings", icon: Settings },
  ];

  const settingsNav = [
    { key: "general" as const, label: "General", icon: Settings },
    { key: "team" as const, label: "Team", icon: Users },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
    { key: "seo" as const, label: "SEO", icon: Search },
    { key: "integrations" as const, label: "Integrations", icon: Puzzle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-bg">
      {/* Top toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/forms"
            className="flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Forms</span>
          </Link>
          <span className="hidden text-border sm:inline">/</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-32 border-0 bg-transparent px-0 text-sm font-semibold focus:ring-0 sm:max-w-xs sm:w-auto sm:text-base"
          />
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium capitalize sm:inline-flex",
              status === "published"
                ? "text-whatsapp-deep dark:text-whatsapp"
                : "text-muted-fg"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "published" ? "bg-whatsapp" : "bg-gray-400"
              )}
            />
            {status}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {message && (
            <span className="hidden text-xs text-whatsapp-deep dark:text-whatsapp md:inline">
              {message}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestSave(false)}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="whatsapp" size="sm" showWhatsAppIcon onClick={() => requestSave(true)} disabled={saving}>
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-border bg-card px-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-whatsapp text-fg"
                : "border-transparent text-muted-fg hover:text-fg"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "build" ? (
        <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="hidden lg:flex">
            <FieldPalette onAddField={handleAddField} />
          </div>

          <FormCanvas
            fields={fields}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
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

          <div className="hidden lg:flex">
            <FieldEditor
              field={selectedField}
              fields={fields}
              onUpdate={handleUpdateField}
              whatsappTemplate={whatsappTemplate}
              onWhatsappTemplateChange={setWhatsappTemplate}
            />
          </div>

          {/* Mobile floating "Add Field" button */}
          <button
            onClick={() => setMobileDrawer("add")}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-fg px-4 py-3 text-sm font-medium text-bg shadow-md transition-transform active:scale-95 lg:hidden"
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>

          {mobileDrawer && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileDrawer(null)}
                aria-hidden="true"
              />
              <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg">
                {mobileDrawer === "add" ? (
                  <>
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                        Add a field
                      </span>
                      <button
                        onClick={() => setMobileDrawer(null)}
                        className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-thin">
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
                    fields={fields}
                    onUpdate={handleUpdateField}
                    whatsappTemplate={whatsappTemplate}
                    onWhatsappTemplateChange={setWhatsappTemplate}
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
          <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:w-56 lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3">
            {settingsNav.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={cn(
                  "flex w-auto shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors lg:w-full",
                  tab === item.key
                    ? "bg-muted text-fg"
                    : "text-muted-fg hover:bg-muted/60 hover:text-fg"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-auto bg-bg p-6 scrollbar-thin">
            <div className="mx-auto max-w-2xl">
              {tab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">General</h3>
                    <p className="mt-0.5 text-xs text-muted-fg">Configure your form&apos;s basic settings.</p>
                  </div>
                  <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                    <div>
                      <Label>WhatsApp number *</Label>
                      <Input
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+60123456789"
                        className="font-mono"
                      />
                      <p className="mt-1 text-[11px] text-muted-fg">Include country code. Leads will be sent to this number.</p>
                    </div>
                    <div>
                      <Label>Form URL slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-fg">/</span>
                        <Input
                          value={slug}
                          onChange={(e) => setSlug(slugify(e.target.value))}
                          placeholder="my-contact-form"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>CTA button text</Label>
                      <Input
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="Submit on WhatsApp"
                      />
                    </div>
                    <div>
                      <Label>Form description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description shown on the public form"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleSave(false)}>
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {tab === "team" && <TeamSettings formId={formId} />}

              {tab === "notifications" && (
                <div className="mx-auto max-w-xl space-y-4 py-8">
                  <div className="rounded-lg border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-fg">Submission alerts</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-fg">
                      Notification channels (n8n + WhatsApp, Email Resend, Dashboard realtime, Telegram)
                      diurus dalam <strong>Dashboard → Settings → Notifications</strong>.
                    </p>
                    <Link
                      href="/dashboard/settings"
                      className="mt-4 inline-flex text-sm font-medium text-whatsapp-deep hover:underline dark:text-whatsapp"
                    >
                      Open notification settings →
                    </Link>
                  </div>
                </div>
              )}

              {tab === "seo" && (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-muted-fg">Coming soon</p>
                </div>
              )}

              {tab === "integrations" && (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-muted-fg">Coming soon</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal(false)}>
          <div
            className="mx-4 max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-fg">Publish form?</h3>
            </div>
            <p className="mb-5 text-sm text-muted-fg">
              This will make your form publicly accessible. Anyone with the link can view and submit to this form.
            </p>
            <div className="flex gap-2">
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
