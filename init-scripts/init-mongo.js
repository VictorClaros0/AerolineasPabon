db = db.getSiblingDB('airres_sync');

// Create collections
db.createCollection('aviones');
db.createCollection('ciudades');
db.createCollection('puertas');
db.createCollection('asientos');
db.createCollection('estados_vuelo');
db.createCollection('vuelos');
db.createCollection('boletos');
db.createCollection('precios');
db.createCollection('detalles_vuelos');

// Basic data for estados_vuelo
db.estados_vuelo.insertMany([
  { id: 1, nombre: 'SCHEDULED' },
  { id: 2, nombre: 'BOARDING' },
  { id: 3, nombre: 'DEPARTED' },
  { id: 4, nombre: 'IN_FLIGHT' },
  { id: 5, nombre: 'LANDED' },
  { id: 6, nombre: 'ARRIVED' }
]);

// Ciudades representativas
db.ciudades.insertMany([
  { id: 1, codigo: 'ATL', pais: 'Estados Unidos', region: 'America' },
  { id: 2, codigo: 'PEK', pais: 'China', region: 'Asia' },
  { id: 3, codigo: 'DXB', pais: 'Emiratos', region: 'Asia' },
  { id: 4, codigo: 'TYO', pais: 'Japon', region: 'Asia' },
  { id: 5, codigo: 'LON', pais: 'Reino Unido', region: 'Europa' },
  { id: 6, codigo: 'LAX', pais: 'Estados Unidos', region: 'America' },
  { id: 7, codigo: 'PAR', pais: 'Francia', region: 'Europa' },
  { id: 8, codigo: 'FRA', pais: 'Alemania', region: 'Europa' },
  { id: 9, codigo: 'IST', pais: 'Turquia', region: 'Europa' },
  { id: 10, codigo: 'SIN', pais: 'Singapur', region: 'Asia' },
  { id: 11, codigo: 'MAD', pais: 'Espana', region: 'Europa' },
  { id: 12, codigo: 'AMS', pais: 'Paises Bajos', region: 'Europa' },
  { id: 13, codigo: 'DFW', pais: 'Estados Unidos', region: 'America' },
  { id: 14, codigo: 'CAN', pais: 'China', region: 'Asia' },
  { id: 15, codigo: 'SAO', pais: 'Brasil', region: 'America' }
]);

// Aviones
db.aviones.insertMany([
  { id: 1, nombre: 'Airbus A380-800', asientos_regular: 439, asientos_vip: 10, fabricante: 'Airbus' },
  { id: 2, nombre: 'Boeing 777-300ER', asientos_regular: 300, asientos_vip: 10, fabricante: 'Boeing' },
  { id: 3, nombre: 'Airbus A350-900', asientos_regular: 250, asientos_vip: 12, fabricante: 'Airbus' },
  { id: 4, nombre: 'Boeing 787-9 Dreamliner', asientos_regular: 220, asientos_vip: 8, fabricante: 'Boeing' }
]);

// Puertas
db.puertas.insertMany([
  { id: 1, puerta: 'Gate A1', id_ciudad: 1 },
  { id: 2, puerta: 'Gate B2', id_ciudad: 2 },
  { id: 3, puerta: 'Gate C1', id_ciudad: 3 },
  { id: 4, puerta: 'Gate D4', id_ciudad: 4 },
  { id: 5, puerta: 'Gate E1', id_ciudad: 5 },
  { id: 6, puerta: 'Gate A2', id_ciudad: 6 },
  { id: 7, puerta: 'Gate B1', id_ciudad: 7 },
  { id: 8, puerta: 'Gate C2', id_ciudad: 8 },
  { id: 9, puerta: 'Gate D1', id_ciudad: 9 },
  { id: 10, puerta: 'Gate E2', id_ciudad: 10 },
  { id: 11, puerta: 'Gate A3', id_ciudad: 11 },
  { id: 12, puerta: 'Gate B3', id_ciudad: 12 },
  { id: 13, puerta: 'Gate C3', id_ciudad: 13 },
  { id: 14, puerta: 'Gate D2', id_ciudad: 14 },
  { id: 15, puerta: 'Gate E3', id_ciudad: 15 }
]);
