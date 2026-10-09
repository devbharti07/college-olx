/**
 * Institutional College Email Domain Configuration
 * Supports standard Indian and international collegiate domains (.ac.in, .edu.in, .edu)
 * along with explicit institution overrides and blocked public email providers.
 */

// Suffixes officially allocated for higher education institutions
export const APPROVED_INSTITUTIONAL_SUFFIXES = [
  '.edu',
  '.edu.in',
  '.ac.in',
];

// Optional whitelist of explicit approved institutional domains
export const APPROVED_EXPLICIT_DOMAINS = [
  'iitb.ac.in',
  'iitd.ac.in',
  'iitm.ac.in',
  'iitk.ac.in',
  'iitkgp.ac.in',
  'iitr.ac.in',
  'iitg.ac.in',
  'bits-pilani.ac.in',
  'du.ac.in',
  'jnu.ac.in',
  'bhu.ac.in',
  'nitk.ac.in',
  'nitt.edu',
  'iiit.ac.in',
];

// Disallowed commercial and personal email providers
export const BLOCKED_PERSONAL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zoho.in',
  'aol.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
  'rediffmail.com',
  'tempmail.com',
  'mailinator.com',
];

/**
 * Validates whether an email address belongs to a verified institutional collegiate domain.
 * @param {string} email - Email address to check
 * @returns {{ isInstitutional: boolean, domain: string, reason?: string }}
 */
export const validateInstitutionalDomain = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { isInstitutional: false, domain: '', reason: 'Invalid email syntax.' };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isInstitutional: false, domain: '', reason: 'Invalid email format.' };
  }

  const domain = parts[1].trim();

  // Validate basic domain syntax (no spaces, valid characters, at least one dot)
  const domainSyntaxRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!domainSyntaxRegex.test(domain)) {
    return { isInstitutional: false, domain, reason: 'Malformed domain syntax.' };
  }

  // 1. Check if domain is a personal / consumer email provider
  if (BLOCKED_PERSONAL_PROVIDERS.includes(domain)) {
    return {
      isInstitutional: false,
      domain,
      reason: `Personal email provider (${domain}) cannot be used as an institutional college email.`,
    };
  }

  // 2. Check explicit approved domain list
  if (APPROVED_EXPLICIT_DOMAINS.includes(domain)) {
    return { isInstitutional: true, domain };
  }

  // 3. Check approved educational suffixes with proper boundary (.edu, .edu.in, .ac.in)
  for (const suffix of APPROVED_INSTITUTIONAL_SUFFIXES) {
    const cleanSuffix = suffix.startsWith('.') ? suffix : `.${suffix}`;
    // Match exact suffix or subdomain boundary (e.g. .ac.in -> college.ac.in, dept.college.ac.in)
    if (domain.endsWith(cleanSuffix)) {
      const prefix = domain.slice(0, -cleanSuffix.length);
      // Valid if prefix has at least 1 character and does not end with a dot
      if (prefix.length > 0 && !prefix.endsWith('.')) {
        return { isInstitutional: true, domain };
      }
    }
  }

  return {
    isInstitutional: false,
    domain,
    reason: `Domain (${domain}) does not match approved institutional collegiate suffixes (.edu, .edu.in, .ac.in).`,
  };
};

/**
 * Convenient boolean check for institutional collegiate emails.
 * @param {string} email
 * @returns {boolean}
 */
export const isInstitutionalEmail = (email) => {
  return validateInstitutionalDomain(email).isInstitutional;
};

export default {
  APPROVED_INSTITUTIONAL_SUFFIXES,
  APPROVED_EXPLICIT_DOMAINS,
  BLOCKED_PERSONAL_PROVIDERS,
  validateInstitutionalDomain,
  isInstitutionalEmail,
};
