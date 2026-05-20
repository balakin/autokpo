## MODIFIED Requirements

### Requirement: Icons are rendered via react-icons Lucide components

The system SHALL import general UI icon components from `react-icons/lu` (e.g., `LuPencil`, `LuPlus`, `LuBook`). No other icon sub-packages (including `@iconify/react`) SHALL be used.

The only permitted non-Lucide icon exception is for OAuth provider brand marks on OAuth sign-in buttons. Google and GitHub OAuth buttons SHALL use `FaGoogle` and `FaGithub` from `react-icons/fa6`. These icons SHALL be scoped to OAuth buttons and SHALL be decorative (`aria-hidden="true"`) when the button text already provides the accessible label.

#### Scenario: Icon renders without network request

- **WHEN** any page containing an icon is loaded
- **THEN** the icon SHALL render from bundled application assets without any CDN or network fetch

#### Scenario: Icon sizing via className

- **WHEN** an icon component is rendered with a Tailwind size class (e.g., `className="size-6"`)
- **THEN** the icon SHALL scale to the specified dimensions

#### Scenario: Icon sizing via size prop

- **WHEN** an icon component is rendered with a numeric `size` prop (e.g., `size={16}`)
- **THEN** the icon width and height SHALL both equal that value in pixels

#### Scenario: OAuth provider brand mark is decorative

- **WHEN** an OAuth sign-in button renders a provider SVG mark
- **THEN** the button text SHALL provide the accessible action name
- **AND** the provider SVG mark SHALL NOT create a duplicate accessible name
