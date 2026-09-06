# Frontend Design & Implementation Rules

## Primary objective

Build interfaces that feel intentionally designed by a strong human product designer and frontend engineer, not generated from a generic AI website template.

The existing application and its functionality are important. Improve the visual design without unnecessarily rewriting working architecture or functionality.

Before making significant UI changes, inspect the existing application, understand its structure, and identify the highest-impact visual problems.

---

## 1. NEVER default to generic AI aesthetics

Avoid the common "AI-generated website" look:

- Do not default to Inter, Roboto, Arial, or generic system fonts.
- Do not use purple/blue gradients on white backgrounds unless the brand genuinely calls for them.
- Do not make every element a rounded card.
- Do not put everything inside cards.
- Do not use excessive `rounded-xl` / `rounded-2xl` containers.
- Do not use excessive glassmorphism, blur, shadows, or gradients.
- Do not use giant centered hero headings simply because they are conventional.
- Do not use predictable "hero → three cards → testimonials → CTA" layouts unless the content actually benefits from that structure.
- Do not use generic SaaS dashboard layouts for non-dashboard products.
- Do not use decorative icons where meaningful visual content would be better.
- Do not add visual effects merely because they are technically impressive.
- Do not make every section visually identical.
- Do not make every component look like it came from the same component library demo.

The result should have a recognizable visual identity.

---

## 2. Establish a design direction BEFORE polishing components

Before implementing substantial visual changes, determine:

1. What is this product/site?
2. Who is using it?
3. What should the interface feel like?
4. What visual characteristic makes it different from competing websites?
5. What is the single strongest visual idea?

Commit to ONE coherent aesthetic direction.

Do not combine unrelated design trends.

Examples of possible directions:

- editorial / art-directed
- restrained Swiss
- technical / industrial
- premium minimal
- brutalist
- cinematic
- playful
- dense information design
- sophisticated dark interface
- contemporary magazine
- utilitarian
- experimental typography

These are examples, not defaults. Choose based on the actual product.

---

## 3. Typography is a major part of the design

Treat typography as a design system, not an afterthought.

Choose a distinctive, intentional font pairing.

Avoid:

- Inter
- Roboto
- Arial
- generic system fonts
- overused "startup" fonts unless genuinely appropriate

Use typography to create hierarchy through:

- font family
- weight
- size
- line height
- letter spacing
- width
- contrast
- text density

Do not make every heading enormous.

Do not make every heading bold.

Do not use uppercase text everywhere.

Use sentence case by default.

Typography should make the website recognizable even if all colors and images were removed.

---

## 4. Color

Create a deliberate color system.

Use CSS variables/tokens for:

- background
- foreground
- muted text
- borders
- primary
- secondary
- accent
- destructive/error
- success
- surface

Prefer a small, coherent palette over many unrelated colors.

Commit to a visual hierarchy.

A restrained palette with one strong accent is usually better than a rainbow of UI colors.

Do not use gradients as a substitute for having a real visual concept.

---

## 5. Layout

Avoid repetitive grids of identical cards.

Vary composition where appropriate:

- asymmetric layouts
- intentional whitespace
- editorial columns
- overlapping elements
- varied section widths
- strong alignment systems
- full-bleed content
- controlled density
- interesting image/text relationships

Not every section needs to occupy the full viewport.

Not every section needs a centered max-width container.

Use whitespace intentionally rather than simply increasing padding everywhere.

Establish a clear grid and alignment system.

Spacing should feel rhythmic and deliberate.

---

## 6. Components

Components should serve the content.

Do not turn every piece of content into:

```text
rounded container
  icon
  heading
  paragraph
  button
```

That pattern is strongly associated with generic AI-generated SaaS interfaces.

Use different visual treatments when the content calls for them.

Prefer hierarchy and composition over decorative containers.

Use borders, backgrounds, shadows, and cards selectively.

If removing a border or card improves the design, remove it.

---

## 7. Buttons and controls

Buttons should have clear hierarchy.

Use:

- one obvious primary action
- secondary actions that visually recede
- tertiary actions only where useful

Avoid making every button look equally important.

Do not excessively round buttons unless the overall visual language calls for it.

Do not use gradients on buttons by default.

Interactive states must be obvious:

- hover
- active
- focus-visible
- disabled
- loading

---

## 8. Icons

Use one consistent icon family.

Do not mix random icon styles.

Do not use icons merely to decorate every heading or card.

Icons should communicate something or improve scanning.

Never use emoji as UI icons unless the product specifically calls for it.

---

## 9. Images and visual assets

Prefer real, contextual imagery over generic stock imagery.

If images are unavailable, create a visual system that works without pretending generic images are meaningful.

Do not use random abstract blobs simply to fill empty space.

Images should have intentional:

- aspect ratios
- cropping
- placement
- scale
- relationship to surrounding content

Do not make every image a rounded rectangle.

---

## 10. Motion

Use motion intentionally.

Good animation should communicate:

- hierarchy
- spatial relationships
- state changes
- interaction
- progression

Prefer a few strong animations over dozens of tiny ones.

Good candidates:

- page entrance
- section reveal
- navigation transitions
- hover states
- expanding/collapsing content
- meaningful feedback

Avoid:

- excessive bouncing
- constant floating
- unnecessary parallax
- animation on every element
- animations that slow down the user

Respect `prefers-reduced-motion`.

---

## 11. Responsive design

Design for mobile rather than simply shrinking desktop layouts.

Explicitly consider:

- 375px
- 768px
- 1024px
- 1440px

At every breakpoint:

- content should reflow naturally
- typography should remain readable
- controls should remain usable
- navigation should remain understandable
- important content must not disappear accidentally
- there must be no horizontal scrolling

Do not solve mobile layouts by simply making everything smaller.

---

## 12. Accessibility

Maintain WCAG AA-level accessibility where practical.

Every interactive element should have:

- visible focus state
- meaningful accessible name
- appropriate semantic element
- sufficient contrast
- usable touch target

Use semantic HTML.

Do not sacrifice accessibility for aesthetics.

---

## 13. Visual hierarchy

Every page should have an obvious hierarchy.

The user should immediately understand:

1. where they are
2. what the page is about
3. what the primary action is
4. what information matters most
5. what they can do next

Use size, position, typography, contrast, whitespace, and grouping to establish hierarchy.

Do not attempt to make everything visually prominent.

---

## 14. Content is part of the design

Avoid generic marketing copy such as:

- "Unlock your potential"
- "The future of..."
- "Seamless solutions"
- "Powerful tools for modern teams"
- "Take your experience to the next level"

Use concrete language appropriate to the actual product.

Good UI copy should sound like something a real company would write, not placeholder AI marketing copy.

Do not invent fake testimonials, fake statistics, fake customers, or fake product claims.

---

## 15. Existing code

Do not rewrite architecture unnecessarily.

Before changing code:

- inspect the relevant files
- understand the current component structure
- identify reusable components
- preserve working functionality
- reuse existing dependencies where appropriate

Avoid unnecessary abstraction.

Do not create components solely to make the code look architecturally impressive.

Do not add dependencies unless they materially improve the result.

---

## 16. Use the UI/UX Pro Max skill

For UI/UX work, use the installed `ui-ux-pro-max` skill.

Before making major design decisions, use it to investigate:

- appropriate product patterns
- visual styles
- color palettes
- typography
- UX guidelines
- landing/page structure
- accessibility considerations

Treat its recommendations as design input, not as a reason to blindly copy a template.

The final result must still be adapted to this specific product.

---

## 17. Visual review is mandatory

Do not assume the implementation looks good because the code is correct.

After significant UI changes:

1. Run the application.
2. Inspect the rendered page.
3. Check desktop and mobile layouts.
4. Look for visual inconsistencies.
5. Look specifically for generic AI-generated patterns.
6. Fix the highest-impact issues.
7. Repeat until the page feels intentionally designed.

Prioritize visual problems in this order:

1. overall composition
2. typography
3. spacing and rhythm
4. color
5. hierarchy
6. imagery
7. component styling
8. micro-interactions

Do not spend time polishing tiny details while the overall composition is weak.

---

## 18. Final anti-slop check

Before considering frontend work complete, ask:

- Would this website be visually recognizable without its logo?
- Does it have a clear design point of view?
- Does it look like it belongs to this specific product?
- Did we avoid generic card grids?
- Did we avoid default AI typography?
- Did we avoid unnecessary gradients?
- Did we avoid excessive rounded containers?
- Is the visual hierarchy obvious?
- Does the mobile version feel intentionally designed?
- Are animations meaningful?
- Does anything look like a component-library demo?
- Would an experienced product designer consider this deliberate rather than merely "nice"?

If the answer to any of these is no, improve the design before finishing.
