import React from 'react';
import { LensCalculator } from './components/LensCalculator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Sentinel · Eagle · Mockingbird
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Optical Parameter & Contrast Chart Calculator
          </p>
        </header>

        <main>
          <LensCalculator />
        </main>
        
        <footer className="text-center text-slate-400 text-sm mt-12">
          LensCalc Pro &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default App;