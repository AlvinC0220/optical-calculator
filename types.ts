export interface LensInputs {
  efl: number; // Effective Focal Length (mm)
  resH: number; // Resolution Horizontal (px)
  resV: number; // Resolution Vertical (px)
  pixelSize: number; // Pixel size (mm)
  centerFactor: number; // 1/X Ny for Center
  cornerFactor: number; // 1/X Ny for Corner
  testDistance: number; // Test Distance (mm)
}

export interface SpatialAnalysis {
  nyLpmm: number;
  nyCyclePixel: number;
  center: PointAnalysis;
  corner: PointAnalysis;
}

export interface PointAnalysis {
  factor: number;
  freqCp: number; // Frequency (Cycle/Pixel)
  freqLpmm: number; // Frequency (Lp/mm)
  sensorCycleWidth: number; // Width of one full cycle on sensor (mm)
  sensorLineWidth: number; // Width of half cycle on sensor (mm)
  halfFov: number; // Degrees
  objectLpWidth: number; // Line pair width at test distance (mm)
  objectLineWidth: number; // Line width at test distance (mm)
  tvlH: number;
  tvlV: number;
}
