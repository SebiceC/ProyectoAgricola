--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Ubuntu 17.4-1.pgdg24.04+2)
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cultivo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cultivo (
    id_cultivo integer NOT NULL,
    nombre_cultivo character varying,
    fecha_siembra date,
    fecha_cosecha date,
    profundidad_radicular double precision,
    factor_agotamiento double precision,
    factor_respuesta double precision
);


ALTER TABLE public.cultivo OWNER TO postgres;

--
-- Name: cultivo_id_cultivo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cultivo_id_cultivo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultivo_id_cultivo_seq OWNER TO postgres;

--
-- Name: cultivo_id_cultivo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cultivo_id_cultivo_seq OWNED BY public.cultivo.id_cultivo;


--
-- Name: cultivo_suelo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cultivo_suelo (
    id_cultivo integer NOT NULL,
    id_suelo integer NOT NULL,
    eficiencia_riego double precision
);


ALTER TABLE public.cultivo_suelo OWNER TO postgres;

--
-- Name: cultivo_ubicacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cultivo_ubicacion (
    id_cultivo integer NOT NULL,
    id_ubicacion integer NOT NULL
);


ALTER TABLE public.cultivo_ubicacion OWNER TO postgres;

--
-- Name: etapa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etapa (
    id_automatico integer NOT NULL,
    id_cultivo integer,
    diametro double precision,
    kc_inicial double precision,
    kc_medio double precision,
    etapa character varying
);


ALTER TABLE public.etapa OWNER TO postgres;

--
-- Name: etapa_id_automatico_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etapa_id_automatico_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etapa_id_automatico_seq OWNER TO postgres;

--
-- Name: etapa_id_automatico_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etapa_id_automatico_seq OWNED BY public.etapa.id_automatico;


--
-- Name: eto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eto (
    id integer NOT NULL,
    lugar_id integer,
    usuario_id integer,
    tmin double precision,
    tmax double precision,
    humedad double precision,
    velocidad_vento double precision,
    insolacion double precision
);


ALTER TABLE public.eto OWNER TO postgres;

--
-- Name: eto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eto_id_seq OWNER TO postgres;

--
-- Name: eto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eto_id_seq OWNED BY public.eto.id;


--
-- Name: precipitacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.precipitacion (
    id_precipitacion integer NOT NULL,
    id_ubicacion integer,
    fecha date,
    precipitation_total double precision,
    precipitation_efectiva double precision
);


ALTER TABLE public.precipitacion OWNER TO postgres;

--
-- Name: precipitacion_id_precipitacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.precipitacion_id_precipitacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.precipitacion_id_precipitacion_seq OWNER TO postgres;

--
-- Name: precipitacion_id_precipitacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.precipitacion_id_precipitacion_seq OWNED BY public.precipitacion.id_precipitacion;


--
-- Name: riego; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.riego (
    id integer NOT NULL,
    cultivo_id integer,
    ubicacion_id integer,
    fecha_hora timestamp without time zone,
    cantidad_agua double precision,
    metodo_riego character varying,
    tipo_riego character varying,
    eficiencia_rie double precision
);


ALTER TABLE public.riego OWNER TO postgres;

--
-- Name: riego_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.riego_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.riego_id_seq OWNER TO postgres;

--
-- Name: riego_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.riego_id_seq OWNED BY public.riego.id;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol (
    nombre_rol character varying NOT NULL,
    descripcion_rol text,
    permisos_rol text
);


ALTER TABLE public.rol OWNER TO postgres;

--
-- Name: suelo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suelo (
    id_suelo integer NOT NULL,
    tipo_suelo character varying,
    caracteristicas text
);


ALTER TABLE public.suelo OWNER TO postgres;

--
-- Name: suelo_id_suelo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suelo_id_suelo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suelo_id_suelo_seq OWNER TO postgres;

--
-- Name: suelo_id_suelo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suelo_id_suelo_seq OWNED BY public.suelo.id_suelo;


--
-- Name: ubicacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicacion (
    ubicacion_id integer NOT NULL,
    nombre character varying,
    pais character varying,
    altitud double precision,
    longitud double precision,
    latitud double precision
);


ALTER TABLE public.ubicacion OWNER TO postgres;

--
-- Name: ubicacion_ubicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ubicacion_ubicacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ubicacion_ubicacion_id_seq OWNER TO postgres;

--
-- Name: ubicacion_ubicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ubicacion_ubicacion_id_seq OWNED BY public.ubicacion.ubicacion_id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre_usuario character varying,
    apellido_usuario character varying,
    email_usuario character varying,
    "contraseña_hash_usuario" character varying,
    rol_id character varying
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- Name: cultivo id_cultivo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo ALTER COLUMN id_cultivo SET DEFAULT nextval('public.cultivo_id_cultivo_seq'::regclass);


--
-- Name: etapa id_automatico; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etapa ALTER COLUMN id_automatico SET DEFAULT nextval('public.etapa_id_automatico_seq'::regclass);


--
-- Name: eto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eto ALTER COLUMN id SET DEFAULT nextval('public.eto_id_seq'::regclass);


--
-- Name: precipitacion id_precipitacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precipitacion ALTER COLUMN id_precipitacion SET DEFAULT nextval('public.precipitacion_id_precipitacion_seq'::regclass);


--
-- Name: riego id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riego ALTER COLUMN id SET DEFAULT nextval('public.riego_id_seq'::regclass);


--
-- Name: suelo id_suelo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suelo ALTER COLUMN id_suelo SET DEFAULT nextval('public.suelo_id_suelo_seq'::regclass);


--
-- Name: ubicacion ubicacion_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicacion ALTER COLUMN ubicacion_id SET DEFAULT nextval('public.ubicacion_ubicacion_id_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- Data for Name: cultivo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cultivo (id_cultivo, nombre_cultivo, fecha_siembra, fecha_cosecha, profundidad_radicular, factor_agotamiento, factor_respuesta) FROM stdin;
1	Maíz	2024-10-01	2025-02-01	1.2	0.55	0.9
2	Trigo	2024-06-15	2024-11-01	1	0.5	0.85
3	Tomate	2024-09-10	2025-01-10	0.6	0.45	0.95
4	Papa	2024-07-20	2024-12-10	0.8	0.5	0.88
5	Soya	2024-11-01	2025-03-20	1.3	0.6	0.92
\.


--
-- Data for Name: cultivo_suelo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cultivo_suelo (id_cultivo, id_suelo, eficiencia_riego) FROM stdin;
1	1	0.75
1	3	0.7
2	2	0.85
3	4	0.8
4	5	0.65
\.


--
-- Data for Name: cultivo_ubicacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cultivo_ubicacion (id_cultivo, id_ubicacion) FROM stdin;
1	1
2	2
3	3
4	4
5	5
\.


--
-- Data for Name: etapa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etapa (id_automatico, id_cultivo, diametro, kc_inicial, kc_medio, etapa) FROM stdin;
1	1	0.2	0.3	1.1	Inicial
2	1	0.5	0.6	1.15	Desarrollo
3	2	0.4	0.4	1.05	Media
4	3	0.3	0.5	1.2	Floración
5	4	0.2	0.35	1	Madurez
\.


--
-- Data for Name: eto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eto (id, lugar_id, usuario_id, tmin, tmax, humedad, velocidad_vento, insolacion) FROM stdin;
1	1	1	12.5	25	60	2.5	7
2	2	2	10	22	55	3	6.5
3	3	3	18	30	70	2	8
4	4	4	5	15	80	1.5	5
5	5	5	20	32	50	3.5	9
\.


--
-- Data for Name: precipitacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.precipitacion (id_precipitacion, id_ubicacion, fecha, precipitation_total, precipitation_efectiva) FROM stdin;
1	1	2025-01-01	15.4	10.2
2	2	2025-01-02	22.1	16.5
3	3	2025-01-03	8	6.5
4	4	2025-01-04	30	21
5	5	2025-01-05	12.5	9
\.


--
-- Data for Name: riego; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.riego (id, cultivo_id, ubicacion_id, fecha_hora, cantidad_agua, metodo_riego, tipo_riego, eficiencia_rie) FROM stdin;
1	1	1	2025-01-10 08:00:00	20	goteo	superficial	0.8
2	2	2	2025-01-11 09:00:00	25	aspersión	presurizado	0.75
3	3	3	2025-01-12 07:30:00	15	surcos	gravedad	0.7
4	4	4	2025-01-13 06:45:00	18	goteo	superficial	0.82
5	5	5	2025-01-14 08:15:00	22	aspersión	presurizado	0.78
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (nombre_rol, descripcion_rol, permisos_rol) FROM stdin;
admin	Administrador del sistema	todos
tecnico	Técnico agrícola	lectura, escritura
consultor	Consultor externo	lectura
productor	Productor agrícola	lectura
invitado	Acceso limitado	lectura limitada
\.


--
-- Data for Name: suelo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suelo (id_suelo, tipo_suelo, caracteristicas) FROM stdin;
1	Franco arenoso	Bien drenado, bajo contenido de materia orgánica
2	Arcilloso	Alta retención de agua
3	Limoso	Buena fertilidad y drenaje medio
4	Franco	Equilibrado entre arena, limo y arcilla
5	Arenoso	Drenaje rápido, baja retención de nutrientes
\.


--
-- Data for Name: ubicacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ubicacion (ubicacion_id, nombre, pais, altitud, longitud, latitud) FROM stdin;
1	Valle Central	Chile	500	-70.666	-33.4489
2	La Sabana	Colombia	2600	-74.08	4.65
3	Yucatán	México	12	-89.621	20.97
4	Altiplano	Bolivia	3800	-68.119	-16.5
5	Pampa Húmeda	Argentina	100	-60	-34
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre_usuario, apellido_usuario, email_usuario, "contraseña_hash_usuario", rol_id) FROM stdin;
1	Ana	Gómez	ana@cropwat.com	hash1	admin
2	Luis	Martínez	luis@cropwat.com	hash2	tecnico
3	Carlos	Pérez	carlos@cropwat.com	hash3	consultor
4	María	Lopez	maria@cropwat.com	hash4	productor
5	Elena	Torres	elena@cropwat.com	hash5	invitado
\.


--
-- Name: cultivo_id_cultivo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cultivo_id_cultivo_seq', 5, true);


--
-- Name: etapa_id_automatico_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etapa_id_automatico_seq', 5, true);


--
-- Name: eto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eto_id_seq', 5, true);


--
-- Name: precipitacion_id_precipitacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.precipitacion_id_precipitacion_seq', 5, true);


--
-- Name: riego_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.riego_id_seq', 5, true);


--
-- Name: suelo_id_suelo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suelo_id_suelo_seq', 5, true);


--
-- Name: ubicacion_ubicacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicacion_ubicacion_id_seq', 5, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 5, true);


--
-- Name: cultivo cultivo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo
    ADD CONSTRAINT cultivo_pkey PRIMARY KEY (id_cultivo);


--
-- Name: cultivo_suelo cultivo_suelo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_suelo
    ADD CONSTRAINT cultivo_suelo_pkey PRIMARY KEY (id_cultivo, id_suelo);


--
-- Name: cultivo_ubicacion cultivo_ubicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_ubicacion
    ADD CONSTRAINT cultivo_ubicacion_pkey PRIMARY KEY (id_cultivo, id_ubicacion);


--
-- Name: etapa etapa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etapa
    ADD CONSTRAINT etapa_pkey PRIMARY KEY (id_automatico);


--
-- Name: eto eto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eto
    ADD CONSTRAINT eto_pkey PRIMARY KEY (id);


--
-- Name: precipitacion precipitacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precipitacion
    ADD CONSTRAINT precipitacion_pkey PRIMARY KEY (id_precipitacion);


--
-- Name: riego riego_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riego
    ADD CONSTRAINT riego_pkey PRIMARY KEY (id);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (nombre_rol);


--
-- Name: suelo suelo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suelo
    ADD CONSTRAINT suelo_pkey PRIMARY KEY (id_suelo);


--
-- Name: ubicacion ubicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicacion
    ADD CONSTRAINT ubicacion_pkey PRIMARY KEY (ubicacion_id);


--
-- Name: usuarios usuarios_email_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_usuario_key UNIQUE (email_usuario);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: cultivo_suelo cultivo_suelo_id_cultivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_suelo
    ADD CONSTRAINT cultivo_suelo_id_cultivo_fkey FOREIGN KEY (id_cultivo) REFERENCES public.cultivo(id_cultivo);


--
-- Name: cultivo_suelo cultivo_suelo_id_suelo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_suelo
    ADD CONSTRAINT cultivo_suelo_id_suelo_fkey FOREIGN KEY (id_suelo) REFERENCES public.suelo(id_suelo);


--
-- Name: cultivo_ubicacion cultivo_ubicacion_id_cultivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_ubicacion
    ADD CONSTRAINT cultivo_ubicacion_id_cultivo_fkey FOREIGN KEY (id_cultivo) REFERENCES public.cultivo(id_cultivo);


--
-- Name: cultivo_ubicacion cultivo_ubicacion_id_ubicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultivo_ubicacion
    ADD CONSTRAINT cultivo_ubicacion_id_ubicacion_fkey FOREIGN KEY (id_ubicacion) REFERENCES public.ubicacion(ubicacion_id);


--
-- Name: etapa etapa_id_cultivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etapa
    ADD CONSTRAINT etapa_id_cultivo_fkey FOREIGN KEY (id_cultivo) REFERENCES public.cultivo(id_cultivo);


--
-- Name: eto eto_lugar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eto
    ADD CONSTRAINT eto_lugar_id_fkey FOREIGN KEY (lugar_id) REFERENCES public.ubicacion(ubicacion_id);


--
-- Name: eto eto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eto
    ADD CONSTRAINT eto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id_usuario);


--
-- Name: precipitacion precipitacion_id_ubicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precipitacion
    ADD CONSTRAINT precipitacion_id_ubicacion_fkey FOREIGN KEY (id_ubicacion) REFERENCES public.ubicacion(ubicacion_id);


--
-- Name: riego riego_cultivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riego
    ADD CONSTRAINT riego_cultivo_id_fkey FOREIGN KEY (cultivo_id) REFERENCES public.cultivo(id_cultivo);


--
-- Name: riego riego_ubicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riego
    ADD CONSTRAINT riego_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicacion(ubicacion_id);


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(nombre_rol);


--
-- PostgreSQL database dump complete
--

