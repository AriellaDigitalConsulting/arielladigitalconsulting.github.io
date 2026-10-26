export type NavItem = { label: string; href: string } | { label: string; children: { href: string; label: string }[] };

// The main navigation, shared by every page through SiteHeader. Contact is the header's "Book a call" button.
export const nav: NavItem[] = [
  { href: '/', label: 'Hello' },
  { href: '/news', label: 'News' },
  { href: '/products', label: 'Products' },
  {
    label: 'Services',
    children: [
      { href: '/implementations', label: 'Implementations' },
      { href: '/products', label: 'Integrations' },
      { href: '/services#sme-support', label: 'SME Support' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/design', label: 'UI/UX Design' },
    ],
  },
  { href: '/about', label: 'About' },
];

export const contactHref = '/contact';

export const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const contactEmail = 'hello@adc.dev';
export const adminEmail = 'info@arielladigitalconsulting.com';

export const social = [
  { href: `mailto:${contactEmail}`, label: contactEmail, icon: '/images/e58772d004b1.webp' },
  { href: 'https://www.linkedin.com/company/ariella-digital-consulting', label: 'Linkedin', icon: '/images/d3858e691cc6.webp' },
  { href: 'https://www.youtube.com/@adclibrary8418', label: 'youtube/adc', icon: '/images/5b3d0ed9eea4.webp' },
  { href: 'https://hive.lumapps.com/hive-customers/ls/space/4678356017152000/partner-adc/home', label: 'The Hive', icon: '/images/41f961bc3428.webp' },
];
