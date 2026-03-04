import { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

/**
 * CoordinateInput — Dual-format coordinate input (Decimal ± / DMS string with N/S/E/W)
 *
 * Props:
 *  - label: string (e.g. "Latitud", "Longitud")
 *  - value: number (decimal with sign, e.g. 2.92 or -75.28)
 *  - onChange: (decimalValue: number) => void
 *  - type: "latitude" | "longitude"
 *  - className: optional wrapper className
 */
export default function CoordinateInput({ label, value, onChange, type = 'latitude', className = '' }) {
    const [mode, setMode] = useState('DEC'); // 'DEC' or 'DMS'

    // Formatted DMS text state (e.g., "35° 15' 22\"")
    const [dmsString, setDmsString] = useState('');
    const [hemisphere, setHemisphere] = useState(type === 'latitude' ? 'N' : 'E');

    const maxDeg = type === 'latitude' ? 90 : 180;
    const hemispheres = type === 'latitude' ? ['N', 'S'] : ['E', 'W'];

    // ─── Decimal → DMS text sync ───
    const syncDmsFromDecimal = useCallback((dec) => {
        if (dec == null || isNaN(dec)) {
            setDmsString('');
            return;
        }
        const abs = Math.abs(dec);
        const d = Math.floor(abs);
        const mFloat = (abs - d) * 60;
        const m = Math.floor(mFloat);
        const s = ((mFloat - m) * 60).toFixed(2);

        // Remove unnecessary trailing zeros in seconds if it's a whole number
        const formattedS = s.endsWith('.00') ? Math.round(s) : s;

        setDmsString(`${d}° ${m}' ${formattedS}"`);

        if (type === 'latitude') {
            setHemisphere(dec >= 0 ? 'N' : 'S');
        } else {
            setHemisphere(dec >= 0 ? 'E' : 'W');
        }
    }, [type]);

    useEffect(() => {
        syncDmsFromDecimal(value);
    }, [value, syncDmsFromDecimal]);

    // ─── Extract numbers from DMS string manually ───
    const parseDmsString = (str) => {
        // Extract all numbers (integers or decimals) from the string regardless of format
        const matches = str.match(/\d+(\.\d+)?/g);
        if (!matches) return { d: 0, m: 0, s: 0 };
        return {
            d: matches[0] ? parseFloat(matches[0]) : 0,
            m: matches[1] ? parseFloat(matches[1]) : 0,
            s: matches[2] ? parseFloat(matches[2]) : 0,
        };
    };

    const dmsToDecimal = (d, m, s, hemi) => {
        const abs = d + m / 60 + s / 3600;
        const sign = (hemi === 'S' || hemi === 'W') ? -1 : 1;
        return parseFloat((sign * abs).toFixed(6));
    };

    // When the user blur from the DMS text input, compute the decimal value to save
    const commitDmsChange = (hemiOverride = null) => {
        const currentHemi = hemiOverride || hemisphere;
        if (!dmsString.trim()) {
            onChange(null);
            return;
        }

        const { d, m, s } = parseDmsString(dmsString);

        // Clamp parts to valid ranges when committing memory
        const clampedD = Math.max(0, Math.min(maxDeg, d));
        const clampedM = clampedD >= maxDeg ? 0 : Math.max(0, Math.min(59, m));
        const clampedS = clampedD >= maxDeg ? 0 : Math.max(0, Math.min(59.99, s));

        const decimal = dmsToDecimal(clampedD, clampedM, clampedS, currentHemi);
        onChange(decimal);
    };

    const toggleHemisphere = () => {
        const newHemi = hemispheres[0] === hemisphere ? hemispheres[1] : hemispheres[0];
        setHemisphere(newHemi);
        commitDmsChange(newHemi);
    };

    const handleDecimalChange = (e) => {
        const raw = e.target.value;
        if (raw === '' || raw === '-') {
            // Let the user type a minus sign before typing numbers in React
            onChange(raw === '-' ? -0 : null);
            return;
        }
        let dec = parseFloat(raw);
        if (isNaN(dec)) return;

        // Clamp to allowed map extent
        dec = Math.max(-maxDeg, Math.min(maxDeg, dec));
        onChange(dec);
    };

    const inputBase = 'border border-gray-300 rounded px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all';

    return (
        <div className={className}>
            {/* Label + Mode Toggle */}
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <MapPin size={10} />
                    {label}
                </label>
                <div className="flex bg-gray-100 rounded overflow-hidden border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setMode('DEC')}
                        className={`px-2 py-0.5 text-[9px] font-bold transition-colors ${mode === 'DEC' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                        title="Formato de Grados Decimales (Ej: -35.24)"
                    >
                        ±DEC
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('DMS')}
                        className={`px-2 py-0.5 text-[9px] font-bold transition-colors ${mode === 'DMS' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                        title="Formato de Grados, Minutos, Segundos en TXT como CROPWAT"
                    >
                        DMS
                    </button>
                </div>
            </div>

            {/* Decimal Mode */}
            {mode === 'DEC' && (
                <div className="relative flex flex-col w-full">
                    <div className="relative w-full">
                        <input
                            type="number"
                            step="0.0001"
                            value={value !== null && value !== undefined && !Object.is(value, -0) ? value : (Object.is(value, -0) ? '-' : '')}
                            onChange={handleDecimalChange}
                            className={`w-full ${inputBase} pr-16`}
                            placeholder={type === 'latitude' ? 'Ej: 4.5 (+N / -S)' : 'Ej: -74.1 (+E / -W)'}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none bg-white px-1">
                            {value != null && !isNaN(value) && value !== 0
                                ? (type === 'latitude'
                                    ? (value > 0 ? '° Norte (+)' : '° Sur (-)')
                                    : (value > 0 ? '° Este (+)' : '° Oeste (-)'))
                                : ''}
                        </span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 font-mono text-right w-full">
                        Signo + o - admitido directamente
                    </p>
                </div>
            )}

            {/* CROPWAT Format */}
            {mode === 'DMS' && (
                <div className="flex items-center gap-1">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxDeg}
                            value={value != null && !isNaN(value) ? Math.abs(value).toFixed(2) : ''}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                    onChange(null);
                                    return;
                                }
                                let dec = parseFloat(raw);
                                if (isNaN(dec)) return;
                                dec = Math.max(0, Math.min(maxDeg, dec));
                                const sign = (hemisphere === 'S' || hemisphere === 'W') ? -1 : 1;
                                onChange(parseFloat((sign * dec).toFixed(6)));
                            }}
                            className={`w-full ${inputBase} pr-1`}
                            placeholder="Ej: 24.82"
                            title="Valor absoluto coordinado tal como en CROPWAT"
                        />
                    </div>

                    <select
                        value={hemisphere}
                        onChange={(e) => {
                            const newHemi = e.target.value;
                            setHemisphere(newHemi);
                            if (value != null && !isNaN(value)) {
                                const abs = Math.abs(value);
                                const sign = (newHemi === 'S' || newHemi === 'W') ? -1 : 1;
                                onChange(parseFloat((sign * abs).toFixed(6)));
                            }
                        }}
                        className="px-1 py-1.5 rounded text-xs font-black border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        title="Hemisferio"
                    >
                        <option value={hemispheres[0]}>°{hemispheres[0]}</option>
                        <option value={hemispheres[1]}>°{hemispheres[1]}</option>
                    </select>
                </div>
            )}

            {/* Live preview in DMS mode — shows the decimal equivalent */}
            {mode === 'DMS' && (
                <p className="text-[9px] text-gray-400 mt-1 font-mono text-right">
                    = {value != null && !isNaN(value) ? value.toFixed(4) : '—'}°
                </p>
            )}
        </div>
    );
}
