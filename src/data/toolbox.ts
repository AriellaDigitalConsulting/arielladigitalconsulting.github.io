// The admin toolbox widgets that have their own product page. Each page's "Explore More Toolbox Widgets
// by ADC" section lists the others, so they stay cross-linked with the same wording everywhere.
export type ToolboxWidget = { href: string; icon: string; title: string; text: string; badge?: string };

export const toolbox: ToolboxWidget[] = [
  { href: '/space-layout-mover', icon: 'home', title: 'Space Homepage Layout Copier.', text: 'Copy a polished Space homepage onto any other Space in a single click.' },
  { href: '/content-layout-mover', icon: 'grid', title: 'Content Page Layout Mover.', text: 'Redesign any page behind the scenes, then take it live in one click.' },
  { href: '/platform-style', icon: 'palette', title: 'Platform Style Manager.', badge: 'NEW', text: 'Copy and rename any platform style to launch new sites already on brand.' },
  { href: '/content-copier', icon: 'copy', title: 'Content Copier.', text: 'Replicate an entire content library between Custom Content Types in one operation.' },
];

const accents = ['#FFD458', '#32E0C4', '#8e88ff'];

/** The other toolbox widgets for the page at `current`, each with an icon accent color. */
export const relatedToolbox = (current: string) =>
  toolbox.filter((t) => t.href !== current).map((t, i) => ({ ...t, color: accents[i % accents.length] }));
