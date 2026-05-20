## MODIFIED Requirements

### Requirement: Entity profile form accepts formId and onSuccess props

The system SHALL accept a required `formId: string` prop on `EntityProfileForm`, set as the `id` attribute on the `<Form>` element, enabling external submit buttons to target the form via `form={formId}`. The form SHALL NOT render a submit button internally. The system SHALL accept an optional `onSuccess?: () => void` prop, called after the profile is successfully saved.

#### Scenario: External submit button triggers form submission

- **WHEN** a `<Button type="submit" form={formId}>` is rendered outside `EntityProfileForm` and the user clicks it
- **THEN** the form SHALL validate and, if valid, save the profile and call `onSuccess` if provided

#### Scenario: No onSuccess provided — form saves without error

- **WHEN** the user submits valid entity profile data and no `onSuccess` prop is passed
- **THEN** the system SHALL persist the profile and show the success toast with no errors

#### Scenario: No submit button inside the form

- **WHEN** `EntityProfileForm` is rendered
- **THEN** no submit button SHALL be present inside the form element
