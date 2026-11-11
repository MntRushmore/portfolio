"use server";

import { neon } from "@neondatabase/serverless";
import { readLead, validateLead, type LeadState } from "@/lib/leads";

/** Saves one free-website request to the `leads` table (see db/schema.sql). */
export async function submitLead(
  _previous: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const values = readLead(formData);

  // A field people never see; only bots fill it in. Tell them it worked.
  if (formData.get("homepage")) return { status: "sent" };

  const errors = validateLead(values);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors, values };
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      insert into leads (name, business, phone, email, location, website, notes)
      values (
        ${values.name},
        ${values.business},
        ${values.phone || null},
        ${values.email || null},
        ${values.location || null},
        ${values.website || null},
        ${values.notes || null}
      )
    `;
  } catch (error) {
    console.error("Couldn’t save a lead", error);
    return {
      status: "failed",
      message: "That didn’t save on my end. Give it another try in a moment.",
      values,
    };
  }

  return { status: "sent", values: { name: values.name } };
}
