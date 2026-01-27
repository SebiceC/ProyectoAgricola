import React, { useState, useCallback } from 'react';

// material-ui
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

// project imports
import MainCard from 'components/MainCard';

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Configuration() {
  const [activeTab, setActiveTab] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Configuración específica para Clima/ETo
  const [climateEtoConfig, setClimateEtoConfig] = useState({
    // Configuración de Datos
    etoCalculationMethod: 'full_climate_data', // 'full_climate_data' | 'temperature_only'
    temperatureMode: 'min_max', // 'min_max' | 'average'
    
    // Unidades
    humidityUnit: 'relative_percent', // 'relative_percent' | 'vapor_pressure_kpa'
    windSpeedUnit: 'meters_per_second', // 'kilometers_per_day' | 'meters_per_second'
    sunshineUnit: 'hours', // 'hours' | 'percentage_day_duration' | 'fraction_day_duration'
    etoUnit: 'mm_per_day' // 'mm_per_day' | 'mm_per_period'
  });

  // Configuraciones para otras pestañas (placeholder)
  const [precipitationConfig, setPrecipitationConfig] = useState({
    enabled: false,
    message: 'Configuración en desarrollo'
  });

  const [nonFloodableCropsConfig, setNonFloodableCropsConfig] = useState({
    enabled: false,
    message: 'Configuración en desarrollo'
  });

  const [riceConfig, setRiceConfig] = useState({
    enabled: false,
    message: 'Configuración en desarrollo'
  });

  const [soilPrepConfig, setSoilPrepConfig] = useState({
    enabled: false,
    message: 'Configuración en desarrollo'
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Update clima/ETo configuration
  const updateClimateEtoConfig = useCallback((field, value) => {
    setClimateEtoConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Save configuration
  const saveConfiguration = useCallback(() => {
    const fullConfig = {
      climateEto: climateEtoConfig,
      precipitation: precipitationConfig,
      nonFloodableCrops: nonFloodableCropsConfig,
      rice: riceConfig,
      soilPrep: soilPrepConfig
    };
    
    localStorage.setItem('etoCalculatorConfig', JSON.stringify(fullConfig));
    setShowSuccess(true);
  }, [climateEtoConfig, precipitationConfig, nonFloodableCropsConfig, riceConfig, soilPrepConfig]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setClimateEtoConfig({
      etoCalculationMethod: 'full_climate_data',
      temperatureMode: 'min_max',
      humidityUnit: 'relative_percent',
      windSpeedUnit: 'meters_per_second',
      sunshineUnit: 'hours',
      etoUnit: 'mm_per_day'
    });
  }, []);

  return (
    <MainCard title="Configuración del Sistema">
      <Box sx={{ width: '100%' }}>
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="configuration tabs">
            <Tab label="Clima/ETo" />
            <Tab label="Precipitación" />
            <Tab label="Prog. Cultivos No Inundables" />
            <Tab label="Prog. Arroz" />
            <Tab label="Preparación Suelo" />
          </Tabs>
        </Box>

        {/* Tab Panel 1: Clima/ETo */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            
            {/* Configuración de Datos */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardHeader 
                  title="Configuración de Datos"
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>ETo Penman-Monteith</InputLabel>
                        <Select
                          value={climateEtoConfig.etoCalculationMethod}
                          label="ETo Penman-Monteith"
                          onChange={(e) => updateClimateEtoConfig('etoCalculationMethod', e.target.value)}
                        >
                          <MenuItem value="full_climate_data">
                            ETo Penman calculada de datos climáticos
                          </MenuItem>
                          <MenuItem value="temperature_only">
                            ETo Penman calculada de datos de temperatura (otros datos estimados)
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Temperatura</InputLabel>
                        <Select
                          value={climateEtoConfig.temperatureMode}
                          label="Temperatura"
                          onChange={(e) => updateClimateEtoConfig('temperatureMode', e.target.value)}
                        >
                          <MenuItem value="min_max">Temperatura mínima/máxima</MenuItem>
                          <MenuItem value="average">Temperaturas medias</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Unidades */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardHeader 
                  title="Unidades"
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Humedad</InputLabel>
                        <Select
                          value={climateEtoConfig.humidityUnit}
                          label="Humedad"
                          onChange={(e) => updateClimateEtoConfig('humidityUnit', e.target.value)}
                        >
                          <MenuItem value="relative_percent">Humedad relativa en %</MenuItem>
                          <MenuItem value="vapor_pressure_kpa">Vapor presión kPa</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Velocidad del viento</InputLabel>
                        <Select
                          value={climateEtoConfig.windSpeedUnit}
                          label="Velocidad del viento"
                          onChange={(e) => updateClimateEtoConfig('windSpeedUnit', e.target.value)}
                        >
                          <MenuItem value="kilometers_per_day">Kilómetros por día</MenuItem>
                          <MenuItem value="meters_per_second">Metros por segundo</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Horas de insolación</InputLabel>
                        <Select
                          value={climateEtoConfig.sunshineUnit}
                          label="Horas de insolación"
                          onChange={(e) => updateClimateEtoConfig('sunshineUnit', e.target.value)}
                        >
                          <MenuItem value="hours">Horas de insolación</MenuItem>
                          <MenuItem value="percentage_day_duration">% porcentaje de duración del día</MenuItem>
                          <MenuItem value="fraction_day_duration">Fracción de duración del día</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>ETo</InputLabel>
                        <Select
                          value={climateEtoConfig.etoUnit}
                          label="ETo"
                          onChange={(e) => updateClimateEtoConfig('etoUnit', e.target.value)}
                        >
                          <MenuItem value="mm_per_day">mm por día</MenuItem>
                          <MenuItem value="mm_per_period">mm por período</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  onClick={resetToDefaults}
                  color="secondary"
                >
                  Restaurar Valores por Defecto
                </Button>
                <Button 
                  variant="contained" 
                  onClick={saveConfiguration}
                  color="primary"
                >
                  Guardar Configuración
                </Button>
              </Box>
            </Grid>

            {/* Information */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Configuración Clima/ETo:</strong> Estas opciones afectarán cómo se calculan y muestran 
                  los valores de evapotranspiración en el módulo ETo Penman-Monteith. Los cambios se aplicarán 
                  inmediatamente después de guardar.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab Panel 2: Precipitación */}
        <TabPanel value={activeTab} index={1}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Configuración de Precipitación
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Esta sección estará disponible próximamente.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
              Configuración en desarrollo...
            </Typography>
          </Paper>
        </TabPanel>

        {/* Tab Panel 3: Prog. Cultivos No Inundables */}
        <TabPanel value={activeTab} index={2}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Programación de Cultivos No Inundables
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Esta sección estará disponible próximamente.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
              Configuración en desarrollo...
            </Typography>
          </Paper>
        </TabPanel>

        {/* Tab Panel 4: Prog. Arroz */}
        <TabPanel value={activeTab} index={3}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Programación de Arroz
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Esta sección estará disponible próximamente.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
              Configuración en desarrollo...
            </Typography>
          </Paper>
        </TabPanel>

        {/* Tab Panel 5: Preparación Suelo */}
        <TabPanel value={activeTab} index={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Preparación de Suelo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Esta sección estará disponible próximamente.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
              Configuración en desarrollo...
            </Typography>
          </Paper>
        </TabPanel>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Configuración guardada exitosamente
        </Alert>
      </Snackbar>
    </MainCard>
  );
}