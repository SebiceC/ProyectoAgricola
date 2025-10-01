import React, { useState, useEffect, useCallback, useMemo } from 'react';

// material-ui
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// project imports
import MainCard from 'components/MainCard';
import CustomAlertModal from '../../components/CustomAlertModal';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Configuración por defecto
const defaultConfig = {
  etoCalculationMethod: 'full_climate_data',
  temperatureMode: 'min_max',
  humidityUnit: 'relative_percent',
  windSpeedUnit: 'meters_per_second',
  sunshineUnit: 'hours',
  etoUnit: 'mm_per_day'
};

export default function Eto() {
  const [config, setConfig] = useState(defaultConfig);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('penman-monteith');
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  
  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('etoCalculatorConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.climateEto) {
          setConfig(parsedConfig.climateEto);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, []);

  // Cargar métodos disponibles desde la API
  useEffect(() => {
    const fetchAvailableMethods = async () => {
      try {
        setIsLoadingMethods(true);
        const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}api/available-methods/`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `token ${localStorage.getItem('token')}`,
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableMethods(data.methods || []);
        } else {
          console.error('Error fetching methods:', response.statusText);
          // Fallback a métodos por defecto si la API falla
          setAvailableMethods([
            { key: "penman-monteith", name: "FAO Penman-Monteith" },
            { key: "hargreaves", name: "Hargreaves-Samani (1985)" }
          ]);
        }
      } catch (error) {
        console.error('Error fetching methods:', error);
        // Fallback a métodos por defecto
        setAvailableMethods([
          { key: "penman-monteith", name: "FAO Penman-Monteith" },
          { key: "hargreaves", name: "Hargreaves-Samani (1985)" }
        ]);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    fetchAvailableMethods();
  }, []);

  // Valores iniciales basados en configuración
  const getInitialClimateData = useCallback(() => {
    return months.map((month) => ({
      month,
      // Campos de temperatura según configuración
      ...(config.temperatureMode === 'min_max' 
        ? { tempMin: '', tempMax: '' }
        : { tempAvg: '' }
      ),
      // Campos según método de cálculo
      ...(config.etoCalculationMethod === 'full_climate_data' 
        ? { 
            humidity: '', 
            wind: '', 
            sunshine: '' 
          }
        : {}
      ),
      radiation: null,
      eto: null
    }));
  }, [config.temperatureMode, config.etoCalculationMethod]);

  const [stationInfo, setStationInfo] = useState({
    country: '',
    station: '24570',
    altitude: '',
    latitude: '24.82',
    latDirection: 'N',
    longitude: '109.00',
    longDirection: 'W'
  });

  const [inputClimateData, setInputClimateData] = useState(() => getInitialClimateData());
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Valor fuera de rango");
  const [alertTitle, setAlertTitle] = useState("Error de Validación");

  // Actualizar datos cuando cambie la configuración
  useEffect(() => {
    setInputClimateData(getInitialClimateData());
  }, [getInitialClimateData]);

  // Reglas de validación dinámicas basadas en configuración
  const getValidationRules = useMemo(() => {
    const baseRules = {
      country: { max: 20, message: "País: máximo 20 caracteres" },
      station: { max: 20, message: "Estación: máximo 20 caracteres" },
      altitude: { min: -200, max: 9999, message: "Altitud: debe estar entre -200 y 9999" },
      latitude: { min: 1, max: 90, message: "Latitud: debe estar entre 1 y 90" },
      longitude: { min: 1, max: 180, message: "Longitud: debe estar entre 1 y 180" }
    };

    // Validaciones de temperatura según modo
    if (config.temperatureMode === 'min_max') {
      baseRules.tempMin = { min: -80, max: 40, message: "Temperatura mínima: debe estar entre -80°C y 40°C" };
      baseRules.tempMax = { min: -40, max: 60, message: "Temperatura máxima: debe estar entre -40°C y 60°C" };
    } else {
      baseRules.tempAvg = { min: -60, max: 50, message: "Temperatura media: debe estar entre -60°C y 50°C" };
    }

    // Validaciones adicionales para método completo
    if (config.etoCalculationMethod === 'full_climate_data') {
      // Humedad según unidad
      if (config.humidityUnit === 'relative_percent') {
        baseRules.humidity = { min: 1, max: 99, message: "Humedad: debe estar entre 1% y 99%" };
      } else {
        baseRules.humidity = { min: 0.1, max: 5.0, message: "Presión de vapor: debe estar entre 0.1 y 5.0 kPa" };
      }

      // Viento según unidad
      if (config.windSpeedUnit === 'meters_per_second') {
        baseRules.wind = { min: 0.1, max: 15, message: "Viento: debe estar entre 0.1 y 15 m/s" };
      } else {
        baseRules.wind = { min: 8.6, max: 1296, message: "Viento: debe estar entre 8.6 y 1296 km/día" };
      }

      // Insolación según unidad
      if (config.sunshineUnit === 'hours') {
        baseRules.sunshine = { min: 0, max: 24, message: "Insolación: debe estar entre 0 y 24 horas" };
      } else if (config.sunshineUnit === 'percentage_day_duration') {
        baseRules.sunshine = { min: 0, max: 100, message: "Insolación: debe estar entre 0 y 100%" };
      } else {
        baseRules.sunshine = { min: 0, max: 1, message: "Insolación: debe estar entre 0 y 1" };
      }
    }

    return baseRules;
  }, [config]);

  // Obtener etiquetas y unidades según configuración
  const getFieldLabels = useMemo(() => {
    const labels = {};
    
    // Temperatura
    if (config.temperatureMode === 'min_max') {
      labels.tempMin = 'Temp Min\n°C';
      labels.tempMax = 'Temp Max\n°C';
    } else {
      labels.tempAvg = 'Temp Media\n°C';
    }

    // Humedad
    if (config.humidityUnit === 'relative_percent') {
      labels.humidity = 'Humedad\n%';
    } else {
      labels.humidity = 'Presión Vapor\nkPa';
    }

    // Viento
    if (config.windSpeedUnit === 'meters_per_second') {
      labels.wind = 'Viento\nm/s';
    } else {
      labels.wind = 'Viento\nkm/día';
    }

    // Insolación
    if (config.sunshineUnit === 'hours') {
      labels.sunshine = 'Insolación\nhoras';
    } else if (config.sunshineUnit === 'percentage_day_duration') {
      labels.sunshine = 'Insolación\n%';
    } else {
      labels.sunshine = 'Insolación\nfracción';
    }

    // ETo
    if (config.etoUnit === 'mm_per_day') {
      labels.eto = 'ETo\nmm/día';
    } else {
      labels.eto = 'ETo\nmm/período';
    }

    labels.radiation = 'Rad\nMJ/m²/día';

    return labels;
  }, [config]);

  // Función para mostrar alerta
  const showAlert = useCallback((message, title = "Error de Validación") => {
    setAlertMessage(message);
    setAlertTitle(title);
    setAlertOpen(true);
  }, []);

  // Cierra el modal de alerta
  const handleAlertClose = useCallback(() => {
    setAlertOpen(false);
  }, []);

  // Función de validación genérica
  const validateValue = useCallback((value, rule, fieldName) => {
    const validationRules = getValidationRules;
    
    if (rule.max && typeof value === 'string' && !rule.min) {
      if (value.length > rule.max) {
        showAlert(rule.message);
        return false;
      }
    } 
    else if ((rule.min !== undefined || rule.max !== undefined) && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      if (numValue < rule.min || numValue > rule.max) {
        showAlert(rule.message);
        return false;
      }
    }
    return true;
  }, [getValidationRules, showAlert]);

  // Actualizar datos de la estación con validación
  const updateStationInfo = useCallback((field, value) => {
    const validationRules = getValidationRules;
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field], field)) {
        return;
      }
    }

    setStationInfo(prev => ({ ...prev, [field]: value }));
  }, [validateValue, getValidationRules]);

  // Actualizar un valor para un mes específico con validación
  const updateMonthData = useCallback((monthIndex, field, value) => {
    const validationRules = getValidationRules;
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field], field)) {
        return;
      }
    }

    setInputClimateData(prev => {
      const newData = [...prev];
      newData[monthIndex] = { ...newData[monthIndex], [field]: value };
      return newData;
    });
  }, [validateValue, getValidationRules]);

  // Función para preparar datos para la API
  const prepareApiData = useCallback((monthData, monthIndex) => {
    const year = new Date().getFullYear();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Último día del mes

    // Convertir datos según configuración
    const apiData = {
      latitude: parseFloat(stationInfo.latDirection === 'S' ? -stationInfo.latitude : stationInfo.latitude),
      longitude: parseFloat(stationInfo.longDirection === 'W' ? -stationInfo.longitude : stationInfo.longitude),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      method: selectedMethod,
      altitude: parseFloat(stationInfo.altitude) || 0
    };

    // Agregar datos climáticos según configuración
    if (config.temperatureMode === 'min_max') {
      apiData.temp_min = parseFloat(monthData.tempMin);
      apiData.temp_max = parseFloat(monthData.tempMax);
    } else {
      apiData.temp_avg = parseFloat(monthData.tempAvg);
    }

    // Agregar datos adicionales si es método completo
    if (config.etoCalculationMethod === 'full_climate_data') {
      // Humedad
      if (config.humidityUnit === 'relative_percent') {
        apiData.humidity_percent = parseFloat(monthData.humidity);
      } else {
        apiData.vapor_pressure = parseFloat(monthData.humidity);
      }

      // Viento
      if (config.windSpeedUnit === 'meters_per_second') {
        apiData.wind_speed = parseFloat(monthData.wind);
      } else {
        apiData.wind_speed = parseFloat(monthData.wind) / 86.4; // Convertir km/día a m/s
      }

      // Insolación
      let sunshineHours = parseFloat(monthData.sunshine);
      if (config.sunshineUnit === 'percentage_day_duration') {
        sunshineHours = (sunshineHours / 100) * 12; // Convertir % a horas
      } else if (config.sunshineUnit === 'fraction_day_duration') {
        sunshineHours = sunshineHours * 12; // Convertir fracción a horas
      }
      apiData.sunshine_hours = sunshineHours;
    }

    return apiData;
  }, [stationInfo, selectedMethod, config]);

  // Función para verificar si los datos están completos para el cálculo
  const isDataComplete = useCallback((data) => {
    if (config.temperatureMode === 'min_max') {
      if (!data.tempMin || !data.tempMax) return false;
    } else {
      if (!data.tempAvg) return false;
    }

    if (config.etoCalculationMethod === 'full_climate_data') {
      if (!data.humidity || !data.wind || !data.sunshine) return false;
    }

    return true;
  }, [config]);

  // Función para calcular ETo usando la API
  const calculateEtoForMonth = useCallback(async (monthData, monthIndex) => {
    if (!isDataComplete(monthData)) {
      return { radiation: null, eto: null };
    }

    try {
      const apiData = prepareApiData(monthData, monthIndex);
      const response = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}api/calculate-eto/`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          radiation: result.radiation || null,
          eto: result.eto || null
        };
      } else {
        console.error('API Error:', response.statusText);
        return { radiation: null, eto: null };
      }
    } catch (error) {
      console.error('Error calculating ETo:', error);
      return { radiation: null, eto: null };
    }
  }, [isDataComplete, prepareApiData]);

  // Función para calcular todos los meses
  const calculateAllMonths = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      const promises = inputClimateData.map((data, index) => 
        calculateEtoForMonth(data, index)
      );
      
      const results = await Promise.all(promises);
      
      setInputClimateData(prev => 
        prev.map((data, index) => ({
          ...data,
          radiation: results[index].radiation,
          eto: results[index].eto
        }))
      );
    } catch (error) {
      setCalculationError('Error al calcular ETo. Por favor, intente nuevamente.');
      console.error('Error calculating all months:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [inputClimateData, calculateEtoForMonth]);

  // Usar climateData directamente desde inputClimateData ya que no calculamos localmente
  const climateData = inputClimateData;

  // Calcular promedios
  const calculateAverages = useCallback(() => {
    const validMonths = climateData.filter(data => 
      (config.temperatureMode === 'min_max' ? (data.tempMin !== '' || data.tempMax !== '') : data.tempAvg !== '') ||
      data.humidity !== '' || data.wind !== '' || data.sunshine !== ''
    );
    
    if (validMonths.length === 0) return {};
    
    const averages = {};
    
    if (config.temperatureMode === 'min_max') {
      averages.tempMin = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.tempMin) || 0), 0) / validMonths.length).toFixed(1));
      averages.tempMax = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.tempMax) || 0), 0) / validMonths.length).toFixed(1));
    } else {
      averages.tempAvg = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.tempAvg) || 0), 0) / validMonths.length).toFixed(1));
    }

    if (config.etoCalculationMethod === 'full_climate_data') {
      averages.humidity = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.humidity) || 0), 0) / validMonths.length).toFixed(1));
      averages.wind = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.wind) || 0), 0) / validMonths.length).toFixed(1));
      averages.sunshine = parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.sunshine) || 0), 0) / validMonths.length).toFixed(1));
    }

    const validRadiationMonths = validMonths.filter(data => data.radiation !== null);
    const validEtoMonths = validMonths.filter(data => data.eto !== null);

    if (validRadiationMonths.length > 0) {
      averages.radiation = parseFloat((validRadiationMonths.reduce((sum, data) => sum + (data.radiation || 0), 0) / validRadiationMonths.length).toFixed(1));
    }
    
    if (validEtoMonths.length > 0) {
      averages.eto = parseFloat((validEtoMonths.reduce((sum, data) => sum + (data.eto || 0), 0) / validEtoMonths.length).toFixed(1));
    }

    return averages;
  }, [climateData, config]);

  const averages = useMemo(() => calculateAverages(), [calculateAverages]);

  // Cargar datos de ejemplo adaptados a la configuración
  const loadExampleData = useCallback(() => {
    const baseExampleData = [
      { month: 'Enero', tempMin: '12.8', tempMax: '27.0', tempAvg: '19.9', humidity: '70', wind: '2.4', sunshine: '6.0' },
      { month: 'Febrero', tempMin: '13.5', tempMax: '25.0', tempAvg: '19.3', humidity: '35', wind: '2.5', sunshine: '7.5' },
      { month: 'Marzo', tempMin: '15.1', tempMax: '22.0', tempAvg: '18.6', humidity: '45', wind: '2.6', sunshine: '6.5' },
      { month: 'Abril', tempMin: '15.9', tempMax: '19.0', tempAvg: '17.5', humidity: '85', wind: '2.3', sunshine: '5.5' },
      { month: 'Mayo', tempMin: '18.2', tempMax: '25.0', tempAvg: '21.6', humidity: '95', wind: '2.4', sunshine: '6.0' },
      { month: 'Junio', tempMin: '21.3', tempMax: '22.0', tempAvg: '21.7', humidity: '85', wind: '2.5', sunshine: '7.0' },
      { month: 'Julio', tempMin: '23.9', tempMax: '25.0', tempAvg: '24.5', humidity: '65', wind: '2.8', sunshine: '7.2' },
      { month: 'Agosto', tempMin: '23.8', tempMax: '25.0', tempAvg: '24.4', humidity: '72', wind: '2.6', sunshine: '7.3' },
      { month: 'Septiembre', tempMin: '23.6', tempMax: '25.0', tempAvg: '24.3', humidity: '73', wind: '2.5', sunshine: '6.8' },
      { month: 'Octubre', tempMin: '20.9', tempMax: '25.0', tempAvg: '23.0', humidity: '69', wind: '2.3', sunshine: '5.6' },
      { month: 'Noviembre', tempMin: '16.5', tempMax: '18.0', tempAvg: '17.3', humidity: '65', wind: '2.2', sunshine: '5.9' },
      { month: 'Diciembre', tempMin: '13.4', tempMax: '19.0', tempAvg: '16.2', humidity: '85', wind: '2.0', sunshine: '6.8' }
    ];
    
    // Adaptar datos según configuración
    const adaptedData = baseExampleData.map((item, i) => {
      const newItem = {
        ...inputClimateData[i],
        month: item.month
      };

      // Temperatura según modo
      if (config.temperatureMode === 'min_max') {
        newItem.tempMin = item.tempMin;
        newItem.tempMax = item.tempMax;
      } else {
        newItem.tempAvg = item.tempAvg;
      }

      // Datos adicionales para método completo
      if (config.etoCalculationMethod === 'full_climate_data') {
        // Humedad según unidad
        if (config.humidityUnit === 'relative_percent') {
          newItem.humidity = item.humidity;
        } else {
          // Convertir HR% a presión de vapor (estimación)
          const temp = parseFloat(item.tempAvg);
          const es = 0.6108 * Math.exp(17.27 * temp / (temp + 237.3));
          newItem.humidity = (es * parseFloat(item.humidity) / 100).toFixed(2);
        }

        // Viento según unidad
        if (config.windSpeedUnit === 'meters_per_second') {
          newItem.wind = item.wind;
        } else {
          // Convertir m/s a km/día
          newItem.wind = (parseFloat(item.wind) * 86.4).toFixed(1);
        }

        // Insolación según unidad
        if (config.sunshineUnit === 'hours') {
          newItem.sunshine = item.sunshine;
        } else if (config.sunshineUnit === 'percentage_day_duration') {
          // Convertir horas a porcentaje (asumiendo 12 horas de día)
          newItem.sunshine = ((parseFloat(item.sunshine) / 12) * 100).toFixed(1);
        } else {
          // Convertir horas a fracción
          newItem.sunshine = (parseFloat(item.sunshine) / 12).toFixed(2);
        }
      }

      return newItem;
    });
    
    setInputClimateData(adaptedData);
    setStationInfo(prev => ({ ...prev, altitude: '100' }));
  }, [inputClimateData, config]);

  // Limpiar todos los datos
  const clearAllData = useCallback(() => {
    setInputClimateData(getInitialClimateData());
    setStationInfo({
      country: '',
      station: '',
      altitude: '',
      latitude: '',
      latDirection: 'N',
      longitude: '',
      longDirection: 'W'
    });
  }, [getInitialClimateData]);

  // Renderizar campos de temperatura
  const renderTemperatureFields = (row, index) => {
    if (config.temperatureMode === 'min_max') {
      return (
        <>
          <TableCell align="center">
            <TextField
              size="small"
              variant="standard"
              value={row.tempMin || ''}
              onChange={(e) => updateMonthData(index, 'tempMin', e.target.value)}
              inputProps={{ 
                style: { textAlign: 'center' },
                type: 'number'
              }}
            />
          </TableCell>
          <TableCell align="center">
            <TextField
              size="small"
              variant="standard"
              value={row.tempMax || ''}
              onChange={(e) => updateMonthData(index, 'tempMax', e.target.value)}
              inputProps={{ 
                style: { textAlign: 'center' },
                type: 'number'
              }}
            />
          </TableCell>
        </>
      );
    } else {
      return (
        <TableCell align="center">
          <TextField
            size="small"
            variant="standard"
            value={row.tempAvg || ''}
            onChange={(e) => updateMonthData(index, 'tempAvg', e.target.value)}
            inputProps={{ 
              style: { textAlign: 'center' },
              type: 'number'
            }}
          />
        </TableCell>
      );
    }
  };

  // Renderizar headers de temperatura
  const renderTemperatureHeaders = () => {
    if (config.temperatureMode === 'min_max') {
      return (
        <>
          <TableCell align="center">{getFieldLabels.tempMin}</TableCell>
          <TableCell align="center">{getFieldLabels.tempMax}</TableCell>
        </>
      );
    } else {
      return (
        <TableCell align="center">{getFieldLabels.tempAvg}</TableCell>
      );
    }
  };

  // Renderizar campos adicionales para método completo
  const renderAdditionalFields = (row, index) => {
    if (config.etoCalculationMethod === 'full_climate_data') {
      return (
        <>
          <TableCell align="center">
            <TextField
              size="small"
              variant="standard"
              value={row.humidity || ''}
              onChange={(e) => updateMonthData(index, 'humidity', e.target.value)}
              inputProps={{ 
                style: { textAlign: 'center' },
                type: 'number',
                step: config.humidityUnit === 'vapor_pressure_kpa' ? '0.1' : '1'
              }}
            />
          </TableCell>
          <TableCell align="center">
            <TextField
              size="small"
              variant="standard"
              value={row.wind || ''}
              onChange={(e) => updateMonthData(index, 'wind', e.target.value)}
              inputProps={{ 
                style: { textAlign: 'center' },
                type: 'number',
                step: '0.1'
              }}
            />
          </TableCell>
          <TableCell align="center">
            <TextField
              size="small"
              variant="standard"
              value={row.sunshine || ''}
              onChange={(e) => updateMonthData(index, 'sunshine', e.target.value)}
              inputProps={{ 
                style: { textAlign: 'center' },
                type: 'number',
                step: config.sunshineUnit === 'fraction_day_duration' ? '0.01' : '0.1'
              }}
            />
          </TableCell>
        </>
      );
    }
    return null;
  };

  // Renderizar headers adicionales
  const renderAdditionalHeaders = () => {
    if (config.etoCalculationMethod === 'full_climate_data') {
      return (
        <>
          <TableCell align="center">{getFieldLabels.humidity}</TableCell>
          <TableCell align="center">{getFieldLabels.wind}</TableCell>
          <TableCell align="center">{getFieldLabels.sunshine}</TableCell>
        </>
      );
    }
    return null;
  };

  // Renderizar promedios de temperatura
  const renderTemperatureAverages = () => {
    if (config.temperatureMode === 'min_max') {
      return (
        <>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
            {!isNaN(averages.tempMin) ? averages.tempMin : ''}
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
            {!isNaN(averages.tempMax) ? averages.tempMax : ''}
          </TableCell>
        </>
      );
    } else {
      return (
        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
          {!isNaN(averages.tempAvg) ? averages.tempAvg : ''}
        </TableCell>
      );
    }
  };

  // Renderizar promedios adicionales
  const renderAdditionalAverages = () => {
    if (config.etoCalculationMethod === 'full_climate_data') {
      return (
        <>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
            {!isNaN(averages.humidity) ? averages.humidity : ''}
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
            {!isNaN(averages.wind) ? averages.wind : ''}
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
            {!isNaN(averages.sunshine) ? averages.sunshine : ''}
          </TableCell>
        </>
      );
    }
    return null;
  };

  return (
    <MainCard 
      title={
        <Box display="flex" alignItems="center" gap={2}>
          <span>Clima/ETo</span>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Método de Cálculo</InputLabel>
            <Select
              value={selectedMethod}
              label="Método de Cálculo"
              onChange={(e) => setSelectedMethod(e.target.value)}
              disabled={isLoadingMethods}
            >
              {isLoadingMethods ? (
                <MenuItem disabled>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Cargando...
                </MenuItem>
              ) : (
                availableMethods.map((method) => (
                  <MenuItem key={method.key} value={method.key}>
                    {method.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      }
    >
      <Grid container spacing={2}>
        {/* Error de cálculo */}
        {calculationError && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setCalculationError(null)}>
              {calculationError}
            </Alert>
          </Grid>
        )}

        {/* Información de la estación */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="País"
                  value={stationInfo.country}
                  onChange={(e) => updateStationInfo('country', e.target.value)}
                  inputProps={{ maxLength: 20 }}
                  helperText={`${stationInfo.country.length}/20`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Estación"
                  value={stationInfo.station}
                  onChange={(e) => updateStationInfo('station', e.target.value)}
                  inputProps={{ maxLength: 20 }}
                  helperText={`${stationInfo.station.length}/20`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Altitud"
                  value={stationInfo.altitude}
                  onChange={(e) => updateStationInfo('altitude', e.target.value)}
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">m.</InputAdornment>,
                  }}
                  helperText="Entre -200 y 9999"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box display="flex" alignItems="center">
                  <TextField
                    fullWidth
                    label="Latitud"
                    value={stationInfo.latitude}
                    onChange={(e) => updateStationInfo('latitude', e.target.value)}
                    type="number"
                    helperText="Entre 1 y 90"
                  />
                  <FormControl sx={{ minWidth: 60, ml: 1 }}>
                    <Select
                      value={stationInfo.latDirection}
                      onChange={(e) => setStationInfo(prev => ({ ...prev, latDirection: e.target.value }))}
                    >
                      <MenuItem value="N">N</MenuItem>
                      <MenuItem value="S">S</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box display="flex" alignItems="center">
                  <TextField
                    fullWidth
                    label="Longitud"
                    value={stationInfo.longitude}
                    onChange={(e) => updateStationInfo('longitude', e.target.value)}
                    type="number"
                    helperText="Entre 1 y 180"
                  />
                  <FormControl sx={{ minWidth: 60, ml: 1 }}>
                    <Select
                      value={stationInfo.longDirection}
                      onChange={(e) => setStationInfo(prev => ({ ...prev, longDirection: e.target.value }))}
                    >
                      <MenuItem value="E">E</MenuItem>
                      <MenuItem value="W">W</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabla de datos climáticos */}
        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={3}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  {renderTemperatureHeaders()}
                  {renderAdditionalHeaders()}
                  {config.etoCalculationMethod === 'full_climate_data' && (
                    <TableCell align="center">{getFieldLabels.radiation}</TableCell>
                  )}
                  <TableCell align="center">{getFieldLabels.eto}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {climateData.map((row, index) => (
                  <TableRow key={row.month}>
                    <TableCell component="th" scope="row">
                      {row.month}
                    </TableCell>
                    {renderTemperatureFields(row, index)}
                    {renderAdditionalFields(row, index)}
                    {config.etoCalculationMethod === 'full_climate_data' && (
                      <TableCell align="center" sx={{ backgroundColor: '#FFFFC0' }}>
                        {row.radiation !== null ? row.radiation : ''}
                      </TableCell>
                    )}
                    <TableCell align="center" sx={{ backgroundColor: '#FFFFC0' }}>
                      {row.eto !== null ? row.eto : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Promedio
                  </TableCell>
                  {renderTemperatureAverages()}
                  {renderAdditionalAverages()}
                  {config.etoCalculationMethod === 'full_climate_data' && (
                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#FFFFC0' }}>
                      {!isNaN(averages.radiation) ? averages.radiation : ''}
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#FFFFC0' }}>
                    {!isNaN(averages.eto) ? averages.eto : ''}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Botones de acción */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item>
              <Button variant="contained" color="primary" onClick={loadExampleData}>
                Cargar Ejemplo
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" color="secondary" onClick={clearAllData}>
                Limpiar Datos
              </Button>
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                color="success" 
                onClick={calculateAllMonths}
                disabled={isCalculating || !stationInfo.latitude || !stationInfo.longitude}
                startIcon={isCalculating ? <CircularProgress size={16} /> : null}
              >
                {isCalculating ? 'Calculando...' : 'Calcular ETo'}
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Información dinámica basada en configuración */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Método seleccionado:</strong> {availableMethods.find(m => m.key === selectedMethod)?.name || selectedMethod}
            <br />
            <strong>Configuración:</strong> {config.etoCalculationMethod === 'full_climate_data' 
              ? 'Datos climáticos completos requeridos' 
              : 'Solo temperatura requerida'}
            <br />
            <strong>Modo de temperatura:</strong> {config.temperatureMode === 'min_max' 
              ? 'Temperaturas mínima y máxima' 
              : 'Temperatura media'}
            <br />
            <strong>Unidades:</strong> 
            {config.etoCalculationMethod === 'full_climate_data' && (
              <>
                {' '}Humedad: {config.humidityUnit === 'relative_percent' ? 'Porcentaje (%)' : 'Presión de vapor (kPa)'}, 
                Viento: {config.windSpeedUnit === 'meters_per_second' ? 'm/s' : 'km/día'}, 
                Insolación: {config.sunshineUnit === 'hours' ? 'horas' : 
                  config.sunshineUnit === 'percentage_day_duration' ? 'porcentaje' : 'fracción'},
              </>
            )}
            {' '}ETo: {config.etoUnit === 'mm_per_day' ? 'mm/día' : 'mm/período'}
            <br />
            Las celdas amarillas muestran los valores calculados por la API. 
            Para obtener resultados, complete los datos y haga clic en "Calcular ETo".
          </Typography>
        </Grid>

        {/* Modal de Alerta */}
        <CustomAlertModal 
          open={alertOpen}
          handleClose={handleAlertClose}
          message={alertMessage}
          title={alertTitle}
        />
      </Grid>
    </MainCard>
  );
}