"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getFormPublicUrl } from "@/lib/forms";
import { formatDate } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/templates";
import { CreateFormButton } from "./DashboardHeader";
import {
  Edit,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  submissions?: { count: number }[];
}

interface FormListProps {
  forms: FormRow[];
}

export function FormList({ forms: initialForms }: FormListProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  useEffect(() => {
    async function refreshForms() {
      const res = await fetch("/api/forms");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.forms)) {
        setForms(data.forms);
      }
    }

    refreshForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;

    setDeletingId(id);
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      setForms((prev) => prev.filter((f) => f.id !== id));
      router.refresh();
    }
    setDeletingId(null);
  };

  const handleCopy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(getFormPublicUrl(slug));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTemplateCreate = async (templateId: string) => {
    setCreatingTemplateId(templateId);
    setError("");

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();

      if (!res.ok || !data.form) {
        setError(data.error ?? "Failed to create form from template.");
        return;
      }

      setTemplateOpen(false);
      router.push(`/dashboard/forms/${data.form.id}/edit`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-text">My Forms</h1>
          <p className="text-brand-muted">Create and manage your WhatsApp lead forms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplateOpen(true)}>
            From template
          </Button>
          <CreateFormButton onError={setError} />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-xl font-bold">No forms yet</h2>
          <p className="mb-6 text-brand-muted">
            Create your first WhatsApp form to start collecting leads
          </p>
          <CreateFormButton onError={setError} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const responseCount = form.submissions?.[0]?.count ?? 0;
            return (
              <Card key={form.id} className="flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{form.title}</h3>
                    <p className="text-xs text-gray-500">
                      Updated {formatDate(form.updated_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      form.status === "published"
                        ? "bg-whatsapp/10 text-whatsapp-dark"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                  {responseCount} submission{responseCount !== 1 ? "s" : ""}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={`/dashboard/forms/${form.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>

                  {form.status === "published" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(form.slug, form.id)}
                      >
                        {copiedId === form.id ? (
                          <Check className="h-3.5 w-3.5 text-whatsapp" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <a
                        href={getFormPublicUrl(form.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(form.id)}
                    disabled={deletingId === form.id}
                    className="text-brand-red hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="Choose a template">
        <div className="grid gap-4 sm:grid-cols-2">
          {FORM_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateCreate(template.id)}
              disabled={creatingTemplateId !== null}
              className="rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-whatsapp hover:shadow-md disabled:opacity-60"
            >
              <span className="mb-2 block text-2xl">{template.icon}</span>
              <h3 className="font-bold">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              {creatingTemplateId === template.id && (
                <span className="mt-2 inline-flex items-center gap-2 text-sm text-whatsapp">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
