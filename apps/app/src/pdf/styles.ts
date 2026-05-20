import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'PT Serif',
    fontSize: 10,
    padding: 20,
    paddingBottom: 35,
  },
  pageHeader: {
    flexDirection: 'row',
    gap: 200,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageHeaderInfo: {
    flex: 1,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  pageHeaderLabel: {
    fontWeight: 'bold',
    flexShrink: 0,
  },
  pageHeaderValue: {
    flex: 1,
  },
  kpoTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 4,
  },
  table: {
    borderLeft: '0.5pt solid black',
    borderRight: '0.5pt solid black',
  },
  tableHeadRow: {
    flexDirection: 'row',
    borderTop: '0.5pt solid black',
    borderBottom: '0.5pt solid black',
  },
  tableHeaderNumbersRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid black',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid black',
  },
  tableCell: {
    padding: 3,
    borderRight: '0.5pt solid black',
    fontSize: 9,
  },
  tableCellBold: {
    padding: 3,
    borderRight: '0.5pt solid black',
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerGroup: {
    flexDirection: 'column',
    borderRight: '0.5pt solid black',
    textAlign: 'center',
  },
  headerGroupLabel: {
    padding: 3,
    borderBottom: '0.5pt solid black',
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
  },
  headerGroupRow: {
    flexDirection: 'row',
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: 9,
    textAlign: 'center',
  },
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 180,
    paddingTop: 20,
  },
  signatureField: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signatureLine: {
    borderTop: '0.5pt solid black',
    width: '100%',
    marginTop: 2,
  },
  signatureName: {
    marginBottom: 2,
  },
});
