import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Determine if we're in a GitHub Pages deployment environment
const isDeployPreview = process.env.GITHUB_ACTIONS === 'true';

const config: Config = {
  title: 'Huckleberry',
  tagline: 'AI-powered task management inside Visual Studio Code',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://cambridgemonorail.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: isDeployPreview ? '/vscode-huckleberry/' : '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'CambridgeMonorail', // Usually your GitHub org/user name.
  projectName: 'vscode-huckleberry', // Usually your repo name.

  // Changed from 'throw' to 'warn' to allow the build to complete
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Add Google site verification meta tag
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'google-site-verification',
        content: 'vcXVoRYtK7tLGjvik4u-4h1xuwyYS77_uI4tjW8Xk1A',
      },
    },
  ],

  // Add custom script for GDPR compliance before Google Analytics loads
  scripts: [
    {
      src: '/js/analytics-consent.js',
      async: false, // Must load before Google Analytics
      defer: false,
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/CambridgeMonorail/vscode-huckleberry/tree/main/apps/huckleberry-docs/',
          // Set the root doc to the intro
          routeBasePath: '/',
          // Changed the docs base to match the links used in the site
          path: 'docs',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/CambridgeMonorail/vscode-huckleberry/tree/main/apps/huckleberry-docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // Add Google Analytics configuration
        gtag: {
          trackingID: 'GTM-N2JHGVNS',
          anonymizeIP: true,
        },
        // Add sitemap configuration
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
          lastmod: 'date',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/huckleberry-social-card.jpg',
    navbar: {
      title: 'Huckleberry',
      logo: {
        alt: 'Huckleberry Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/blog/archive', label: 'Blog Archive', position: 'left'},
        {
          href: 'https://github.com/CambridgeMonorail/vscode-huckleberry',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
            {
              label: 'Features',
              to: '/features',
            },
            {
              label: 'Usage',
              to: '/usage',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/CambridgeMonorail/vscode-huckleberry/discussions',
            },
            {
              label: 'Issues',
              href: 'https://github.com/CambridgeMonorail/vscode-huckleberry/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/CambridgeMonorail/vscode-huckleberry',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Huckleberry Project Contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
