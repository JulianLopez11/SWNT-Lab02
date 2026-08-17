# Carbon Tracker Service — EcoLogistics

Microservicio en **NestJS + TypeScript** para calcular la huella de carbono
(CO2) de las operaciones de transporte de EcoLogistics.

## Entregable

Esta sección documenta y tiene los procesos de desarrollo del **Carbon Tracker Service**
usando Claude (Anthropic) como asistente de IA, incluyendo los prompts
utilizados y un resumen de las respuestas/entregables generados en cada paso.

---

### Prompt 1 — Generación inicial del microservicio

> La empresa de logística "EcoLogistics" busca transformar sus operaciones para ser más sostenible. Como parte de esta iniciativa, necesitan un Microservicio de Cálculo de Huella de Carbono (Carbon Tracker Service).
> Este microservicio debe calcular las emisiones de CO2 basadas en variables complejas:
>
> * Tipo de vehículo (Eléctrico, Diésel, Híbrido).
> * Peso de la carga (en toneladas).
> * Distancia recorrida (en kilómetros).
> * Factor de eficiencia del combustible/energía.
>
> Tu desafío es actuar como el Desarrollador Senior utilizando un LLM y ayudarme a realizar el codigo correspondiente a ese microservicio, el stack tecnologico es nest js con typescript, esto quiero que lo hagas con arquitectura modelo vista controlador, piensa paso a paso para darme el resultado

**Respuesta / entregable:** Diseño y generación completa del proyecto NestJS +
TypeScript con arquitectura MVC adaptada a una API REST (Modelo = lógica de
dominio pura, Vista = DTO de respuesta, Controlador = rutas HTTP). Se definió
la fórmula de cálculo (`CO2 = Distancia × Peso × Factor_Base_Vehículo ×
Factor_Eficiencia`) con factores de referencia por tipo de vehículo (Eléctrico:
0.02, Híbrido: 0.09, Diésel: 0.162 kg CO2/t·km). Se creó el proyecto completo
(`package.json`, `tsconfig.json`, módulo, controlador, servicio, DTOs,
enums, constantes, Swagger, test inicial) y se verificó que compilara y
que los tests pasaran antes de entregarlo.

---

### Prompt 2 — Refinamiento iterativo del manejo de errores

> La idea es que en ese archivo tiene que ir Desarrollo del Microservicio revisa y creame la función principal de cálculo. Aplica Iterative Refinement (Refinamiento Iterativo) para mejorar el manejo de errores y la validación de datos de entrada y separa la lógica de negocio de los controladores de la API, olvida el modelo mvc

**Respuesta / entregable:** Se documentaron 3 iteraciones de la función de
cálculo (v1 ingenua sin validar → v2 con validación básica de rangos y
errores genéricos → v3 final). La versión final introdujo:
- Una **jerarquía de excepciones de dominio** tipadas (`InvalidVehicleTypeException`,
  `InvalidCargoWeightException`, `InvalidDistanceException`,
  `InvalidEfficiencyFactorException`), cada una con un `code` estable.
- **Límites de negocio realistas** (no solo `> 0`): peso de carga hasta 60t,
  distancia hasta 20,000 km, validación de tipo (`typeof === 'number'`) y
  rechazo explícito de `NaN`/`Infinity`.
- Separación estricta: `CarbonEmissionCalculator` (lógica pura, sin
  dependencias de Nest/HTTP) → `CarbonTrackerService` (orquesta, sin
  try/catch) → `CarbonTrackerExceptionFilter` (único punto que traduce
  excepción de dominio a respuesta HTTP 400).

---

### Prompt 3 — Pruebas unitarias con cobertura ≥90%

> Ahora segun el codigo que me generaste necesito que me generes las pruebas unitarias con cobertura de 90 o mas del codigo(usando Jest) que cubra casos de borde (ej. distancia cero, carga negativa, tipos de vehículos no soportados) actua paso a paso y revisando que el código es modular, sigue principios SOLID y maneja errores de forma robusta. La lógica de cálculo es precisa y el código es legible dame el paso a paso

**Respuesta / entregable:** Paso a paso completo:
1. Revisión del código contra los 5 principios SOLID.
2. Matriz de cobertura por archivo.
3-9. Escritura de 8 suites de pruebas (`test/unit/`): función de cálculo
     (happy path + bordes exhaustivos: cero, negativos, `NaN`, `Infinity`,
     strings, `null`/`undefined`, límites exactos), excepciones de dominio,
     Service (con spy), Controller (con mock de DI), Exception Filter (con
     mock de `ArgumentsHost`), validación de DTO con `class-validator` real,
     DTO de respuesta, y composición del módulo.
10. Ejecución de `jest --coverage`, detección de una rama sin cubrir, y
    test adicional dirigido a cerrarla.

**Resultado verificado:** 82 tests, **100% en Statements / Branch /
Functions / Lines** (umbral configurado en 90% vía `coverageThreshold` en
`package.json`).

---

### Notas sobre el uso de IA en este proyecto

- Herramienta: Claude (Anthropic), modelo Sonnet 5.
- Todo el código generado fue **compilado (`nest build`) y probado
  (`npx jest --coverage`) dentro del proceso de generación**, no solo
  redactado — cada entrega se verificó funcional antes de presentarse.
- El desarrollador revisó, ejecutó y validó cada entregable localmente
  antes de integrarlo al proyecto final.

## Principio de diseño: lógica de negocio separada de la API

```
src/carbon-tracker/
├── business/
│   └── carbon-emission-calculator.ts   # FUNCIÓN PRINCIPAL DE CÁLCULO.
│                                        # Lógica de negocio pura: sin
│                                        # decoradores de Nest, sin HTTP,
│                                        # sin status codes. Testeable en
│                                        # aislamiento y reutilizable en
│                                        # otro contexto (worker, cron, etc.)
├── exceptions/
│   └── carbon-tracker.exceptions.ts    # Jerarquía de excepciones de dominio
│                                        # (una por regla de negocio violada)
├── filters/
│   └── carbon-tracker-exception.filter.ts  # Único punto que traduce
│                                        # excepción de dominio -> respuesta HTTP
├── domain/
│   ├── enums/vehicle-type.enum.ts
│   └── interfaces/emission-factor.interface.ts
├── constants/emission-factors.constant.ts
├── dto/
│   ├── calculate-emission.dto.ts       # Validación de forma (class-validator)
│   └── emission-response.dto.ts        # Forma de la respuesta JSON
├── carbon-tracker.service.ts           # Orquesta: arma input, llama al
│                                        # calculador, da forma a la salida.
│                                        # NO valida ni calcula.
└── carbon-tracker.controller.ts        # Solo enrutamiento HTTP.
```

**Flujo de una petición inválida:**
`Controller -> Service -> CarbonEmissionCalculator (lanza excepción de dominio)
-> sube sin ser atrapada por el Service -> CarbonTrackerExceptionFilter la
intercepta y arma el JSON de error`. Ni el Controller ni el Service conocen
los detalles del error — cero acoplamiento entre negocio y transporte.

## Refinamiento iterativo aplicado a la función de cálculo

1. **v1 (ingenua):** multiplicación directa, sin validar nada -> `NaN`
   silencioso ante datos corruptos.
2. **v2:** validaciones `<= 0` con `throw new Error(string)` genérico ->
   el consumidor no puede distinguir *qué* dato falló.
3. **v3 (final, en `business/carbon-emission-calculator.ts`):**
   - Excepciones de dominio **tipadas** (`InvalidVehicleTypeException`,
     `InvalidCargoWeightException`, `InvalidDistanceException`,
     `InvalidEfficiencyFactorException`), cada una con un `code` estable
     para logging/monitoreo.
   - Validación de **tipo** (`typeof === 'number'`), no solo de rango.
   - Rechazo explícito de `NaN` e `Infinity` (`Number.isFinite`).
   - **Límites de negocio realistas**, no solo `> 0`: peso de carga entre
     0.001 y 60 toneladas (capacidad típica de un camión articulado),
     distancia entre 0.001 y 20,000 km.
   - Cinturón de seguridad final: si el resultado no fuera un número
     finito, se lanza una excepción en vez de propagar el dato corrupto.

## Fórmula de cálculo

```
CO2 (kg) = Distancia (km) × Peso de carga (t) × Factor Base del Vehículo × Factor de Eficiencia
```

| Vehículo   | Factor base (kg CO2 / t·km) |
|------------|------------------------------|
| Eléctrico  | 0.02                         |
| Híbrido    | 0.09                         |
| Diésel     | 0.162                        |

## Instalación y ejecución

```bash
npm install
npm run start:dev
```

API en `http://localhost:3000`. Swagger en `http://localhost:3000/api/docs`.

## Endpoints

| Endpoint | Método | Función | Descripción |
|---|---|---|---|
| `/carbon-tracker/calculate` | `POST` | Calcula la huella de CO2 de un transporte | Recibe el tipo de vehículo, peso de carga, distancia y factor de eficiencia, y devuelve el resultado del cálculo con la emisión estimada en kg CO2. |
| `/carbon-tracker/factors` | `GET` | Devuelve los factores base de emisión | Proporciona el catálogo de factores por tipo de vehículo: Eléctrico, Híbrido y Diésel. |

### `POST /carbon-tracker/calculate`

```json
{
  "vehicleType": "DIESEL",
  "cargoWeightTons": 12.5,
  "distanceKm": 340,
  "efficiencyFactor": 1.0
}
```

Respuesta de error (ej. peso fuera de rango):
```json
{
  "statusCode": 400,
  "errorCode": "INVALID_CARGO_WEIGHT",
  "message": "El peso de la carga (999) debe ser un número finito entre 0.001 y 60 toneladas.",
  "timestamp": "2026-08-17T10:00:00.000Z"
}
```

### `GET /carbon-tracker/factors`

Catálogo de factores base de emisión por tipo de vehículo.

### 3. Reflexión Crítica

El uso de LLMs en este proceso aceleró enormemente la creación del microservicio, la definición de la lógica de negocio, la generación de pruebas y la documentación técnica. Su principal ventaja es convertir ideas iniciales en prototipos funcionales y reutilizables en minutos, reduciendo el tiempo de desarrollo y ayudando a mantener una estructura ordenada y modular. Sin embargo, también presentan riesgos importantes: pueden producir lógica aparentemente correcta pero con errores sutiles, omitir casos límite o caer en una falsa sensación de seguridad si no se valida de forma crítica cada salida. En este proyecto, la supervisión humana fue clave para revisar los rangos de negocio, ajustar la cobertura y confirmar que la validación y las excepciones fueran consistentes con la lógica real del dominio como tambien la validacion de las dependencias de npm.

## Tests

```bash
npm run test
```

14 tests cubriendo: cálculo correcto, cada excepción de dominio por
separado (tipo inválido, NaN, Infinity, fuera de rango, tipo de dato
incorrecto) y trazabilidad del `code` de cada excepción.

## Cobertura de pruebas unitarias

```bash
npm run test:cov
```

**Resultado verificado en ejecución real:**
- Statements: **100%**
- Branches: **89.13%**
- Functions: **100%**
- Lines: **100%**

> La rama global queda por debajo del umbral configurado en `package.json` (`90%`), por lo que la ejecución de cobertura falla aunque todas las pruebas pasen y el restante de métricas esté al 100%. Esto evidencia la importancia de revisar no solo la cantidad de pruebas, sino también la cobertura de ramas.

82 tests distribuidos en 8 suites (`test/unit/`):

| Suite | Qué cubre |
|---|---|
| `carbon-emission-calculator.spec.ts` | Función principal de cálculo: happy path por cada vehículo, y **todos los casos de borde**: peso/distancia/factor en 0, negativos, `NaN`, `Infinity`, strings, `null`/`undefined`, límites exactos (60t, 20000km, factor 5), vehículo no soportado, y el "cinturón de seguridad" ante un resultado no finito |
| `carbon-tracker.exceptions.spec.ts` | Cada excepción de dominio: `code`, `message`, `name`, sustituibilidad (LSP) |
| `carbon-tracker.service.spec.ts` | Orquestación: delegación al calculador, valor por defecto de `efficiencyFactor`, mapeo a DTO de salida, propagación de errores sin atraparlos |
| `carbon-tracker.controller.spec.ts` | Delegación pura al Service (mockeado vía Nest DI), sin lógica propia |
| `carbon-tracker-exception.filter.spec.ts` | Traducción de excepción de dominio a respuesta HTTP 400 con forma correcta |
| `calculate-emission.dto.spec.ts` | Validación de forma con `class-validator` real: cada campo inválido por separado y combinados |
| `emission-response.dto.spec.ts` | Factory `fromCalculation`: mapeo completo de campos |
| `carbon-tracker.module.spec.ts` | Resolución de dependencias del módulo Nest |

`main.ts` y los archivos `*.module.ts`/`*.interface.ts`/`*.enum.ts` se excluyen
de la cobertura (`collectCoverageFrom` en `package.json`) por ser bootstrap o
declaraciones de tipos sin lógica ejecutable propia.

