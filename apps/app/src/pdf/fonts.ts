import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'PT Serif',
  fonts: [
    {
      src: window.location.origin + '/fonts/pt-serif/PTSerif-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: window.location.origin + '/fonts/pt-serif/PTSerif-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});
