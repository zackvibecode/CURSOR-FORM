"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, Save, Globe, Settings, Users, Search, Puzzle,
  Copy, Check, ExternalLink, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { cn, slugify } from "@/lib/utils";
import { DirectLinkTeamSettings } from "./DirectLinkTeamSettings";
import { OgImageUploader } from "./OgImageUploader";
import type { DirectLink } from "@/lib/database.types";

interface DirectLinkFullEditorProps {
  directLink: DirectLink;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function getPublicUrl(slug: string) {
  return `${APP_URL}/d/${slug}`;
}

type Tab = "general" | "team" | "seo" | "integrations";

const settingsNav: { key: Tab; label: string; icon: typeof Settings }[] = [
  { key: "general",      label: "General",      icon: Settings },
  { key: "team",         label: "Team",         icon: Users },
  { key: "seo",          label: "SEO",          icon: Search },
  { key: "integrations", label: "Integrations", icon: Puzzle },
];

export function DirectLinkFullEditor({ directLink: initialData }: DirectLinkFullEditorProps) {
  const [tab, setTab]                       = useState<Tab>("general");
  const [name, setName]                     = useState(initialData.name);
  const [slug, setSlug]                     = useState(initialData.slug);
  const [whatsappMessage, setWhatsappMessage] = useState(initialData.whatsapp_message ?? "");
  const [status, setStatus]                 = useState<"draft" | "published">(initialData.status);
  const [saving, setSaving]                 = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [copied, setCopied]                 = useState(false);

  // SEO fields
  const [seoTitle, setSeoTitle]           = useState(initialData.seo_title ?? "");
  const [seoDesc, setSeoDesc]             = useState(initialData.seo_description ?? "");
  const [seoOgTitle, setSeoOgTitle]       = useState(initialData.seo_og_title ?? "");
  const [seoOgDesc, setSeoOgDesc]         = useState(initialData.seo_og_description ?? "");
  const [seoOgImage, setSeoOgImage]       = useState(initialData.seo_og_image ?? "");
  const [seoIndexing, setSeoIndexing]     = useState<"index" | "noindex">(initialData.seo_indexing ?? "index");
  const [canonicalUrl, setCanonicalUrl]   = useState(initialData.canonical_url ?? "");

  const publicUrl = getPublicUrl(slug);

  // Auto-generate slug from name (only while user hasn't manually edited slug)
  const [slugManual, setSlugManual] = useState(false);
  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) {
      setSlug(slugify(v) || "direct-link");
    }
  };

  const handleSlugChange = (v: string) => {
    setSlug(slugify(v) || slug);
    setSlugManual(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = publicUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildPayload = (publish: boolean) => ({
    name,
    slug,
    whatsapp_message: whatsappMessage,
    status: publish ? "published" : status,
    seo_title:       seoTitle || null,
    seo_description: seoDesc || null,
    seo_og_title:    seoOgTitle || null,
    seo_og_description: seoOgDesc || null,
    seo_og_image:    seoOgImage || null,
    seo_indexing:    seoIndexing,
    canonical_url:   canonicalUrl || null,
  });

  const handleSave = useCallback(async (publish = false) => {
    if (!name.trim()) {
      toast("Link name is required", "error");
      setTab("general");
      return;
    }
    if (!slug.trim()) {
      toast("URL slug is required", "error");
      setTab("general");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/direct-links/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(publish)),
      });
      const data = await res.json() as { error?: string; direct_link?: { status: "draft" | "published"; slug: string } };
      if (!res.ok) {
        toast(data.error ?? "Failed to save", "error");
        return;
      }
      if (data.direct_link) {
        setStatus(data.direct_link.status);
        setSlug(data.direct_link.slug);
        setSlugManual(true);
      }
      toast(publish ? "Direct Link published!" : "Saved successfully", "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }, [name, slug, whatsappMessage, seoTitle, seoDesc, seoOgTitle, seoOgDesc, seoOgImage, seoIndexing, canonicalUrl, status, initialData.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestPublish = () => {
    if (!name.trim() || !slug.trim()) {
      toast("Fill in the link name and slug before publishing", "error");
      setTab("general");
      return;
    }
    setConfirmPublish(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-bg">
      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/direct-links"
            className="flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Direct Links</span>
          </Link>
          <span className="hidden text-border sm:inline">/</span>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-32 border-0 bg-transparent px-0 text-sm font-semibold focus:ring-0 sm:w-auto sm:max-w-xs sm:text-base"
            placeholder="Direct Link Name"
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
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-fg transition-colors hover:bg-muted hover:text-fg sm:flex"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </a>
          <Button variant="outline" size="sm" onClick={() => void handleSave(false)} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            showWhatsAppIcon
            onClick={requestPublish}
            disabled={saving}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
        </div>
      </header>

      {/* ── Settings layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
        {/* Sidebar nav */}
        <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:w-56 lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3">
          {settingsNav.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
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

        {/* Content */}
        <div className="flex-1 overflow-auto bg-bg p-6 scrollbar-thin">
          <div className="mx-auto max-w-2xl">

            {/* ── GENERAL ───────────────────────────────────────────────────── */}
            {tab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-fg">General</h3>
                  <p className="mt-0.5 text-xs text-muted-fg">Configure your Direct Link settings.</p>
                </div>

                {/* Basic info */}
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <div>
                    <Label>Link Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="PAKEJ TERBAIK"
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">Displayed publicly on the redirect page.</p>
                  </div>

                  <div>
                    <Label>URL Slug *</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="shrink-0 font-mono text-xs text-muted-fg">/d/</span>
                      <Input
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="pakej-terbaik"
                        className="font-mono"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-fg">
                      Public URL:{" "}
                      <span className="font-mono text-fg">{publicUrl}</span>
                    </p>
                  </div>

                  {/* Copy link */}
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-fg">Public link</Label>
                    <div className="mt-2 flex gap-2">
                      <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted px-3 py-2">
                        <p className="truncate font-mono text-xs text-fg">{publicUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopyLink()}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                          copied
                            ? "bg-whatsapp text-white"
                            : "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
                        )}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp message */}
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <div>
                    <Label>Default WhatsApp Message</Label>
                    <Textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Hi, saya berminat nak tahu lebih lanjut tentang pakej ini."
                      rows={5}
                      className="mt-1.5 resize-none"
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">
                      This message is pre-filled in WhatsApp when the visitor opens the chat.
                      Supports Malay characters, symbols, and line breaks.
                    </p>
                  </div>

                  {/* WhatsApp preview */}
                  {whatsappMessage.trim() && (
                    <div className="overflow-hidden rounded-md border border-border bg-[#E5DDD5]">
                      <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">WA</div>
                        <div>
                          <p className="text-xs font-semibold text-white">WhatsApp preview</p>
                          <p className="text-[10px] text-white/70">Pre-filled message</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="ml-auto max-w-[85%] rounded-md rounded-tr-none bg-[#DCF8C6] px-2.5 py-1.5 shadow-sm">
                          <p className="whitespace-pre-wrap text-xs text-gray-800">{whatsappMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => void handleSave(false)} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── TEAM ──────────────────────────────────────────────────────── */}
            {tab === "team" && (
              <DirectLinkTeamSettings directLinkId={initialData.id} />
            )}

            {/* ── SEO ───────────────────────────────────────────────────────── */}
            {tab === "seo" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-fg">SEO Settings</h3>
                  <p className="mt-0.5 text-xs text-muted-fg">
                    Control how your Direct Link appears in search engines and social media previews.
                    All metadata is rendered server-side so crawlers read it correctly.
                  </p>
                </div>

                {/* Basic SEO */}
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Search Engine</h4>
                  <div>
                    <Label>SEO Title</Label>
                    <Input
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={name || "Direct Link title"}
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">Shown in browser tab and search results. Leave blank to use Link Name.</p>
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={seoDesc}
                      onChange={(e) => setSeoDesc(e.target.value)}
                      placeholder="Chat with us on WhatsApp…"
                      rows={3}
                      className="mt-1.5 resize-none"
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">Shown in search result snippets (150–160 characters recommended).</p>
                  </div>
                  <div>
                    <Label>Canonical URL</Label>
                    <Input
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder={publicUrl}
                      className="mt-1.5 font-mono text-sm"
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">Leave blank to use the default public URL.</p>
                  </div>
                  <div>
                    <Label>Indexing</Label>
                    <div className="mt-1.5 flex gap-2">
                      {(["index", "noindex"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSeoIndexing(v)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                            seoIndexing === v
                              ? "border-fg bg-fg text-bg"
                              : "border-border text-muted-fg hover:border-fg/30 hover:text-fg"
                          )}
                        >
                          {v === "index" ? "Index (default)" : "No Index"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Open Graph */}
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Open Graph (Social Preview)</h4>
                  <p className="text-[11px] text-muted-fg">
                    Used by Facebook, WhatsApp, Twitter, LinkedIn when your link is shared.
                    OG metadata is rendered server-side — bots read it WITHOUT triggering WhatsApp redirect.
                  </p>
                  <div>
                    <Label>OG Title</Label>
                    <Input
                      value={seoOgTitle}
                      onChange={(e) => setSeoOgTitle(e.target.value)}
                      placeholder={seoTitle || name}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>OG Description</Label>
                    <Textarea
                      value={seoOgDesc}
                      onChange={(e) => setSeoOgDesc(e.target.value)}
                      placeholder={seoDesc || "Chat with us on WhatsApp."}
                      rows={3}
                      className="mt-1.5 resize-none"
                    />
                  </div>
                  <div>
                    <Label>OG Image (WhatsApp preview)</Label>
                    <p className="mb-2 mt-1 text-[11px] text-muted-fg">
                      This image shows above your link when shared on WhatsApp / Facebook.
                      Use <strong>1000×1000 px</strong> (square). Upload is saved automatically.
                    </p>
                    <OgImageUploader
                      value={seoOgImage}
                      onChange={async (url) => {
                        setSeoOgImage(url);
                        // Persist immediately so WhatsApp crawlers can scrape it
                        try {
                          await fetch(`/api/direct-links/${initialData.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ seo_og_image: url || null }),
                          });
                        } catch {
                          // Ignore — user can still hit Save SEO settings
                        }
                      }}
                      directLinkId={initialData.id}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => void handleSave(false)} disabled={saving}>
                    {saving ? "Saving…" : "Save SEO settings"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── INTEGRATIONS ──────────────────────────────────────────────── */}
            {tab === "integrations" && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Puzzle className="mb-3 h-8 w-8 text-muted-fg/40" />
                <p className="text-sm font-medium text-fg">Integrations</p>
                <p className="mt-1 text-sm text-muted-fg">Coming soon — n8n, Zapier, webhooks, and more.</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Publish confirmation modal ────────────────────────────────────── */}
      {confirmPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmPublish(false)}
        >
          <div
            className="mx-4 max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-fg">Publish Direct Link?</h3>
            </div>
            <p className="mb-5 text-sm text-muted-fg">
              This will make your Direct Link publicly accessible. Anyone with the link will be
              redirected straight to WhatsApp — no form to fill.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmPublish(false)}>
                Cancel
              </Button>
              <Button
                variant="whatsapp"
                className="flex-1"
                showWhatsAppIcon
                onClick={() => {
                  setConfirmPublish(false);
                  void handleSave(true);
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
