import { z } from 'zod';

const categoryIds = ['botellas', 'vasos', 'oficina', 'bolsas', 'gorras', 'maletines', 'electronicos', 'eco', 'lapiceros', 'llaveros', 'herramientas', 'sublimacion', 'otros', 'material-cliente', 'otro-proyecto'] as const;
const productCodes = ['BO-2401', 'AO-2601', 'GO-1011', 'VA-2501', 'BP-2602', 'LO-2301', 'LA-2401', 'MU-1901', 'BO-2405', 'AO-2402', 'OT-2605', 'OT-2601'] as const;
const safeText = (max: number) => z.string().trim().max(max).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value));

export const quoteSchema = z.object({
  requestId: z.uuid(),
  name: safeText(120).pipe(z.string().min(2)),
  email: z.email().max(254),
  phone: safeText(30).default(''),
  company: safeText(120).default(''),
  category: z.enum(categoryIds),
  quantity: z.number().int().min(1).max(1_000_000),
  message: safeText(4000).pipe(z.string().min(10)),
  products: z.array(z.enum(productCodes)).max(12).refine(values => new Set(values).size === values.length).default([]),
  consent: z.literal(true),
  website: z.string().max(200).default(''),
}).strict();

export type Quote = z.infer<typeof quoteSchema>;
export function quoteRow(quote: Quote) {
  return { id: quote.requestId, name: quote.name, email: quote.email.toLowerCase(), phone: quote.phone || null, company: quote.company || null, category: quote.category, quantity: quote.quantity, message: quote.message, product_codes: quote.products, consent: quote.consent };
}
