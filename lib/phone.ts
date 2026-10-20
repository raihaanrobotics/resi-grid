export function normalizeSouthAfricanPhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0027")) digits = digits.slice(4);
  else if (digits.startsWith("27")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (!/^\d{9}$/.test(digits)) return null;
  return `+27${digits}`;
}

export function toWhatsAppPhone(phone: string): string | null {
  return normalizeSouthAfricanPhone(phone)?.slice(1) ?? null;
}

export function openWhatsApp(phone: string, message: string): void {
  const internationalNumber = toWhatsAppPhone(phone);
  if (!internationalNumber) {
    window.alert("Enter a valid South African phone number to continue on WhatsApp.");
    return;
  }

  window.open(
    `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
