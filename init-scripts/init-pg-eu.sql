CREATE TABLE IF NOT EXISTS aviones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    asientos_regular INTEGER,
    asientos_vip INTEGER,
    fabricante VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS ciudades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10),
    pais VARCHAR(100),
    region VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS puertas (
    id SERIAL PRIMARY KEY,
    puerta VARCHAR(10),
    id_ciudad INTEGER REFERENCES ciudades(id)
);

CREATE TABLE IF NOT EXISTS asientos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10),
    id_avion INTEGER REFERENCES aviones(id),
    estado VARCHAR(20),
    clase VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS estados_vuelo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS vuelos (
    id SERIAL PRIMARY KEY,
    id_origen INTEGER REFERENCES ciudades(id),
    id_destino INTEGER REFERENCES ciudades(id),
    id_estado_vuelo INTEGER REFERENCES estados_vuelo(id),
    id_puerta INTEGER REFERENCES puertas(id),
    id_avion INTEGER REFERENCES aviones(id),
    llegada_programada BIGINT,
    salida_programada BIGINT,
    llegada_real BIGINT,
    salida_real BIGINT,
    fecha_llegada BIGINT,
    fecha_salida BIGINT
);

CREATE TABLE IF NOT EXISTS boletos (
    id_boleto SERIAL PRIMARY KEY,
    nombre_pasajero VARCHAR(255),
    email_pasajero VARCHAR(255),
    id_vuelo INTEGER REFERENCES vuelos(id),
    id_asiento INTEGER REFERENCES asientos(id),
    costo DECIMAL(10, 2),
    tiempo_de_viaje INTEGER,
    pasaporte VARCHAR(50),
    estado VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS precios (
    id SERIAL PRIMARY KEY,
    matriz_precios_regular JSONB,
    matriz_precios_vip JSONB
);

CREATE TABLE IF NOT EXISTS detalles_vuelos (
    id SERIAL PRIMARY KEY,
    matriz_tiempos JSONB
);

-- Basic data
INSERT INTO estados_vuelo (nombre) VALUES ('SCHEDULED'), ('BOARDING'), ('DEPARTED'), ('IN_FLIGHT'), ('LANDED'), ('ARRIVED') ON CONFLICT DO NOTHING;

INSERT INTO aviones (nombre, asientos_regular, asientos_vip, fabricante) VALUES 
('Airbus A380-800', 439, 10, 'Airbus'), 
('Boeing 777-300ER', 300, 10, 'Boeing'),
('Airbus A350-900', 250, 12, 'Airbus'),
('Boeing 787-9 Dreamliner', 220, 8, 'Boeing')
ON CONFLICT DO NOTHING;

-- Ciudades representativas
INSERT INTO ciudades (codigo, pais, region) VALUES 
('ATL', 'Estados Unidos', 'America'),
('PEK', 'China', 'Asia'),
('DXB', 'Emiratos', 'Asia'),
('TYO', 'Japon', 'Asia'),
('LON', 'Reino Unido', 'Europa'),
('LAX', 'Estados Unidos', 'America'),
('PAR', 'Francia', 'Europa'),
('FRA', 'Alemania', 'Europa'),
('IST', 'Turquia', 'Europa'),
('SIN', 'Singapur', 'Asia'),
('MAD', 'España', 'Europa'),
('AMS', 'Países Bajos', 'Europa'),
('DFW', 'Estados Unidos', 'America'),
('CAN', 'China', 'Asia'),
('SAO', 'Brasil', 'America')
ON CONFLICT DO NOTHING;

-- Puertas basicas
INSERT INTO puertas (puerta, id_ciudad) VALUES 
('Gate A1', 1), ('Gate B2', 2), ('Gate C1', 3), ('Gate D4', 4),
('Gate E1', 5), ('Gate A2', 6), ('Gate B1', 7), ('Gate C2', 8),
('Gate D1', 9), ('Gate E2', 10), ('Gate A3', 11), ('Gate B3', 12),
('Gate C3', 13), ('Gate D2', 14), ('Gate E3', 15)
ON CONFLICT DO NOTHING;
