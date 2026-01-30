export function maskCardNumber(cardLast4: string): string {
  return `•••• •••• •••• ${cardLast4}`;
}
 
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.startsWith('****')) {
    return accountNumber;
  }
  return `****${accountNumber.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : '*'.repeat(local.length);
  
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `***-***-${digits.slice(-4)}`;
}

export function maskName(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return `${name[0]}${'*'.repeat(name.length - 1)}`;
  }
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  return `${firstName[0]}${'*'.repeat(firstName.length - 1)} ${lastName}`;
}

export function maskAmount(amount: number): string {
  const amountStr = amount.toFixed(2);
  const [whole, decimal] = amountStr.split('.');
  return `${'*'.repeat(whole.length)}.${decimal}`;
}

export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

