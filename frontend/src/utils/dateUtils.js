// frontend/src/utils/dateUtils.js

/**
 * Convierte cualquier fecha que venga del Backend a un objeto Date seguro de JS
 */
const parseBackendDate = (dateString) => {
    if (!dateString) return null;

    // Si viene como DD/MM/YYYY (Ej: 31/01/2026) -> Lo convertimos a YYYY-MM-DD para JS
    if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}T12:00:00`); // Mediodía para evitar líos de zona horaria
    }

    // Si viene como YYYY-MM-DD (Ej: 2026-01-31)
    return new Date(dateString + 'T12:00:00');
};

/**
 * Muestra la fecha bonita en la tabla (DD/MM/YYYY)
 */
export const toStandardDate = (dateInput) => {
    if (!dateInput) return '-';
    
    // Si ya viene formateada (31/01/2026), la dejamos quieta
    if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
        return dateInput;
    }

    try {
        const date = parseBackendDate(dateInput);
        if (!date || isNaN(date.getTime())) return dateInput; // Si falla, devuelve el original

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateInput;
    }
};

/**
 * Prepara la fecha del Input HTML (YYYY-MM-DD) para enviarla al API
 * Si el backend acepta YYYY-MM-DD, devolvemos eso.
 */
export const inputToApiFormat = (htmlDateString) => {
    return htmlDateString; // Mantenemos simple YYYY-MM-DD para el envío
};