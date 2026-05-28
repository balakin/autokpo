# e2ee-aes-gcm-params Specification

## Purpose

TBD - created by archiving change unify-encryption-params. Update Purpose after archive.

## Requirements

### Requirement: Shared AES-GCM params type bundles iv and tagBits

The system SHALL define a single shared AES-GCM params type `{ iv: string, tagBits: number }` used for every AES-256-GCM encryption and wrapping operation. The `iv` field SHALL contain the actual base64-encoded IV bytes used for that specific encryption. The `tagBits` field SHALL contain the GCM authentication tag length in bits. No `ivBytes` generation hint SHALL be stored; IV length is implied by the stored value.

#### Scenario: AES-GCM params carries actual IV

- **WHEN** an AES-256-GCM encryption operation completes
- **THEN** the resulting params object SHALL contain the `iv` bytes that were used for that encryption, base64-encoded
- **AND** SHALL contain `tagBits: 128`
- **AND** SHALL NOT contain an `ivBytes` field

### Requirement: AES-GCM algorithm name identifies params shape

The system SHALL use the algorithm string `'aes-256-gcm'` as the sole identifier for AES-GCM encrypted blobs. No separate `*Version` integer field SHALL accompany the algorithm name. A change to the params structure SHALL be reflected by a new algorithm string.

#### Scenario: Encrypted blob carries algorithm without version

- **WHEN** any encrypted record is serialized (key ring, wrapper, sync record, or local envelope)
- **THEN** it SHALL contain an `encryptionAlgorithm` or `wrappingAlgorithm` field equal to `'aes-256-gcm'`
- **AND** SHALL NOT contain a sibling `encryptionVersion` or `wrappingVersion` integer field

### Requirement: tagBits flows through to primitive encrypt/decrypt calls

The AES-GCM encrypt and decrypt primitives SHALL accept `tagBits` as a parameter and pass it to the WebCrypto `tagLength` option. The value `128` SHALL NOT be hardcoded inside the primitives.

#### Scenario: Primitive uses tagBits from params

- **WHEN** `aesGcmEncrypt` or `aesGcmDecrypt` is called with params `{ iv, tagBits: 128 }`
- **THEN** the WebCrypto operation SHALL use `tagLength: 128`
- **AND** a future call with `tagBits: 96` SHALL use `tagLength: 96` without code changes
