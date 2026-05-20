import { Body, Container, Head, Hr, Html, Preview, Text } from 'react-email';

// Hex equivalents of the app's Nordic Winter light theme (oklch → sRGB)
const theme = {
  background: '#f2f6f8', // --background: oklch(0.97 0.005 240)
  surface: '#fcfeff', // --surface: oklch(0.995 0.003 240)
  foreground: '#12161d', // --foreground: oklch(0.2 0.015 260)
  muted: '#5b646f', // --muted: oklch(0.5 0.02 250)
  accent: '#4886b8', // --accent: oklch(0.6 0.1 245)
  border: '#d3d8dc', // --border: oklch(0.88 0.008 240)
};

export interface AccountDeletedEmailProps {
  i18n: {
    preview: string;
    bodyText: string;
    footer: string;
  };
}

function AccountDeletedEmail({
  i18n: { preview, bodyText, footer },
}: AccountDeletedEmailProps) {
  return (
    <Html lang="sr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>AutoKPO</Text>
          <Hr style={divider} />

          <Text style={text}>{bodyText}</Text>

          <Hr style={divider} />
          <Text style={footerStyle}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

AccountDeletedEmail.PreviewProps = {
  i18n: {
    preview: 'Vaš AutoKPO nalog je obrisan',
    bodyText:
      'Vaš AutoKPO nalog je obrisan. Nalog i sinhronizovani podaci povezani sa ovom email adresom su trajno uklonjeni.',
    footer: 'Hvala što ste koristili AutoKPO. Prijatno!',
  },
} satisfies AccountDeletedEmailProps;

export default AccountDeletedEmail;

const body = {
  backgroundColor: theme.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0',
  padding: '24px 16px',
};

const container = {
  backgroundColor: theme.surface,
  borderRadius: '8px',
  borderTop: `4px solid ${theme.accent}`,
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px 24px',
  width: '100%',
};

const brand = {
  color: theme.accent,
  fontSize: '20px',
  fontWeight: '700',
  letterSpacing: '-0.3px',
  margin: '0 0 24px',
};

const divider = {
  borderColor: theme.border,
  borderTopWidth: '1px',
  margin: '0 0 28px',
};

const text = {
  color: theme.foreground,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 28px',
};

const footerStyle = {
  color: theme.muted,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};
