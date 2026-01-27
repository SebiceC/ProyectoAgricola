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
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';

// project imports
import MainCard from 'components/MainCard';
import CustomAlertModal from '../../components/CustomAlertModal';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Configuración por defecto
const defaultConfig = {
  precipitationUnit: 'mm_per_month', // 'mm_per_month' | 'mm_per_decade' | 'inches_per_month'
  includeProbability: true,
  includeEffectivePrecipitation: true,
  effectivePrecipitationMethod: 'usda_soil_conservation', // 'usda_soil_conservation' | 'fao_arid_semiarid' | 'percentage'
  percentageEffective: 80, // Para método porcentaje
  rainyDaysThreshold: 0.1 // mm mínimos para considerar día lluvioso
};

export default function Precipitation() {
  const [config, setConfig] = useState(defaultConfig);
  const [stationInfo, setStationInfo] = useState({
    country: '',
    station: '',
    altitude: '',
    latitude: '',
    latDirection: 'N',
    longitude: '',
    longDirection: 'W',
    dataYears: '10' // Años de datos históricos
  });

  const [precipitationData, setPrecipitationData] = useState(() => 
    months.map((month) => ({
      month,
      precipitation: '', // Precipitación total
      rainyDays: '', // Días con lluvia
      reliability80: '', // Precipitación con 80% probabilidad
      reliability50: '', // Precipitación con 50% probabilidad
      effectivePrecipitation: null // Calculado
    }))
  );

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Valor fuera de rango");
  const [alertTitle, setAlertTitle] = useState("Error de Validación");

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('etoCalculatorConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.precipitation) {
          setConfig(parsedConfig.precipitation);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, []);

  // Reglas de validación
  const validationRules = useMemo(() => ({
    country: { max: 20, message: "País: máximo 20 caracteres" },
    station: { max: 20, message: "Estación: máximo 20 caracteres" },
    altitude: { min: -200, max: 9999, message: "Altitud: debe estar entre -200 y 9999" },
    latitude: { min: 1, max: 90, message: "Latitud: debe estar entre 1 y 90" },
    longitude: { min: 1, max: 180, message: "Longitud: debe estar entre 1 y 180" },
    dataYears: { min: 1, max: 100, message: "Años de datos: debe estar entre 1 y 100" },
    precipitation: { min: 0, max: 2000, message: "Precipitación: debe estar entre 0 y 2000 mm" },
    rainyDays: { min: 0, max: 31, message: "Días con lluvia: debe estar entre 0 y 31" },
    reliability80: { min: 0, max: 2000, message: "Precipitación 80%: debe estar entre 0 y 2000 mm" },
    reliability50: { min: 0, max: 2000, message: "Precipitación 50%: debe estar entre 0 y 2000 mm" }
  }), []);

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

  // Función de validación
  const validateValue = useCallback((value, rule) => {
    if (rule.max && typeof value === 'string' && !rule.min) {
      if (value.length > rule.max) {
        showAlert(rule.message);
        return false;
      }
    } else if ((rule.min !== undefined || rule.max !== undefined) && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      if (numValue < rule.min || numValue > rule.max) {
        showAlert(rule.message);
        return false;
      }
    }
    return true;
  }, [showAlert]);

  // Actualizar información de estación
  const updateStationInfo = useCallback((field, value) => {
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field])) {
        return;
      }
    }
    setStationInfo(prev => ({ ...prev, [field]: value }));
  }, [validateValue, validationRules]);

  // Actualizar datos de precipitación
  const updatePrecipitationData = useCallback((monthIndex, field, value) => {
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field])) {
        return;
      }
    }

    setPrecipitationData(prev => {
      const newData = [...prev];
      newData[monthIndex] = { ...newData[monthIndex], [field]: value };
      return newData;
    });
  }, [validateValue, validationRules]);

  // Calcular precipitación efectiva usando diferentes métodos
  const calculateEffectivePrecipitation = useCallback((precipitation, method, percentage = 80) => {
    const precip = parseFloat(precipitation);
    if (isNaN(precip) || precip === 0) return 0;

    switch (method) {
      case 'usda_soil_conservation':
        // Método USDA Soil Conservation Service
        if (precip <= 75) {
          return precip * (125 - precip) / 125;
        } else {
          return 125 + 0.1 * precip;
        }
      
      case 'fao_arid_semiarid':
        // Método FAO para zonas áridas y semiáridas
        if (precip <= 70) {
          return precip * 0.6;
        } else {
          return 0.8 * precip - 25;
        }
      
      case 'percentage':
        // Método de porcentaje fijo
        return precip * (percentage / 100);
      
      default:
        return precip * 0.8; // 80% por defecto
    }
  }, []);

  // Actualizar precipitación efectiva cuando cambien los datos
  useEffect(() => {
    if (config.includeEffectivePrecipitation) {
      setPrecipitationData(prev => 
        prev.map(data => ({
          ...data,
          effectivePrecipitation: data.precipitation ? 
            calculateEffectivePrecipitation(
              data.precipitation, 
              config.effectivePrecipitationMethod, 
              config.percentageEffective
            ).toFixed(1) : null
        }))
      );
    }
  }, [config.includeEffectivePrecipitation, config.effectivePrecipitationMethod, config.percentageEffective, calculateEffectivePrecipitation]);

  // Calcular estadísticas
  const calculateStatistics = useMemo(() => {
    const validData = precipitationData.filter(data => data.precipitation !== '');
    if (validData.length === 0) return {};

    const total = validData.reduce((sum, data) => sum + parseFloat(data.precipitation || 0), 0);
    const totalRainyDays = validData.reduce((sum, data) => sum + parseFloat(data.rainyDays || 0), 0);
    const totalEffective = config.includeEffectivePrecipitation ? 
      validData.reduce((sum, data) => sum + parseFloat(data.effectivePrecipitation || 0), 0) : 0;

    return {
      annual: total.toFixed(1),
      averageMonthly: (total / 12).toFixed(1),
      totalRainyDays: totalRainyDays.toFixed(0),
      averageRainyDays: (totalRainyDays / 12).toFixed(1),
      annualEffective: config.includeEffectivePrecipitation ? totalEffective.toFixed(1) : 0,
      averageEffective: config.includeEffectivePrecipitation ? (totalEffective / 12).toFixed(1) : 0
    };
  }, [precipitationData, config.includeEffectivePrecipitation]);

  // Cargar datos de ejemplo
  const loadExampleData = useCallback(() => {
    const exampleData = [
      { month: 'Enero', precipitation: '25', rainyDays: '3', reliability80: '15', reliability50: '30' },
      { month: 'Febrero', precipitation: '20', rainyDays: '2', reliability80: '10', reliability50: '25' },
      { month: 'Marzo', precipitation: '15', rainyDays: '2', reliability80: '8', reliability50: '18' },
      { month: 'Abril', precipitation: '8', rainyDays: '1', reliability80: '3', reliability50: '10' },
      { month: 'Mayo', precipitation: '5', rainyDays: '1', reliability80: '2', reliability50: '7' },
      { month: 'Junio', precipitation: '2', rainyDays: '0', reliability80: '0', reliability50: '3' },
      { month: 'Julio', precipitation: '1', rainyDays: '0', reliability80: '0', reliability50: '1' },
      { month: 'Agosto', precipitation: '1', rainyDays: '0', reliability80: '0', reliability50: '1' },
      { month: 'Septiembre', precipitation: '3', rainyDays: '1', reliability80: '1', reliability50: '4' },
      { month: 'Octubre', precipitation: '10', rainyDays: '1', reliability80: '5', reliability50: '12' },
      { month: 'Noviembre', precipitation: '15', rainyDays: '2', reliability80: '8', reliability50: '18' },
      { month: 'Diciembre', precipitation: '22', rainyDays: '3', reliability80: '12', reliability50: '28' }
    ];

    setPrecipitationData(exampleData.map((item, i) => ({
      ...precipitationData[i],
      ...item
    })));

    setStationInfo(prev => ({ 
      ...prev, 
      altitude: '150',
      dataYears: '15'
    }));
  }, [precipitationData]);

  // Limpiar datos
  const clearAllData = useCallback(() => {
    setPrecipitationData(
      months.map((month) => ({
        month,
        precipitation: '',
        rainyDays: '',
        reliability80: '',
        reliability50: '',
        effectivePrecipitation: null
      }))
    );
    setStationInfo({
      country: '',
      station: '',
      altitude: '',
      latitude: '',
      latDirection: 'N',
      longitude: '',
      longDirection: 'W',
      dataYears: '10'
    });
  }, []);

  // Obtener etiquetas según configuración
  const getUnitLabel = () => {
    switch (config.precipitationUnit) {
      case 'mm_per_decade':
        return 'mm/década';
      case 'inches_per_month':
        return 'pulgadas/mes';
      default:
        return 'mm/mes';
    }
  };

  return (
    <MainCard title="Precipitación">
      <Grid container spacing={3}>
        {/* Información de la estación */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader 
              title="Información de la Estación" 
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="País"
                    value={stationInfo.country}
                    onChange={(e) => updateStationInfo('country', e.target.value)}
                    inputProps={{ maxLength: 20 }}
                    helperText={`${stationInfo.country.length}/20`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
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
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Años de datos"
                    value={stationInfo.dataYears}
                    onChange={(e) => updateStationInfo('dataYears', e.target.value)}
                    type="number"
                    helperText="Histórico disponible"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuraciones de cálculo */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader 
              title="Configuración de Precipitación Efectiva" 
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.includeEffectivePrecipitation}
                        onChange={(e) => setConfig(prev => ({ ...prev, includeEffectivePrecipitation: e.target.checked }))}
                      />
                    }
                    label="Calcular precipitación efectiva"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!config.includeEffectivePrecipitation}>
                    <InputLabel>Método de cálculo</InputLabel>
                    <Select
                      value={config.effectivePrecipitationMethod}
                      label="Método de cálculo"
                      onChange={(e) => setConfig(prev => ({ ...prev, effectivePrecipitationMethod: e.target.value }))}
                    >
                      <MenuItem value="usda_soil_conservation">USDA Soil Conservation Service</MenuItem>
                      <MenuItem value="fao_arid_semiarid">FAO para zonas áridas/semiáridas</MenuItem>
                      <MenuItem value="percentage">Porcentaje fijo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {config.effectivePrecipitationMethod === 'percentage' && (
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Porcentaje"
                      value={config.percentageEffective}
                      onChange={(e) => setConfig(prev => ({ ...prev, percentageEffective: parseFloat(e.target.value) || 80 }))}
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      disabled={!config.includeEffectivePrecipitation}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Unidades</InputLabel>
                    <Select
                      value={config.precipitationUnit}
                      label="Unidades"
                      onChange={(e) => setConfig(prev => ({ ...prev, precipitationUnit: e.target.value }))}
                    >
                      <MenuItem value="mm_per_month">mm por mes</MenuItem>
                      <MenuItem value="mm_per_decade">mm por década</MenuItem>
                      <MenuItem value="inches_per_month">pulgadas por mes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabla de datos de precipitación */}
        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={3}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  <TableCell align="center">
                    Precipitación<br/>
                    {getUnitLabel()}
                  </TableCell>
                  <TableCell align="center">
                    Días con<br/>
                    lluvia
                  </TableCell>
                  {config.includeProbability && (
                    <>
                      <TableCell align="center">
                        Precipitación<br/>
                        80% confiabilidad<br/>
                        {getUnitLabel()}
                      </TableCell>
                      <TableCell align="center">
                        Precipitación<br/>
                        50% confiabilidad<br/>
                        {getUnitLabel()}
                      </TableCell>
                    </>
                  )}
                  {config.includeEffectivePrecipitation && (
                    <TableCell align="center">
                      Precipitación<br/>
                      Efectiva<br/>
                      {getUnitLabel()}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {precipitationData.map((row, index) => (
                  <TableRow key={row.month}>
                    <TableCell component="th" scope="row">
                      {row.month}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        variant="standard"
                        value={row.precipitation}
                        onChange={(e) => updatePrecipitationData(index, 'precipitation', e.target.value)}
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
                        value={row.rainyDays}
                        onChange={(e) => updatePrecipitationData(index, 'rainyDays', e.target.value)}
                        inputProps={{ 
                          style: { textAlign: 'center' },
                          type: 'number',
                          min: 0,
                          max: 31
                        }}
                      />
                    </TableCell>
                    {config.includeProbability && (
                      <>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            variant="standard"
                            value={row.reliability80}
                            onChange={(e) => updatePrecipitationData(index, 'reliability80', e.target.value)}
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
                            value={row.reliability50}
                            onChange={(e) => updatePrecipitationData(index, 'reliability50', e.target.value)}
                            inputProps={{ 
                              style: { textAlign: 'center' },
                              type: 'number',
                              step: '0.1'
                            }}
                          />
                        </TableCell>
                      </>
                    )}
                    {config.includeEffectivePrecipitation && (
                      <TableCell align="center" sx={{ backgroundColor: '#E8F5E8' }}>
                        {row.effectivePrecipitation || ''}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                
                {/* Fila de totales */}
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Total Anual
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateStatistics.annual || ''}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateStatistics.totalRainyDays || ''}
                  </TableCell>
                  {config.includeProbability && (
                    <>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        -
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        -
                      </TableCell>
                    </>
                  )}
                  {config.includeEffectivePrecipitation && (
                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#E8F5E8' }}>
                      {calculateStatistics.annualEffective || ''}
                    </TableCell>
                  )}
                </TableRow>
                
                {/* Fila de promedios */}
                <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Promedio Mensual
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateStatistics.averageMonthly || ''}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {calculateStatistics.averageRainyDays || ''}
                  </TableCell>
                  {config.includeProbability && (
                    <>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        -
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        -
                      </TableCell>
                    </>
                  )}
                  {config.includeEffectivePrecipitation && (
                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#E8F5E8' }}>
                      {calculateStatistics.averageEffective || ''}
                    </TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Botones de acción */}
        <Grid item xs={12}>
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeProbability}
                    onChange={(e) => setConfig(prev => ({ ...prev, includeProbability: e.target.checked }))}
                  />
                }
                label="Incluir datos de confiabilidad"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Información y ayuda */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Precipitación:</strong> Ingrese los valores mensuales de precipitación histórica. 
              Los datos de confiabilidad representan la precipitación esperada con 80% y 50% de probabilidad.
              <br />
              <strong>Precipitación Efectiva:</strong> Representa la porción de precipitación que realmente 
              queda disponible para las plantas después de considerar pérdidas por escorrentía y percolación profunda.
              <br />
              <strong>Métodos disponibles:</strong>
              <br />
              • <strong>USDA:</strong> Recomendado para la mayoría de condiciones
              <br />
              • <strong>FAO áridas/semiáridas:</strong> Para zonas con baja precipitación
              <br />
              • <strong>Porcentaje fijo:</strong> Aplicar un porcentaje constante
            </Typography>
          </Alert>
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