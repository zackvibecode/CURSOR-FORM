import type { DbForm, DbSubmission } from "@/lib/database.types";
import type { SubmissionRow } from "@/components/dashboard/SubmissionsTable";

// Map form_fields to look up human-readable labels by field ID
function buildFieldMap(fields: { id: string; label: string; type: string }[]) {
  return fields.reduce<Map<string, { label: string; type: string }>>((map, f) => {
    map.set(f.id, { label: f.label, type: f.type });
    return map;
  }, new Map());
}

// Extract a value by matching field label keywords
function extractByLabel(
  data: Record<string, unknown>,
  fieldMap: Map<string, { label: string; type: string }>,
  keywords: string[]
): string {
  const entries = Array.from(fieldMap.entries());
  for (const [fieldId, { label }] of entries) {
    const matches = keywords.some((kw) => label.toLowerCase().includes(kw.toLowerCase()));
    if (matches && fieldId in data) {
      const val = data[fieldId];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return "—";
}

// Extract every field answer (by label, in field order) for a submission.
// Skips display-only fields (title/image). Used to render dynamic columns.
function extractAllAnswers(
  data: Record<string, unknown>,
  fieldMap: Map<string, { label: string; type: string }>
): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = [];
  for (const [fieldId, { label, type }] of Array.from(fieldMap.entries())) {
    if (type === "title" || type === "image" || type === "youtube") continue;
    const raw = data[fieldId];
    let value = "";
    if (typeof raw === "string") value = raw;
    else if (Array.isArray(raw)) value = raw.join(", ");
    else if (raw != null) value = String(raw);
    result.push({ label, value: value.trim() });
  }
  return result;
}

interface FieldRow {
  id: string;
  label: string;
  type: string;
  form_id: string;
}

export function mapSubmissionsToRows(
  submissions: (DbSubmission & { forms?: Pick<DbForm, "title"> | null })[],
  forms: Pick<DbForm, "id" | "title">[],
  fields: FieldRow[] = []
): SubmissionRow[] {
  const formMap = new Map(forms.map((f) => [f.id, f.title]));
  const formFields = new Map<string, Map<string, { label: string; type: string }>>();

  // Group fields by form_id
  for (const f of fields) {
    if (!formFields.has(f.form_id)) formFields.set(f.form_id, new Map());
    formFields.get(f.form_id)!.set(f.id, { label: f.label, type: f.type });
  }

  return submissions.map((sub) => {
    const data = (sub.data ?? {}) as Record<string, unknown>;
    const fieldMap = formFields.get(sub.form_id);

    let name: string;
    let phone: string;

    if (fieldMap) {
      name = extractByLabel(data, fieldMap, ["name", "full"]);
      phone = extractByLabel(data, fieldMap, ["phone", "mobile", "tel", "no"]);
    } else {
      name = "—";
      phone = "—";
    }

    const answers = fieldMap ? extractAllAnswers(data, fieldMap) : [];

    // Determine the assigned team member display label (NAME only)
    const assignedName = sub.assigned_name?.trim() || null;
    const assignedPhone = sub.assigned_phone?.trim() || null;
    let assignedTo = "—";
    if (assignedName) {
      assignedTo = assignedName;
    } else if (assignedPhone) {
      // Fallback to phone only if no name was saved for this member
      assignedTo = assignedPhone;
    }

    return {
      id: sub.id,
      name,
      phone,
      answers,
      formName: sub.forms?.title ?? formMap.get(sub.form_id) ?? "Unknown Form",
      status: "new" as const,
      date: sub.submitted_at,
      assignedTo,
      assignedName,
      assignedPhone,
    };
  });
}

export function computeDashboardStats(
  forms: Pick<DbForm, "id">[],
  submissions: Pick<DbSubmission, "id">[]
) {
  const totalForms = forms.length;
  const totalSubmissions = submissions.length;

  return {
    totalForms,
    totalSubmissions,
  };
}

export function extractCustomers(submissions: SubmissionRow[]) {
  const seen = new Map<string, SubmissionRow>();

  submissions.forEach((sub) => {
    const key = sub.phone !== "—" ? sub.phone : sub.name;
    if (!seen.has(key)) seen.set(key, sub);
  });

  return Array.from(seen.values());
}
