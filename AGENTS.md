# Project conventions

- Use Next.js App Router. Route files compose page components; feature logic belongs in `components/<feature>/` or `lib/`.
- Use the installed `98.css` UI throughout the project. Prefer its documented window, title-bar control classes, buttons, tabs, fieldsets, field borders, status bars and progress indicators. Do not introduce another component library or replace library controls with custom lookalikes.
- Keep the desktop and document fixed to the viewport. Never enable document/background scrolling or overscroll bounce.
- On PC, size the application window within the available viewport above the taskbar. Use flexible layouts with `min-height: 0`; confine overflow to explicitly bounded content panels (such as the canvas or long lists).
- On mobile, scroll content inside the application workspace, never the desktop background.
- Preserve demo-only labeling until real wallet and payment integrations are implemented.
