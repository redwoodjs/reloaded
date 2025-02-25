// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Redwood SDK',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
      customCss: [
        // Relative path to your custom CSS file
        './src/styles/custom.css',
      ],
      social: {
        github: 'https://github.com/redwoodjs/sdk',
      },
      sidebar: [
        {
          label: 'Quick Start',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Creating Your First Project', slug: 'getting-started/first-project' },
          ],
        },
        {
          label: 'Tutorial',
          items: [
            {
              label: 'Full Stack Applications',
              collapsed: true,
              items: [
                { label: 'Project Setup', slug: 'tutorial/full-stack-app/setup' },
                { label: 'Create the Application', slug: 'tutorial/full-stack-app/create-app' },
                { label: 'Database Setup', slug: 'tutorial/full-stack-app/database-setup' },
                { label: 'Authentication', slug: 'tutorial/full-stack-app/auth' },
                { label: 'Jobs List', slug: 'tutorial/full-stack-app/jobs-list' },
                { label: 'Jobs Form', slug: 'tutorial/full-stack-app/jobs-form' },
                { label: 'Contacts', slug: 'tutorial/full-stack-app/contacts' },
                { label: 'Jobs Details', slug: 'tutorial/full-stack-app/jobs-details' },
                { label: 'Deploying', slug: 'tutorial/full-stack-app/deploying' },
              ]
            },
            {
              label: 'Advanced Topics',
              collapsed: true,
              items: [
                { label: 'Form Validation', slug: 'tutorial/advanced-topics/validation' },
                { label: 'File Uploads with r2', slug: 'tutorial/advanced-topics/uploads' },
                { label: 'Attaching Notes', slug: 'tutorial/advanced-topics/notes' },
                { label: 'Resumes and Cover Letters', slug: 'tutorial/advanced-topics/resumes-cover-letters' },
                { label: 'Integrating with AI', slug: 'tutorial/advanced-topics/ai' },
                { label: 'Queues and Background Jobs', slug: 'tutorial/advanced-topics/queues' },
                { label: 'Email Integration', slug: 'tutorial/advanced-topics/email' },
                { label: 'Extending Authentication', slug: 'tutorial/advanced-topics/auth' },
                { label: 'Building a Dashboard', slug: 'tutorial/advanced-topics/dashboard' },
                { label: 'Testing Your Application', slug: 'tutorial/advanced-topics/testing' },
                { label: 'CI/CD', slug: 'tutorial/advanced-topics/cicd' },
              ]
            },
          ],
        },
        {
          label: 'How-To Guides',
          items: [
            {
              label: 'Routing',
              collapsed: true,
              items: [
                { label: 'Basic Routing', slug: 'guides/routing/basic' },
                { label: 'Authentication & Authorization', slug: 'guides/routing/auth' },
                { label: 'Data and State Management', slug: 'guides/routing/data-state' },
                {
                  label: 'Common Routing Patterns', items: [
                    { label: 'Onboarding Flow', slug: 'guides/routing/onboarding-flow' },
                    { label: 'Multi-Step Form', slug: 'guides/routing/multi-step-form' },
                    { label: 'Modal Routes', slug: 'guides/routing/modal-routes' },
                    { label: 'Tabs with Routes', slug: 'guides/routing/tabs-with-routes' },
                  ]
                },
                {
                  label: 'Performance and User Experience', items: [
                    { label: 'Implement View transitions', slug: 'guides/routing/view-transitions' },
                    { label: 'Optimize route loading (progress bar)', slug: 'guides/routing/route-loading' },
                    { label: 'Handle back/forward navigation', slug: 'guides/routing/back-forward-nav' },
                  ]
                }
              ]
            },
            {
              label: 'Databases & Data',
              collapsed: true,
              items: [
                { label: 'CRUD', slug: 'guides/db-data/crud' },
                { label: 'Prisma', slug: 'guides/db-data/prisma' },
                { label: 'Drizzle', slug: 'guides/db-data/drizzle' },
                { label: 'Working with d1 Database', slug: 'guides/db-data/d1' },
              ]
            },
            {
              label: 'Authentication & Security',
              collapsed: true,
              items: [
                { label: 'Setting up Authentication', slug: 'guides/auth/setup' },
                { label: 'Managing User Sessions', slug: 'guides/auth/sessions' },
                { label: 'Role-Based Access Control', slug: 'guides/auth/rbac' },
              ]
            },
            {
              label: 'Forms',
              collapsed: true,
              items: [
                {
                  label: "Getting Started with Forms",
                  items: [
                    { label: 'Introduction to Forms', slug: 'guides/forms/intro' },
                    { label: 'Basic Forms', slug: 'guides/forms/basic-forms' },
                    { label: 'Optimistic Updates', slug: 'guides/forms/optimistic-updates' },
                    { label: 'Form Components', slug: 'guides/forms/form-components' },
                    { label: 'Validation', slug: 'guides/forms/validation' },
                  ]
                },
                {
                  label: "Advanced Form Patterns",
                  items: [
                    { label: 'Multi-Step Forms', slug: 'guides/forms/multi-step' },
                    { label: 'Dynamic Forms', slug: 'guides/forms/dynamic' },
                    { label: 'Uploads', slug: 'guides/forms/uploads' },
                    { label: 'Auto-Save', slug: 'guides/forms/auto-save' },
                    { label: 'State Management', slug: 'guides/forms/state' },
                  ]
                },
                {
                  label: "Form Security & Performance",
                  items: [
                    { label: 'Security', slug: 'guides/forms/security' },
                    { label: 'Performance', slug: 'guides/forms/performance' },
                    { label: 'Testing', slug: 'guides/forms/testing' },
                    { label: 'Accessibility', slug: 'guides/forms/a11y' },
                  ]
                },
                {
                  label: "Specialized Forms",
                  items: [
                    { label: 'Payment Forms', slug: 'guides/forms/payment' },
                    { label: 'Search Forms', slug: 'guides/forms/search' },
                    { label: 'File Management', slug: 'guides/forms/file-management' },
                    { label: 'Organization', slug: 'guides/forms/organization' },
                    { label: 'Error Handling', slug: 'guides/forms/error' },
                    { label: 'State Management', slug: 'guides/forms/state' },
                  ]
                },
              ]
            },
            {
              label: 'Frontend Development',
              collapsed: true,
              items: [
                { label: 'React Server Components', slug: 'guides/frontend/react-server-components' },
                { label: 'TailwindCSS', slug: 'guides/frontend/tailwind' },
                { label: 'ShadCN UI', slug: 'guides/frontend/shadcn' },
                { label: 'Layouts', slug: 'guides/frontend/layouts' },
              ]
            },
            {
              label: 'Backend Development',
              collapsed: true,
              items: [
                { label: 'API Routes', slug: 'guides/backend/api' },
              ]
            },
            {
              label: 'AI Integration',
              collapsed: true,
              items: [
                { label: 'Cursor', slug: 'getting-started/installation' },
                { label: 'Setting up OpenAI Integration', slug: 'getting-started/installation' },
                { label: 'Setting up Anthropic Integration', slug: 'getting-started/installation' },
                { label: 'Setting up Gemini Integration', slug: 'getting-started/installation' },
                { label: 'Working with Cloudflare AI', slug: 'getting-started/installation' },
                { label: 'Building AI Powered Features', slug: 'getting-started/installation' },
                { label: 'Streaming AI Responses', slug: 'getting-started/installation' },
              ]
            },
            {
              label: 'Deployment',
              collapsed: true,
              items: [
                { label: 'Deploying to Cloudflare', slug: 'getting-started/installation' },
                { label: 'Setting up a Custom Domain', slug: 'getting-started/installation' },
                { label: 'Working with Cloudflare r2', slug: 'getting-started/installation' },
              ]
            },
            {
              label: 'Testing',
              collapsed: true,
              items: [
                { label: 'Setting up a Testing Environment', slug: 'getting-started/installation' },
                { label: 'Vitest', slug: 'getting-started/installation' },
                { label: 'Playwright', slug: 'getting-started/installation' },
                { label: 'Cyprus', slug: 'getting-started/installation' },
                { label: 'Testing Best Practices', slug: 'getting-started/installation' },
              ]
            },
          ],
        },
        {
          label: 'Reference',
          collapsed: true,
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'Explanations & Concepts',
          collapsed: true,
          items: [
            { label: 'Architecture Overview', slug: 'getting-started/installation' },
            { label: 'Why Redwood SDK?', slug: 'getting-started/installation' },
            { label: 'Server vs Client Components', slug: 'getting-started/installation' },
            { label: 'Integration Philosophy', slug: 'getting-started/installation' },
            { label: 'Performance Considerations', slug: 'getting-started/installation' },
            { label: 'Security Best Practices', slug: 'getting-started/installation' },
            { label: 'AI Integration Philosophy', slug: 'getting-started/installation' },
            { label: 'UI Component Strategy', slug: 'getting-started/installation' },
          ]
        },
      ],
    }),
  ],
  baseUrl: '/docs/introduction'
});
