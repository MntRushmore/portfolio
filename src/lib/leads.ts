/**
 * The free-website form (/free): its fields and the rules they're checked
 * against. Shared by the form, which checks before sending so mistakes show
 * instantly, and the server action, which checks again before saving.
 */

export const LEAD_LIMITS = {
  name: 100,
  business: 150,
  phone: 40,
  email: 254,
  location: 200,
  website: 300,
  notes: 2000,
} as const;

export type LeadField = keyof typeof LEAD_LIMITS;
export type LeadValues = Record<LeadField, string>;
/** "contact" is the phone-or-email rule, which belongs to both fields. */
export type LeadErrors = Partial<Record<LeadField | "contact", string>>;

export type LeadState = {
  status: "idle" | "invalid" | "failed" | "sent";
  message?: string;
  errors?: LeadErrors;
  values?: Partial<LeadValues>;
};

const FIELDS = Object.keys(LEAD_LIMITS) as LeadField[];

export function readLead(formData: FormData): LeadValues {
  return Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()]),
  ) as LeadValues;
}

export function validateLead(values: LeadValues): LeadErrors {
  const errors: LeadErrors = {};

  if (!values.name) errors.name = "Add your name.";
  if (!values.business) errors.business = "Add the name of the business.";

  if (!values.phone && !values.email) {
    errors.contact = "Add a phone number or an email so I can reach you.";
  }
  const digits = values.phone.replace(/\D/g, "").length;
  if (values.phone && (digits < 7 || digits > 15)) {
    errors.phone = "That number looks off. Include the area code.";
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "That email doesn’t look right.";
  }

  for (const field of FIELDS) {
    if (!errors[field] && values[field].length > LEAD_LIMITS[field]) {
      errors[field] = `Keep this under ${LEAD_LIMITS[field]} characters.`;
    }
  }

  return errors;
}
