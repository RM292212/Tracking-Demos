/**
 * ResponseLock Client-Side Form Validation Module
 * Location: demo/src/lib/validation.ts
 *
 * Implements client-side validation mirroring server Zod validation rules
 * defined in LeadSubmissionPayloadSchema.
 */

import {
  LeadSubmissionPayloadSchema,
  type LeadSubmissionPayloadInput,
} from '@/lib/contracts/schema';

export type ValidationErrors = Record<string, string>;

export interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationErrors;
  data?: T;
}

/**
 * Client form values schema covering interactive form inputs.
 */
export interface LeadFormValues {
  full_name: string;
  work_email: string;
  company_name: string;
  monthly_ad_spend?: string;
  primary_challenge?: string;
  phone?: string;
  notes?: string;
  website?: string;
  fax?: string;
  honeypot?: string;
}

/**
 * Validates the complete lead submission payload against LeadSubmissionPayloadSchema.
 */
export function validateLeadSubmissionPayload(
  payload: unknown
): ValidationResult<LeadSubmissionPayloadInput> {
  const result = LeadSubmissionPayloadSchema.safeParse(payload);

  if (result.success) {
    // Check honeypot presence
    const data = result.data;
    if (
      (data.website && data.website.length > 0) ||
      (data.fax && data.fax.length > 0) ||
      (data.honeypot && data.honeypot.length > 0)
    ) {
      return {
        isValid: false,
        errors: { form: 'Submission rejected by honeypot verification' },
      };
    }

    return {
      isValid: true,
      errors: {},
      data: result.data,
    };
  }

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString() || 'form';
    // Keep first error message per field
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return {
    isValid: false,
    errors,
  };
}

/**
 * Validates interactive form field values before assigning system identifiers.
 */
export function validateLeadFormFields(
  values: Record<string, unknown>
): ValidationResult<LeadFormValues> {
  // Honeypot check
  if (
    (typeof values['website'] === 'string' && values['website'].trim() !== '') ||
    (typeof values['fax'] === 'string' && values['fax'].trim() !== '') ||
    (typeof values['honeypot'] === 'string' && values['honeypot'].trim() !== '')
  ) {
    return {
      isValid: false,
      errors: { form: 'Submission rejected by honeypot verification' },
    };
  }

  const errors: ValidationErrors = {};

  // full_name validation
  const rawFullName = values['full_name'];
  if (typeof rawFullName !== 'string' || rawFullName.trim() === '') {
    errors['full_name'] = 'Full name is required';
  } else if (rawFullName.trim().length < 2) {
    errors['full_name'] = 'Full name must be at least 2 characters';
  } else if (rawFullName.trim().length > 100) {
    errors['full_name'] = 'Full name must not exceed 100 characters';
  }

  // work_email validation
  const rawEmail = values['work_email'];
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (typeof rawEmail !== 'string' || rawEmail.trim() === '') {
    errors['work_email'] = 'Work email is required';
  } else if (!emailRegex.test(rawEmail.trim())) {
    errors['work_email'] = 'A valid email address is required';
  } else if (rawEmail.trim().length > 100) {
    errors['work_email'] = 'Work email must not exceed 100 characters';
  }

  // company_name validation
  const rawCompany = values['company_name'];
  if (typeof rawCompany !== 'string' || rawCompany.trim() === '') {
    errors['company_name'] = 'Company name is required';
  } else if (rawCompany.trim().length < 2) {
    errors['company_name'] = 'Company name is required';
  } else if (rawCompany.trim().length > 100) {
    errors['company_name'] = 'Company name must not exceed 100 characters';
  }

  // Optional phone validation
  const rawPhone = values['phone'];
  if (typeof rawPhone === 'string' && rawPhone.trim().length > 25) {
    errors['phone'] = 'Phone number must not exceed 25 characters';
  }

  // Optional notes validation
  const rawNotes = values['notes'];
  if (typeof rawNotes === 'string' && rawNotes.trim().length > 500) {
    errors['notes'] = 'Notes must not exceed 500 characters';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          full_name: typeof rawFullName === 'string' ? rawFullName.trim() : '',
          work_email: typeof rawEmail === 'string' ? rawEmail.trim() : '',
          company_name: typeof rawCompany === 'string' ? rawCompany.trim() : '',
          monthly_ad_spend:
            typeof values['monthly_ad_spend'] === 'string'
              ? values['monthly_ad_spend'].trim()
              : '',
          primary_challenge:
            typeof values['primary_challenge'] === 'string'
              ? values['primary_challenge'].trim()
              : '',
          phone: typeof rawPhone === 'string' ? rawPhone.trim() : undefined,
          notes: typeof rawNotes === 'string' ? rawNotes.trim() : undefined,
        }
      : undefined,
  };
}

/**
 * Validates a single named field. Returns error message or null if valid.
 */
export function validateField(name: string, value: unknown): string | null {
  const partial = { [name]: value };
  const res = validateLeadFormFields(partial);
  return res.errors[name] || null;
}
