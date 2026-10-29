// ADC extension library for the Products page, from the ADC Extensions Listing.
// c = categories, primary first; pop = Most Popular rank (1 shows first); href = the sheet's External URL (adc.dev links kept site-relative).
// Items with no URL render as non-link cards marked "Page coming soon...".

const DOCS = 'https://docs.adc.dev/docs/ls/content/';

export type CatId = 'eg' | 'tb' | 'cn' | 'cs' | 'se' | 'ti' | 'sf' | 'ut' | 'pd' | 'ac' | 'dt';

export interface Category {
  id: CatId;
  label: string;
  chip: string;
  ink: string;
}

export interface Extension {
  n: string;
  c: CatId[];
  d: string;
  href?: string;
  pop?: number;
}

export const categories: Category[] = [
  { id: 'eg', label: 'Engagement & Gamification', chip: '#FFD458', ink: '#05006C' },
  { id: 'tb', label: 'ADC Toolbox', chip: '#362DFF', ink: '#FFFFFF' },
  { id: 'cn', label: 'Content & Navigation', chip: '#32E0C4', ink: '#05006C' },
  { id: 'cs', label: 'Communities & Social', chip: '#8F89FF', ink: '#05006C' },
  { id: 'se', label: 'Search', chip: '#FFFFFF', ink: '#05006C' },
  { id: 'ti', label: '3rd Party Integrations', chip: '#32E0C4', ink: '#05006C' },
  { id: 'sf', label: 'Seasonal & Fun', chip: '#FFD458', ink: '#05006C' },
  { id: 'ut', label: 'Utilities', chip: '#8F89FF', ink: '#05006C' },
  { id: 'pd', label: 'People & Directory', chip: '#FFFFFF', ink: '#05006C' },
  { id: 'ac', label: 'Accessibility', chip: '#32E0C4', ink: '#05006C' },
  { id: 'dt', label: 'Developer & Testing', chip: '#362DFF', ink: '#FFFFFF' },
];

export const extensions: Extension[] = [
  { n: 'Achievers', c: ['eg', 'ti'], d: 'Employee recognition, connected to LumApps.', href: '/achievers' },
  { n: 'License Management', c: ['tb'], d: 'Manage ADC widget licenses in one place.' },
  { n: 'Platform Style Manager', c: ['tb'], pop: 3, d: 'Manage your platform’s styles from one place.', href: '/platform-style' },
  { n: 'Advanced Survey', c: ['eg'], d: 'A powerful enhancement over the default LumApps survey.', href: '/advanced-survey' },
  { n: 'Table of Contents', c: ['cn'], d: 'Easy navigation through long wiki and knowledge base pages.', href: '/table-of-contents' },
  { n: 'Advent Calendar', c: ['sf'], d: 'A daily-reveal calendar for the holiday season.' },
  { n: 'Algolia', c: ['se', 'ti'], d: 'Algolia-powered search inside LumApps.' },
  { n: 'Back To Top', c: ['cn'], d: 'A quick, one-click way back to the top of any page or community.', href: '/wiki' },
  { n: 'Browser Tab Post Notifications', c: ['cs'], d: 'Shows a badge in the browser tab when new posts arrive.', href: DOCS + '4712358591070208/browser-tab-notifications-widget' },
  { n: 'Bunchball Leaderboard Widget', c: ['eg', 'ti'], d: 'Display one or multiple Bunchball leaderboards on any page.', href: '/bunchball-gamification-integration' },
  { n: 'Bunchball Profile Widget', c: ['eg', 'ti'], d: 'Shows each user’s Bunchball gamification profile.', href: '/bunchball-gamification-integration' },
  { n: 'Community Homepage Layout Mover', c: ['tb'], d: 'Move layouts between community homepages.' },
  { n: 'Community Posts in Real Time', c: ['cs'], d: 'A manual or dynamic selection of community posts that updates live.', href: '/town-hall' },
  { n: 'Confetti', c: ['sf'], d: 'Celebrate team or org-wide milestones with a burst of confetti.', href: '/confetti' },
  { n: 'Content Copier Tool', c: ['tb'], d: 'Efficiently duplicate LumApps content.', href: '/content-copier' },
  { n: 'Content Page Layout Mover', c: ['tb'], d: 'Streamlines moving layouts between content pages.', href: '/content-layout-mover' },
  { n: 'Content Summary', c: ['cn'], d: 'Gives readers a short summary of long pages, so they get the gist at a glance.', href: '/wiki' },
  { n: 'Debug Widget', c: ['dt'], d: 'Inspect and troubleshoot widgets while you build.' },
  { n: 'Display a QR Code', c: ['ut'], d: 'Show a QR code on any page.' },
  { n: 'Enhanced Search Filter Widget', c: ['se'], d: 'An upgrade to LumApps’ out-of-the-box content filter.', href: DOCS + '6544390651641856/enhanced-search-filter-widget' },
  { n: 'Estimated Reading Time', c: ['cn'], pop: 4, d: 'Automatically calculates and displays how long a page takes to read.', href: '/estimated-reading-time' },
  { n: 'Fireworks', c: ['sf'], d: 'Add some flair to a homepage or landing page.', href: '/fireworks' },
  { n: 'Follow Interests', c: ['cs'], d: 'Enhances the native LumApps “follow interest” experience.', href: '/follow-interests' },
  { n: 'Follow People', c: ['cs'], d: 'Enhances the native LumApps “follow user” experience.', href: '/follow-actions' },
  { n: 'Follow Space or Community', c: ['cs'], d: 'Follow Spaces and Communities from any page.', href: '/follow-actions' },
  { n: 'Google Knowledge Graph', c: ['se'], d: 'Search the Google Knowledge Graph without leaving LumApps.', href: DOCS + '5620597709078528/google-knowledge-graph-search-extension' },
  { n: 'Groups Lookup & Management', c: ['tb'], d: 'Find groups and add or update members without leaving the page.', href: DOCS + '5875158197731328/groups-lookup-and-management-widget' },
  { n: 'Guess Word', c: ['eg', 'sf'], d: 'A daily word game that brings teams together.', href: '/guess-word-widget' },
  { n: 'Holiday Spirit', c: ['sf'], d: 'Make every holiday memorable across your digital workplace.', href: '/holiday-spirits' },
  { n: 'Kaltura', c: ['ti'], d: 'Bring Kaltura live streams and on-demand video into LumApps.', href: '/kaltura' },
  { n: 'Last Modified Date & Time', c: ['cn'], d: 'Shows readers when a page was last updated.', href: DOCS + '5472087093280768/last-modified-date-widget' },
  { n: 'Looker Embed', c: ['ti'], d: 'View Looker dashboards directly inside LumApps.', href: '/looker' },
  { n: 'Media Mover', c: ['tb'], d: 'Search for any media file and move it where it belongs.', href: DOCS + '6739543057235968/media-mover-widget' },
  { n: 'Metadata Lookup & Edit', c: ['tb'], d: 'Lets site admins quickly find and edit metadata.', href: DOCS + '5978440819802112/metadata-edit-and-lookup' },
  { n: 'Metadata Mover', c: ['tb'], d: 'Reorganize your metadata structure.', href: '/metadata-mover' },
  { n: 'Organization Chart', c: ['pd', 'cn'], pop: 5, d: 'Displays your reporting structure as an org chart.', href: '/org-chart' },
  { n: 'Page Reader (Text-to-speech)', c: ['ac', 'cn'], pop: 1, d: 'Lets employees listen to LumApps content anytime, anywhere.', href: '/page-reader' },
  { n: 'Quick Post', c: ['cs'], d: 'Post to any Space or Community in one click.', href: '/town-hall' },
  { n: 'Search Community Posts in Real Time', c: ['se', 'ti'], d: 'Search community posts as they’re published.' },
  { n: 'Soccer Predictions', c: ['eg', 'sf'], pop: 2, d: 'Employee match predictions, native in LumApps.', href: '/soccer' },
  { n: 'Space Homepage Layout Copier', c: ['tb'], d: 'Copy one space’s homepage layout to another.', href: '/space-layout-mover' },
  { n: 'Stocks in Real Time', c: ['ut'], d: 'Displays live stock prices on any page.', href: DOCS + '6686852700438528/stocks-in-real-time-widget' },
  { n: 'Timezones Widget', c: ['ut'], d: 'Users personalize the time zone shown on any page.', href: '/timezone-widget' },
  { n: 'Unanswered Questions', c: ['cs'], d: 'Shows how many community questions still need an answer.', href: '/qa-support' },
  { n: 'Zoom Rooms Control Panel', c: ['ti'], d: 'Control Zoom Rooms from inside LumApps.' },
  { n: 'Coveo Search', c: ['se', 'ti'], d: 'Coveo-powered search inside LumApps.', href: '/coveo' },
];

/** Site paths that count as product pages: the Products page plus every page a product card links to on adc.dev. */
export const productPaths = new Set(['/products', ...extensions.map((e) => e.href).filter((h): h is string => !!h && h.startsWith('/'))]);
export const isProductPage = (pathname: string) => productPaths.has(pathname.replace(/\/$/, '') || '/');
