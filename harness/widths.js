// The widths a nav log is drawn at, in CSS pixels. One list, read by the
// harness's width control and by the screenshot tests.
//
// The two EFB widths are PROVISIONAL: nobody has published the tablet's
// viewport, and #206 measures it. Replace them with the measured numbers.
// A4 landscape is 297 mm at 96 dpi.
export const WIDTHS = [
  { id: "efb-8in-portrait", label: 'EFB 8.3" portrait (provisional)', px: 600 },
  { id: "efb-11in-landscape", label: 'EFB 10.9" landscape (provisional)', px: 1000 },
  { id: "a4-landscape", label: "A4 landscape", px: 1123 },
];
