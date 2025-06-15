import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

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

  // Estados adicionales para el control de flujo
  const [calculationMethod, setCalculationMethod] = useState(''); // 'formula' o 'api'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);

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
    station: '',
    altitude: '',
    latitude: '',
    latDirection: 'N',
    longitude: '',
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

  // Verificar si los datos básicos están completos
  const isBasicDataComplete = useMemo(() => {
    return (
      stationInfo.country !== '' &&
      stationInfo.station !== '' &&
      stationInfo.altitude !== '' &&
      stationInfo.latitude !== '' &&
      stationInfo.longitude !== ''
    );
  }, [stationInfo]);

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
  }, [showAlert]);

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

  // Función para procesar datos de API y convertir a promedios mensuales
  const processApiData = useCallback((apiResponse) => {
    const weatherData = apiResponse.weather_data;
    const etoData = apiResponse.evapotranspiration;
    
    // Agrupar datos por mes
    const monthlyData = {};
    
    // Inicializar estructura para cada mes
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = {
        tempMin: [],
        tempMax: [],
        humidity: [],
        wind: [],
        radiation: [],
        eto: [],
        count: 0
      };
    }
    
    // Procesar cada fecha
    Object.keys(etoData).forEach(dateKey => {
      const date = new Date(dateKey.slice(0,4) + '-' + dateKey.slice(4,6) + '-' + dateKey.slice(6,8));
      const month = date.getMonth();
      
      if (weatherData.T2M_MIN[dateKey]) {
        monthlyData[month].tempMin.push(weatherData.T2M_MIN[dateKey]);
      }
      if (weatherData.T2M_MAX[dateKey]) {
        monthlyData[month].tempMax.push(weatherData.T2M_MAX[dateKey]);
      }
      if (weatherData.RH2M[dateKey]) {
        monthlyData[month].humidity.push(weatherData.RH2M[dateKey]);
      }
      if (weatherData.WS2M[dateKey]) {
        monthlyData[month].wind.push(weatherData.WS2M[dateKey]);
      }
      if (weatherData.ALLSKY_SFC_SW_DWN[dateKey]) {
        monthlyData[month].radiation.push(weatherData.ALLSKY_SFC_SW_DWN[dateKey]);
      }
      if (etoData[dateKey]) {
        monthlyData[month].eto.push(etoData[dateKey]);
      }
      
      monthlyData[month].count++;
    });
    
    // Calcular promedios y actualizar datos climáticos
    const newClimateData = months.map((monthName, index) => {
      const monthData = monthlyData[index];
      
      if (monthData.count === 0) {
        return {
          month: monthName,
          tempMin: '',
          tempMax: '',
          humidity: '',
          wind: '',
          sunshine: '',
          radiation: null,
          eto: null
        };
      }
      
      const calculateAverage = (arr) => {
        if (arr.length === 0) return '';
        return (arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(1);
      };
      
      return {
        month: monthName,
        tempMin: calculateAverage(monthData.tempMin),
        tempMax: calculateAverage(monthData.tempMax),
        humidity: calculateAverage(monthData.humidity),
        wind: calculateAverage(monthData.wind),
        sunshine: '', // No disponible en API
        radiation: parseFloat(calculateAverage(monthData.radiation)) || null,
        eto: parseFloat(calculateAverage(monthData.eto)) || null
      };
    });
    
    setInputClimateData(newClimateData);
  }, []);

  // Función para llamar a la API
  const fetchApiData = useCallback(async () => {
    if (!startDate || !endDate) {
      showAlert("Debe especificar fecha de inicio y fin", "Error");
      return;
    }
    
    setLoading(true);
    
    try {
      const lat = parseFloat(stationInfo.latitude) * (stationInfo.latDirection === 'S' ? -1 : 1);
      const lon = parseFloat(stationInfo.longitude) * (stationInfo.longDirection === 'W' ? -1 : 1);
      
      const response = await axios.get(
        `${import.meta.env.VITE_URL_BACKEND_API}ubicaciones/api/evapotranspiracion/get_evapotranspiration/`,
        {
          params: {
            lat: lat,
            lon: lon,
            start: startDate.replace(/-/g, ''),
            end: endDate.replace(/-/g, '')
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        processApiData(response.data);
        setShowTable(true);
        showAlert("Datos cargados exitosamente desde la API", "Éxito");
      } else {
        showAlert("Error en la respuesta de la API", "Error");
      }
    } catch (error) {
      console.error('Error al llamar la API:', error);
      showAlert("Error al conectar con la API: " + error.message, "Error de Conexión");
    } finally {
      setLoading(false);
    }
  }, [stationInfo, startDate, endDate, processApiData, showAlert]);

  // Función para manejar el botón calcular
  const handleCalculate = useCallback(() => {
    if (!isBasicDataComplete) {
      showAlert("Debe completar todos los datos básicos (País, Estación, Altitud, Latitud, Longitud)", "Datos Incompletos");
      return;
    }
    
    if (!calculationMethod) {
      showAlert("Debe seleccionar un método de cálculo", "Método no seleccionado");
      return;
    }
    
    if (calculationMethod === 'api') {
      fetchApiData();
    } else {
      // Mostrar tabla para llenado manual
      setShowTable(true);
    }
  }, [isBasicDataComplete, calculationMethod, fetchApiData, showAlert]);

  // Verificar si debemos calcular la radiación y ETo (solo para modo fórmula)
  const shouldCalculateRadiationAndEto = useCallback((data) => {
    if (calculationMethod === 'api') return false; // Los datos de API ya vienen calculados
    
    // Para método de temperatura solamente
    if (config.etoCalculationMethod === 'temperature_only') {
      if (config.temperatureMode === 'min_max') {
        return data.tempMin !== '' && data.tempMax !== '';
      } else {
        return data.tempAvg !== '';
      }
    }
    
    // Para método completo
    if (config.temperatureMode === 'min_max') {
      return (
        data.tempMin !== '' && 
        data.tempMax !== '' && 
        data.humidity !== '' && 
        data.wind !== '' && 
        data.sunshine !== ''
      );
    } else {
      return (
        data.tempAvg !== '' && 
        data.humidity !== '' && 
        data.wind !== '' && 
        data.sunshine !== ''
      );
    }
  }, [config, calculationMethod]);

  // Convertir unidades según configuración
  const convertToStandardUnits = useCallback((data) => {
    const converted = { ...data };

    // Convertir viento a m/s si está en km/día
    if (config.windSpeedUnit === 'kilometers_per_day' && data.wind !== '') {
      converted.wind = parseFloat(data.wind) / 86.4; // km/día to m/s
    }

    // Convertir insolación a horas si es necesario
    if (data.sunshine !== '') {
      const sunshineValue = parseFloat(data.sunshine);
      if (config.sunshineUnit === 'percentage_day_duration') {
        // Convertir porcentaje a horas (asumiendo 12 horas de día promedio)
        converted.sunshine = (sunshineValue / 100) * 12;
      } else if (config.sunshineUnit === 'fraction_day_duration') {
        // Convertir fracción a horas
        converted.sunshine = sunshineValue * 12;
      }
    }

    return converted;
  }, [config]);

  // Función para calcular radiación y ETo
  const calculateRadiationAndEto = useCallback((data, monthIndex, latitude, altitude) => {
    try {
      const convertedData = convertToStandardUnits(data);
      const latitudeRad = parseFloat(latitude) * (Math.PI / 180);
      const dayOfYear = Math.floor((monthIndex * 30.4) + 15);
      
      // Cálculo de temperatura media
      let Tmean;
      if (config.temperatureMode === 'min_max') {
        Tmean = (parseFloat(convertedData.tempMin) + parseFloat(convertedData.tempMax)) / 2;
      } else {
        Tmean = parseFloat(convertedData.tempAvg);
      }

      let ETo;

      if (config.etoCalculationMethod === 'temperature_only') {
        // Método simplificado basado solo en temperatura (Hargreaves-Samani)
        const Ra = calculateExtraterrestrialRadiation(latitudeRad, dayOfYear);
        const tempRange = config.temperatureMode === 'min_max' 
          ? Math.abs(parseFloat(convertedData.tempMax) - parseFloat(convertedData.tempMin))
          : 10; // Valor estimado para temperatura media
        
        ETo = 0.0023 * (Tmean + 17.8) * Math.sqrt(tempRange) * Ra * 0.408;
      } else {
        // Método completo Penman-Monteith
        const calculationResult = calculatePenmanMonteith(convertedData, monthIndex, latitude, altitude, config);
        return calculationResult;
      }

      const finalEto = config.etoUnit === 'mm_per_period' ? ETo * 30 : ETo;

      return {
        radiation: null, // No se calcula para método simplificado
        eto: parseFloat(finalEto.toFixed(1))
      };
    } catch (error) {
      console.error("Error en cálculos:", error);
      return {
        radiation: null,
        eto: null
      };
    }
  }, [config, convertToStandardUnits]);

  // Función auxiliar para calcular radiación extraterrestre
  const calculateExtraterrestrialRadiation = (latitudeRad, dayOfYear) => {
    const solarConstant = 0.0820;
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
    const deltaValue = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
    const ws = Math.acos(-Math.tan(latitudeRad) * Math.tan(deltaValue));
    return 24 * 60 / Math.PI * solarConstant * dr * (ws * Math.sin(latitudeRad) * Math.sin(deltaValue) + Math.cos(latitudeRad) * Math.cos(deltaValue) * Math.sin(ws));
  };

  // Función completa Penman-Monteith
  const calculatePenmanMonteith = (data, monthIndex, latitude, altitude, config) => {
    const latitudeRad = parseFloat(latitude) * (Math.PI / 180);
    const dayOfYear = Math.floor((monthIndex * 30.4) + 15);
    
    // Radiación extraterrestre
    const Ra = calculateExtraterrestrialRadiation(latitudeRad, dayOfYear);
    
    // Duración máxima posible de la insolación
    const deltaValue = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
    const ws = Math.acos(-Math.tan(latitudeRad) * Math.tan(deltaValue));
    const N = 24 * ws / Math.PI;
    
    // Radiación solar
    const Rs = (0.25 + 0.5 * parseFloat(data.sunshine) / N) * Ra;
    
    // Temperatura media
    let Tmean;
    if (config.temperatureMode === 'min_max') {
      Tmean = (parseFloat(data.tempMin) + parseFloat(data.tempMax)) / 2;
    } else {
      Tmean = parseFloat(data.tempAvg);
    }

    // Presión de saturación de vapor
    let es, ea;
    if (config.temperatureMode === 'min_max') {
      const es_Tmax = 0.6108 * Math.exp(17.27 * parseFloat(data.tempMax) / (parseFloat(data.tempMax) + 237.3));
      const es_Tmin = 0.6108 * Math.exp(17.27 * parseFloat(data.tempMin) / (parseFloat(data.tempMin) + 237.3));
      es = (es_Tmax + es_Tmin) / 2;
    } else {
      es = 0.6108 * Math.exp(17.27 * Tmean / (Tmean + 237.3));
    }

    // Presión real de vapor
    if (config.humidityUnit === 'relative_percent') {
      ea = es * parseFloat(data.humidity) / 100;
    } else {
      ea = parseFloat(data.humidity); // Ya está en kPa
    }
    
    // Pendiente de la curva de presión de vapor
    const slopeValue = 4098 * (0.6108 * Math.exp(17.27 * Tmean / (Tmean + 237.3))) / Math.pow((Tmean + 237.3), 2);
    
    // Constante psicrométrica
    const altitudeValue = parseFloat(altitude) || 0;
    const P = 101.3 * Math.pow((293 - 0.0065 * altitudeValue) / 293, 5.26);
    const gamma = 0.000665 * P;
    
    // Radiación neta (simplificada)
    const Rns = (1 - 0.23) * Rs;
    const Rnl = 4.903e-9 * ((Math.pow(Tmean + 273.16, 4))) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Ra - 0.35);
    const Rn = Rns - Rnl;
    
    // ETo
    const term1 = 0.408 * slopeValue * Rn;
    const term2 = gamma * (900 / (Tmean + 273)) * parseFloat(data.wind) * (es - ea);
    const term3 = slopeValue + gamma * (1 + 0.34 * parseFloat(data.wind));
    
    const ETo = (term1 + term2) / term3;
    const finalEto = config.etoUnit === 'mm_per_period' ? ETo * 30 : ETo;
    
    return {
      radiation: parseFloat(Rs.toFixed(1)),
      eto: parseFloat(finalEto.toFixed(1))
    };
  };

  // Usar useMemo para calcular los datos climáticos con radiación y ETo
  const climateData = useMemo(() => {
    return inputClimateData.map((data, index) => {
      if (calculationMethod === 'api') {
        // Para datos de API, usar los valores ya calculados
        return data;
      } else if (shouldCalculateRadiationAndEto(data)) {
        const calculations = calculateRadiationAndEto(data, index, stationInfo.latitude, stationInfo.altitude);
        return {
          ...data,
          radiation: calculations.radiation,
          eto: calculations.eto
        };
      } else {
        return {
          ...data,
          radiation: null,
          eto: null
        };
      }
    });
  }, [inputClimateData, stationInfo.latitude, stationInfo.altitude, shouldCalculateRadiationAndEto, calculateRadiationAndEto, calculationMethod]);

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

    averages.radiation = parseFloat((validMonths.reduce((sum, data) => sum + (data.radiation || 0), 0) / validMonths.length).toFixed(1));
    averages.eto = parseFloat((validMonths.reduce((sum, data) => sum + (data.eto || 0), 0) / validMonths.length).toFixed(1));

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
    setCalculationMethod('');
    setStartDate('');
    setEndDate('');
    setShowTable(false);
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
                type: 'number',
                readOnly: calculationMethod === 'api'
              }}
              disabled={calculationMethod === 'api'}
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
                type: 'number',
                readOnly: calculationMethod === 'api'
              }}
              disabled={calculationMethod === 'api'}
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
              type: 'number',
              readOnly: calculationMethod === 'api'
            }}
            disabled={calculationMethod === 'api'}
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
                step: config.humidityUnit === 'vapor_pressure_kpa' ? '0.1' : '1',
                readOnly: calculationMethod === 'api'
              }}
              disabled={calculationMethod === 'api'}
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
                step: '0.1',
                readOnly: calculationMethod === 'api'
              }}
              disabled={calculationMethod === 'api'}
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
                step: config.sunshineUnit === 'fraction_day_duration' ? '0.01' : '0.1',
                readOnly: calculationMethod === 'api'
              }}
              disabled={calculationMethod === 'api'}
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
    <MainCard title="Clima/ETo Penman-Monteith">
      <Grid container spacing={2}>
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

        {/* Selector de método y fechas */}
        {isBasicDataComplete && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Cálculo</InputLabel>
                    <Select
                      value={calculationMethod}
                      label="Método de Cálculo"
                      onChange={(e) => setCalculationMethod(e.target.value)}
                    >
                      <MenuItem value="formula">Usar fórmula Penman-Monteith</MenuItem>
                      <MenuItem value="api">Usar API</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {calculationMethod === 'api' && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Fecha de Inicio"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        helperText="Formato: AAAA-MM-DD"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Fecha de Fin"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        helperText="Formato: AAAA-MM-DD"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} sm={6} md={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleCalculate}
                    disabled={loading}
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Cargando...' : 'Calcular'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Tabla de datos climáticos */}
        {showTable && (
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
        )}

        {/* Botones de acción - solo mostrar si la tabla está visible y no es modo API */}
        {showTable && calculationMethod === 'formula' && (
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
            </Grid>
          </Grid>
        )}

        {/* Botón para limpiar todo cuando se usa API */}
        {showTable && calculationMethod === 'api' && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button variant="outlined" color="secondary" onClick={clearAllData}>
              Limpiar Datos
            </Button>
          </Grid>
        )}

        {/* Información dinámica basada en configuración */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Método de cálculo:</strong> {config.etoCalculationMethod === 'full_climate_data' 
              ? 'ETo Penman-Monteith completo con datos climáticos' 
              : 'ETo simplificado basado en temperatura (Hargreaves-Samani)'}
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
            {calculationMethod === 'api' && 'Los datos han sido obtenidos de la API y promediados por mes. '}
            Las celdas amarillas muestran los valores calculados automáticamente.
            {calculationMethod === 'api' && (
              <>
                <br />
                <strong>Periodo consultado:</strong> {startDate} a {endDate}
              </>
            )}
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