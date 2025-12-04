import React, { useState, useMemo } from 'react';
import { LensInputs, SpatialAnalysis, PointAnalysis } from '../types';

// Helper to format numbers cleanly
const fmt = (num: number, digits: number = 2) => {
  if (!isFinite(num) || isNaN(num)) return '-';
  // Avoid removing trailing zeros if precision matters, but generally strip for cleanliness
  return parseFloat(num.toFixed(digits)).toString();
};

const fmtFixed = (num: number, digits: number = 2) => {
  if (!isFinite(num) || isNaN(num)) return '-';
  return num.toFixed(digits);
};

export const LensCalculator: React.FC = () => {
  // Initial state matching the "Moto" spreadsheet example
  const [inputs, setInputs] = useState<LensInputs>({
    efl: 2.12,
    resH: 2560,
    resV: 1938,
    pixelSize: 0.002,
    centerFactor: 3,    // 1/3 Ny
    cornerFactor: 4,    // 1/4 Ny
    testDistance: 500,
  });

  const handleInputChange = (field: keyof LensInputs, value: string) => {
    const numVal = parseFloat(value);
    setInputs((prev) => ({
      ...prev,
      [field]: isNaN(numVal) ? 0 : numVal,
    }));
  };

  const results: SpatialAnalysis = useMemo(() => {
    const { efl, resH, resV, pixelSize, centerFactor, cornerFactor, testDistance } = inputs;

    // Base Calculations
    // Nyquist (Lp/mm) = 1 / (2 * PixelSize)
    const nyLpmm = pixelSize > 0 ? 1 / (2 * pixelSize) : 0;
    const nyCyclePixel = 0.5;

    const calculatePoint = (factor: number): PointAnalysis => {
      if (factor <= 0 || pixelSize <= 0 || efl <= 0) {
        return {
          factor,
          freqCp: 0,
          freqLpmm: 0,
          sensorCycleWidth: 0,
          sensorLineWidth: 0,
          halfFov: 0,
          objectLpWidth: 0,
          objectLineWidth: 0,
          tvlH: 0,
          tvlV: 0,
        };
      }

      // Logic derived from spreadsheet analysis:
      // "Key in (1/X Ny)" means input is 'X'.
      // Freq (Lp/mm) = Ny(Lp/mm) / factor
      const freqLpmm = nyLpmm / factor;
      
      // Freq (Cycle/Pixel) = 0.5 / factor
      const freqCp = 0.5 / factor;

      // Sensor Geometry
      const sensorCycleWidth = 1 / freqLpmm; // Width of one full cycle (Line Pair) in mm
      const sensorLineWidth = sensorCycleWidth / 2; // Width of one line (Half cycle) in mm

      // FOV Calculation
      // Based on spreadsheet: Center Half FOV 0.723 deg from Image Width 0.016 (which is Line Width).
      // Formula: degrees(atan(SensorLineWidth / EFL))
      const halfFov = (Math.atan(sensorLineWidth / efl) * 180) / Math.PI;

      // Object Plane Calculations (at Test Distance)
      // M_inv = TestDistance / EFL
      // CORRECTION based on Spreadsheet analysis:
      // The spreadsheet's "Line pair width" (e.g., 1.4mm or 6.3mm) roughly equals:
      // Sensor_Line_Width * (TestDist / EFL).
      // This physically represents projecting the "Line Width" (Half-Cycle) to the object plane,
      // but the spreadsheet labels it "Line pair width".
      // The spreadsheet "Line width" is exactly half of that.
      
      const magnificationInv = testDistance / efl;
      
      // We calculate the projected size of the Sensor LINE (Half-Cycle)
      const projectedHalfCycle = sensorLineWidth * magnificationInv;

      // Map to spreadsheet outputs:
      const objectLpWidth = projectedHalfCycle; // Spreadsheet calls the projected half-cycle "Line pair width"
      const objectLineWidth = projectedHalfCycle / 2; // Spreadsheet calls the projected quarter-cycle "Line width"

      // TVL Calculation
      // Formula: Res / (Factor * 2).
      // Example: 2560 / (3 * 2) = 426.7
      const tvlH = resH / (factor * 2);
      const tvlV = resV / (factor * 2);

      return {
        factor,
        freqCp,
        freqLpmm,
        sensorCycleWidth,
        sensorLineWidth,
        halfFov,
        objectLpWidth,
        objectLineWidth,
        tvlH,
        tvlV,
      };
    };

    return {
      nyLpmm,
      nyCyclePixel,
      center: calculatePoint(centerFactor),
      corner: calculatePoint(cornerFactor),
    };
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN - INPUTS & SPATIAL FREQ */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-yellow-300 px-6 py-3 border-b border-yellow-400">
            <h2 className="text-lg font-bold text-yellow-900 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Input Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <InputGroup label="Lens EFL (mm)" value={inputs.efl} onChange={(v) => handleInputChange('efl', v)} />
            <InputGroup label="Resolution H (px)" value={inputs.resH} onChange={(v) => handleInputChange('resH', v)} />
            <InputGroup label="Resolution V (px)" value={inputs.resV} onChange={(v) => handleInputChange('resV', v)} />
            <InputGroup label="Pixel Size (mm)" value={inputs.pixelSize} step={0.001} onChange={(v) => handleInputChange('pixelSize', v)} />
          </div>
        </div>

        {/* Card 2: Spatial Frequency Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-700">Spatial Frequency Analysis</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-3 font-medium">Metric</th>
                  <th className="px-6 py-3 font-medium text-center">Ny</th>
                  <th className="px-6 py-3 font-medium text-center">1/2 Ny</th>
                  <th className="px-6 py-3 font-medium text-center">1/3 Ny</th>
                  <th className="px-6 py-3 font-medium text-center">1/4 Ny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-3 font-medium text-slate-700">Lp/mm</td>
                  <td className="px-6 py-3 text-center">{fmt(results.nyLpmm, 1)}</td>
                  <td className="px-6 py-3 text-center">{fmt(results.nyLpmm / 2, 1)}</td>
                  <td className="px-6 py-3 text-center">{fmt(results.nyLpmm / 3, 1)}</td>
                  <td className="px-6 py-3 text-center">{fmt(results.nyLpmm / 4, 1)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-slate-700">Cycle/Pixel</td>
                  <td className="px-6 py-3 text-center">0.5</td>
                  <td className="px-6 py-3 text-center">0.25</td>
                  <td className="px-6 py-3 text-center">0.17</td>
                  <td className="px-6 py-3 text-center">0.13</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Frequency Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
             <h2 className="text-lg font-bold text-slate-700">Selected Frequencies</h2>
             <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">Input: Factor X (in 1/X Ny)</span>
          </div>
          <div className="p-6 space-y-4">
            {/* Center Row */}
            <div className="flex items-center space-x-4">
              <div className="w-32 flex-shrink-0">
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Center Factor</label>
                 <input 
                    type="number" 
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
                    value={inputs.centerFactor}
                    onChange={(e) => handleInputChange('centerFactor', e.target.value)}
                 />
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Cycle/Pixel</div>
                    <div className="font-mono font-medium text-slate-700">{fmtFixed(results.center.freqCp, 2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Lp/mm</div>
                    <div className="font-mono font-medium text-blue-600">{fmtFixed(results.center.freqLpmm, 1)}</div>
                  </div>
                  <div className="text-center hidden sm:block">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                       Center
                     </span>
                  </div>
              </div>
            </div>

            {/* Corner Row */}
            <div className="flex items-center space-x-4">
              <div className="w-32 flex-shrink-0">
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Corner Factor</label>
                 <input 
                    type="number" 
                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm p-2 border"
                    value={inputs.cornerFactor}
                    onChange={(e) => handleInputChange('cornerFactor', e.target.value)}
                 />
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Cycle/Pixel</div>
                    <div className="font-mono font-medium text-slate-700">{fmtFixed(results.corner.freqCp, 2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Lp/mm</div>
                    <div className="font-mono font-medium text-green-600">{fmtFixed(results.corner.freqLpmm, 1)}</div>
                  </div>
                  <div className="text-center hidden sm:block">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       Corner
                     </span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - DETAILED ANALYSIS */}
      <div className="lg:col-span-5 space-y-6">

        {/* Card 4: Detailed Geometry */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-orange-50 px-6 py-3 border-b border-orange-100">
                <h2 className="text-lg font-bold text-orange-900">Sensor Geometry</h2>
              </div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Metric</th>
                      <th className="px-4 py-3 text-right text-blue-600">Center</th>
                      <th className="px-4 py-3 text-right text-green-600">Corner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Distance (EFL)</td>
                      <td className="px-4 py-2 text-right font-mono">{inputs.efl} mm</td>
                      <td className="px-4 py-2 text-right font-mono">{inputs.efl} mm</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Image Width (Line)</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(results.center.sensorLineWidth, 3)} mm</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(results.corner.sensorLineWidth, 3)} mm</td>
                    </tr>
                     <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Half FOV</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(results.center.halfFov, 3)}°</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(results.corner.halfFov, 3)}°</td>
                    </tr>
                  </tbody>
                </table>
              </div>
        </div>

         {/* Card 5: Prefocus Contrast Chart */}
         <div className="bg-white rounded-xl shadow-lg border border-lime-300 overflow-hidden ring-1 ring-lime-300">
          <div className="bg-lime-300 px-6 py-3 border-b border-lime-400 flex justify-between items-center">
            <h2 className="text-lg font-bold text-lime-900">Prefocus Contrast Chart</h2>
            <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-lime-900 uppercase">Dist (mm)</label>
                <input 
                    type="number"
                    className="w-20 text-sm p-1 rounded border-lime-500 text-center"
                    value={inputs.testDistance}
                    onChange={(e) => handleInputChange('testDistance', e.target.value)}
                />
            </div>
          </div>
          
          <div className="divide-y divide-lime-100">
            {/* Center Section */}
            <div className="bg-lime-50/50 p-4">
               <h3 className="text-sm font-bold text-lime-800 uppercase tracking-wide mb-3 border-b border-lime-200 pb-1">Center</h3>
               <div className="grid grid-cols-2 gap-4">
                  <ResultBox label="Line Pair Width" value={fmt(results.center.objectLpWidth, 2)} unit="mm" />
                  <ResultBox label="Line Width" value={fmt(results.center.objectLineWidth, 2)} unit="mm" />
                  <ResultBox label="TVL_H" value={fmt(results.center.tvlH, 1)} />
                  <ResultBox label="TVL_V" value={fmt(results.center.tvlV, 1)} />
               </div>
            </div>

            {/* Corner Section */}
            <div className="bg-white p-4">
               <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-100 pb-1">Corner</h3>
               <div className="grid grid-cols-2 gap-4">
                  <ResultBox label="Line Pair Width" value={fmt(results.corner.objectLpWidth, 2)} unit="mm" />
                  <ResultBox label="Line Width" value={fmt(results.corner.objectLineWidth, 2)} unit="mm" />
                  <ResultBox label="TVL_H" value={fmt(results.corner.tvlH, 1)} />
                  <ResultBox label="TVL_V" value={fmt(results.corner.tvlV, 1)} />
               </div>
            </div>
          </div>
         </div>

      </div>
    </div>
  );
};

// UI Helper Components
const InputGroup: React.FC<{
  label: string;
  value: number;
  onChange: (val: string) => void;
  step?: number;
}> = ({ label, value, onChange, step = 0.1 }) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-slate-50"
    />
  </div>
);

const ResultBox: React.FC<{
  label: string;
  value: string;
  unit?: string;
}> = ({ label, value, unit }) => (
    <div className="flex justify-between items-baseline border-b border-dotted border-slate-300 pb-1">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className="font-mono text-sm font-bold text-slate-800">
            {value} <span className="text-xs text-slate-400 font-normal">{unit}</span>
        </span>
    </div>
);