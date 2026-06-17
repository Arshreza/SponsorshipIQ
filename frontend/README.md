# SponsorIQ — Frontend Layer 🎨

This directory represents the frontend client layer of **SponsorIQ**. 

Since SponsorIQ is built as a modern, unified full-stack **Next.js 15** web application, the frontend is colocated with our server routes in the root of the repository to enable Server-Side Rendering (SSR) and Server Actions.

### Key Frontend Locations:
- **Routes & Pages**: [app/](file:///../app) (layouts, auth views, CRM dashboards)
- **UI Components**: [components/](file:///../components) (pipeline Kanban boards, wizards, form components)
- **Styling System**: [app/globals.css](file:///../app/globals.css) (vibrant teal/amber Tailwind CSS v4 variables and theme)
- **State Store**: [components/pipeline/pipeline-board.tsx](file:///../components/pipeline/pipeline-board.tsx) (Kanban drag-and-drop client state)
