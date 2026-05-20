## MODIFIED Requirements

### Requirement: Icons are rendered via react-icons Lucide components

The system SHALL import icon components from `react-icons/lu` (e.g., `LuPencil`, `LuPlus`, `LuBook`). No other icon libraries (including `react-icons/fa6`, `@iconify/react`) SHALL be used. No ad-hoc inline SVGs SHALL be used.

#### Scenario: Icon renders without network request

- **WHEN** any page containing an icon is loaded
- **THEN** the icon SHALL render from the bundled JS without any CDN or network fetch

#### Scenario: Icon sizing via className

- **WHEN** an icon component is rendered with a Tailwind size class (e.g., `className="size-6"`)
- **THEN** the icon SHALL scale to the specified dimensions

#### Scenario: Icon sizing via size prop

- **WHEN** an icon component is rendered with a numeric `size` prop (e.g., `size={16}`)
- **THEN** the icon width and height SHALL both equal that value in pixels
