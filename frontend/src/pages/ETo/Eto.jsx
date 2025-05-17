import React, { useState, useEffect } from 'react';

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
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';
import CustomAlertModal from '../../components/CustomAlertModal';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Valores iniciales de ejemplo
const initialClimateData = months.map((month) => ({
  month,
  tempMin: '',
  tempMax: '',
  humidity: '',
  wind: '',
  sunshine: '',
  radiation: null,
  eto: null
}));

// Reglas de validación
const validationRules = {
  country: { max: 20, message: "País: máximo 20 caracteres" },
  station: { max: 20, message: "Estación: máximo 20 caracteres" },
  altitude: { min: -200, max: 9999, message: "Altitud: debe estar entre -200 y 9999" },
  latitude: { min: 1, max: 90, message: "Latitud: debe estar entre 1 y 90" },
  longitude: { min: 1, max: 180, message: "Longitud: debe estar entre 1 y 180" },
  tempMin: { min: -80, max: 40, message: "Temperatura mínima: debe estar entre -80°C y 40°C" },
  tempMax: { min: -40, max: 60, message: "Temperatura máxima: debe estar entre -40°C y 60°C" },
  humidity: { min: 1, max: 99, message: "Humedad: debe estar entre 1% y 99%" },
  wind: { min: 1, max: 9, message: "Viento: debe estar entre 1 y 9 m/s" },
  sunshine: { min: 1, max: 24, message: "Insolación: debe estar entre 1 y 24 horas" }
};

export default function Eto() {
  const [stationInfo, setStationInfo] = useState({
    country: '',
    station: '24570',
    altitude: '',
    latitude: '24.82',
    latDirection: 'N',
    longitude: '109.00',
    longDirection: 'W'
  });

  const [climateData, setClimateData] = useState(initialClimateData);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Valor fuera de rango");
  const [alertTitle, setAlertTitle] = useState("Error de Validación");

  // Función para mostrar alerta
  const showAlert = (message, title = "Error de Validación") => {
    setAlertMessage(message);
    setAlertTitle(title);
    setAlertOpen(true);
  };

  // Cierra el modal de alerta
  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  // Función de validación genérica
  const validateValue = (value, rule, fieldName) => {
    // Para campos de texto con longitud máxima
    if (rule.max && typeof value === 'string' && !rule.min) {
      if (value.length > rule.max) {
        showAlert(rule.message);
        return false;
      }
    } 
    // Para campos numéricos con min y max
    else if ((rule.min !== undefined || rule.max !== undefined) && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      if (numValue < rule.min || numValue > rule.max) {
        showAlert(rule.message);
        return false;
      }
    }
    return true;
  };

  // Actualizar datos de la estación con validación
  const updateStationInfo = (field, value) => {
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field], field)) {
        return;
      }
    }

    setStationInfo({ ...stationInfo, [field]: value });
  };

  // Actualizar un valor para un mes específico con validación
  const updateMonthData = (monthIndex, field, value) => {
    if (validationRules[field]) {
      if (!validateValue(value, validationRules[field], field)) {
        return;
      }
    }

    const newClimateData = [...climateData];
    newClimateData[monthIndex][field] = value;
    setClimateData(newClimateData);
  };

  // Verificar si debemos calcular la radiación y ETo
  const shouldCalculateRadiationAndEto = (data) => {
    return (
      data.sunshine !== '' && 
      parseFloat(data.sunshine) > 0 &&
      data.tempMin !== '' && 
      data.tempMax !== '' && 
      data.humidity !== '' && 
      data.wind !== ''
    );
  };

  // Cálculo de la radiación solar y ETo
  useEffect(() => {
    // Copia de los datos para modificarlos
    const newData = [...climateData];
    
    // Para cada mes, calculamos la radiación y ETo si tenemos los datos necesarios
    newData.forEach((data, index) => {
      // Calculamos solo si tenemos todos los datos necesarios
      if (shouldCalculateRadiationAndEto(data)) {
        try {
          // Calculamos la radiación si tenemos datos de insolación
          // Simulación del cálculo de radiación basado en horas de sol
          // En un caso real, usaríamos la fórmula completa de Penman-Monteith
          const latitudeRad = parseFloat(stationInfo.latitude) * (Math.PI / 180);
          const dayOfYear = Math.floor((index * 30.4) + 15); // Estimación del día medio del mes
          
          // Cálculo simplificado de radiación extraterrestre (Ra)
          const solarConstant = 0.0820; // MJ/m²/min
          const dr = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
          const deltaValue = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
          const ws = Math.acos(-Math.tan(latitudeRad) * Math.tan(deltaValue));
          const Ra = 24 * 60 / Math.PI * solarConstant * dr * (ws * Math.sin(latitudeRad) * Math.sin(deltaValue) + Math.cos(latitudeRad) * Math.cos(deltaValue) * Math.sin(ws));
          
          // N = duración máxima posible de la insolación
          const N = 24 * ws / Math.PI;
          
          // Rs = radiación solar o de onda corta (MJ/m²/día)
          const Rs = (0.25 + 0.5 * parseFloat(data.sunshine) / N) * Ra;
          
          newData[index].radiation = parseFloat(Rs.toFixed(1));
          
          // Calculamos la ETo si tenemos todos los datos necesarios
          // Cálculo simplificado de ETo usando la ecuación de Penman-Monteith
          const Tmean = (parseFloat(data.tempMin) + parseFloat(data.tempMax)) / 2;
          
          // Presión de saturación de vapor a temperaturas máx. y mín.
          const es_Tmax = 0.6108 * Math.exp(17.27 * parseFloat(data.tempMax) / (parseFloat(data.tempMax) + 237.3));
          const es_Tmin = 0.6108 * Math.exp(17.27 * parseFloat(data.tempMin) / (parseFloat(data.tempMin) + 237.3));
          
          // Presión media de saturación de vapor
          const es = (es_Tmax + es_Tmin) / 2;
          
          // Presión real de vapor (kPa)
          const ea = es * parseFloat(data.humidity) / 100;
          
          // Pendiente de la curva de presión de vapor (kPa/°C)
          const slopeValue = 4098 * (0.6108 * Math.exp(17.27 * Tmean / (Tmean + 237.3))) / Math.pow((Tmean + 237.3), 2);
          
          // Constante psicrométrica (kPa/°C)
          const altitude = parseFloat(stationInfo.altitude) || 0;
          const P = 101.3 * Math.pow((293 - 0.0065 * altitude) / 293, 5.26);
          const gamma = 0.000665 * P;
          
          // Radiación neta (MJ/m²/día) - simplificada
          const Rns = (1 - 0.23) * Rs; // Albedo = 0.23 para pasto de referencia
          const Rnl = 4.903e-9 * ((Math.pow(parseFloat(data.tempMax) + 273.16, 4) + Math.pow(parseFloat(data.tempMin) + 273.16, 4)) / 2) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Ra - 0.35);
          const Rn = Rns - Rnl;
          
          // Flujo de calor del suelo (MJ/m²/día) - aproximado a 0 para periodos diarios
          const G = 0;
          
          // ETo (mm/día)
          const term1 = 0.408 * slopeValue * (Rn - G);
          const term2 = gamma * (900 / (Tmean + 273)) * parseFloat(data.wind) * (es - ea);
          const term3 = slopeValue + gamma * (1 + 0.34 * parseFloat(data.wind));
          
          const ETo = (term1 + term2) / term3;
          
          newData[index].eto = parseFloat(ETo.toFixed(1));
        } catch (error) {
          console.error("Error en cálculos:", error);
          newData[index].radiation = null;
          newData[index].eto = null;
        }
      } else {
        // Si no tenemos datos suficientes, no calculamos nada
        newData[index].radiation = null;
        newData[index].eto = null;
      }
    });
    
    setClimateData(newData);
  }, [climateData, stationInfo]);

  // Calcular promedios para la fila final
  const calculateAverages = () => {
    const validMonths = climateData.filter(data => 
      data.tempMin !== '' || data.tempMax !== '' || data.humidity !== '' || 
      data.wind !== '' || data.sunshine !== ''
    );
    
    if (validMonths.length === 0) return { tempMin: 0, tempMax: 0, humidity: 0, wind: 0, sunshine: 0, radiation: 0, eto: 0 };
    
    return {
      tempMin: parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.tempMin) || 0), 0) / validMonths.length).toFixed(1)),
      tempMax: parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.tempMax) || 0), 0) / validMonths.length).toFixed(1)),
      humidity: parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.humidity) || 0), 0) / validMonths.length).toFixed(0)),
      wind: parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.wind) || 0), 0) / validMonths.length).toFixed(1)),
      sunshine: parseFloat((validMonths.reduce((sum, data) => sum + (parseFloat(data.sunshine) || 0), 0) / validMonths.length).toFixed(1)),
      radiation: parseFloat((validMonths.reduce((sum, data) => sum + (data.radiation || 0), 0) / validMonths.length).toFixed(1)),
      eto: parseFloat((validMonths.reduce((sum, data) => sum + (data.eto || 0), 0) / validMonths.length).toFixed(1))
    };
  };

  const averages = calculateAverages();

  // Cargar datos de ejemplo
  const loadExampleData = () => {
    const exampleData = [
      { month: 'Enero', tempMin: '12.8', tempMax: '27.0', humidity: '70', wind: '2.4', sunshine: '6.0' },
      { month: 'Febrero', tempMin: '13.5', tempMax: '25.0', humidity: '35', wind: '2.5', sunshine: '7.5' },
      { month: 'Marzo', tempMin: '15.1', tempMax: '22.0', humidity: '45', wind: '2.6', sunshine: '6.5' },
      { month: 'Abril', tempMin: '15.9', tempMax: '19.0', humidity: '85', wind: '2.3', sunshine: '5.5' },
      { month: 'Mayo', tempMin: '18.2', tempMax: '25.0', humidity: '95', wind: '2.4', sunshine: '6.0' },
      { month: 'Junio', tempMin: '21.3', tempMax: '22.0', humidity: '85', wind: '2.5', sunshine: '7.0' },
      { month: 'Julio', tempMin: '23.9', tempMax: '25.0', humidity: '65', wind: '2.8', sunshine: '7.2' },
      { month: 'Agosto', tempMin: '23.8', tempMax: '25.0', humidity: '72', wind: '2.6', sunshine: '7.3' },
      { month: 'Septiembre', tempMin: '23.6', tempMax: '25.0', humidity: '73', wind: '2.5', sunshine: '6.8' },
      { month: 'Octubre', tempMin: '20.9', tempMax: '25.0', humidity: '69', wind: '2.3', sunshine: '5.6' },
      { month: 'Noviembre', tempMin: '16.5', tempMax: '18.0', humidity: '65', wind: '2.2', sunshine: '5.9' },
      { month: 'Diciembre', tempMin: '13.4', tempMax: '19.0', humidity: '85', wind: '2.0', sunshine: '6.8' }
    ];
    
    setClimateData(months.map((month, i) => ({
      ...climateData[i],
      ...exampleData[i],
      radiation: null,
      eto: null
    })));
    
    setStationInfo({
      ...stationInfo,
      altitude: '100'
    });
  };

  // Limpiar todos los datos
  const clearAllData = () => {
    setClimateData(initialClimateData);
    setStationInfo({
      country: '',
      station: '',
      altitude: '',
      latitude: '',
      latDirection: 'N',
      longitude: '',
      longDirection: 'W'
    });
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
                      onChange={(e) => setStationInfo({ ...stationInfo, latDirection: e.target.value })}
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
                      onChange={(e) => setStationInfo({ ...stationInfo, longDirection: e.target.value })}
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
                  <TableCell align="center">Temp Min<br/>°C</TableCell>
                  <TableCell align="center">Temp Max<br/>°C</TableCell>
                  <TableCell align="center">Humedad<br/>%</TableCell>
                  <TableCell align="center">Viento<br/>m/s</TableCell>
                  <TableCell align="center">Insolación<br/>horas</TableCell>
                  <TableCell align="center">Rad<br/>MJ/m²/día</TableCell>
                  <TableCell align="center">ETo<br/>mm/día</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {climateData.map((row, index) => (
                  <TableRow key={row.month}>
                    <TableCell component="th" scope="row">
                      {row.month}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        variant="standard"
                        value={row.tempMin}
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
                        value={row.tempMax}
                        onChange={(e) => updateMonthData(index, 'tempMax', e.target.value)}
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
                        value={row.humidity}
                        onChange={(e) => updateMonthData(index, 'humidity', e.target.value)}
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
                        value={row.wind}
                        onChange={(e) => updateMonthData(index, 'wind', e.target.value)}
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
                        value={row.sunshine}
                        onChange={(e) => updateMonthData(index, 'sunshine', e.target.value)}
                        inputProps={{ 
                          style: { textAlign: 'center' },
                          type: 'number'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#FFFFC0' }}>
                      {row.radiation !== null ? row.radiation : ''}
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#FFFFC0' }}>
                      {row.eto !== null ? row.eto : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Promedio
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{!isNaN(averages.tempMin) ? averages.tempMin : ''}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{!isNaN(averages.tempMax) ? averages.tempMax : ''}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{!isNaN(averages.humidity) ? averages.humidity : ''}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{!isNaN(averages.wind) ? averages.wind : ''}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{!isNaN(averages.sunshine) ? averages.sunshine : ''}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#FFFFC0' }}>
                    {!isNaN(averages.radiation) ? averages.radiation : ''}
                  </TableCell>
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
          </Grid>
        </Grid>

        {/* Instrucciones */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="body2">
            Este módulo calcula la evapotranspiración de referencia (ETo) utilizando el método Penman-Monteith de la FAO.
            Ingrese los datos climáticos mensuales respetando los rangos válidos y el sistema calculará automáticamente la radiación solar y ETo.
            Las celdas amarillas muestran los valores calculados.
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