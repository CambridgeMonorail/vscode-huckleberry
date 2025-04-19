import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'intro',
        'installation',
        'quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features',
        'language-model-tools',
        'chat-commands',
        'task-storage',
      ],
    },
    {
      type: 'category',
      label: 'Usage',
      items: [
        'usage',
        'working-with-tasks',
        'scanning-todos',
        'parsing-requirements',
        'task-status-management',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'settings',
        'customization',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development',
        'extension-architecture',
        'roadmap',
      ],
    },
  ],
};

export default sidebars;
