## ADDED Requirements

### Requirement: Income chart Y-axis tick formatting adapts to data scale

The income bar chart Y-axis SHALL use a scale-uniform tick formatter selected based on the maximum income value across all displayed bars. All ticks on the Y-axis SHALL use the same formatting tier.

- When the maximum bar value is less than 10,000 RSD, ticks SHALL display as raw integers (e.g., "5000", "10000")
- When the maximum bar value is between 10,000 and 999,999 RSD, ticks SHALL display with a "K" suffix and zero decimal places (e.g., "50K", "100K")
- When the maximum bar value is 1,000,000 RSD or greater, ticks SHALL display with an "M" suffix and one decimal place (e.g., "0.0M", "1.5M", "6.0M")
- The zero tick SHALL always display as "0" regardless of tier

#### Scenario: Small income data (under 10K)

- **WHEN** all bar values are below 10,000 RSD
- **THEN** Y-axis ticks SHALL show raw integer values (e.g., "0", "2500", "5000", "7500")

#### Scenario: Moderate income data (under 1M)

- **WHEN** the largest bar value is between 10,000 and 999,999 RSD
- **THEN** all Y-axis ticks SHALL use "K" suffix with zero decimals (e.g., "0", "200K", "400K", "600K")

#### Scenario: Large income data (1M or above)

- **WHEN** the largest bar value is 1,000,000 RSD or greater
- **THEN** all Y-axis ticks SHALL use "M" suffix with one decimal (e.g., "0.0M", "2.0M", "4.0M", "6.0M")

#### Scenario: Zero or empty data

- **WHEN** all bar values are zero or the books array is empty
- **THEN** Y-axis tick formatting SHALL still produce valid output (e.g., "0" for all tick values)
