# Cuentas Claras

**Colectas comunitarias con cuentas claras, sobre Stellar.**
Cada aporte y cada gasto queda en un libro de cuentas público, y ningún pago sale sin la firma de 2 de 3 responsables.
Es la tesorería del grupo de WhatsApp: quién puede mover la plata, cómo se entera el grupo y qué pasa con lo que sobra.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build estático en dist/ (sirve en Vercel, Netlify, etc.)
```

No requiere variables de entorno ni backend: la app habla directo con Stellar Testnet (Horizon + Friendbot).

## Flujo de la demo

1. **Crear colecta** (`#/crear`): una sola transacción crea la cuenta de la colecta, guarda título/meta/firmantes con `manageData`, agrega 3 firmantes (peso 1), fija umbrales en 2 y desactiva la llave maestra. Opcionalmente envía 3 aportes de ejemplo.
2. **Aportar**: el visitante recibe una billetera de prueba fondeada por Friendbot y envía un pago con memo. Se confirma en ~5 s.
3. **Gasto con 2 de 3 firmas**: la organizadora propone un pago a un proveedor (1 firma). Si se intenta enviar así, Stellar lo rechaza (`tx_bad_auth`). Con la aprobación de un tesorero (2 firmas), el pago se ejecuta.
4. **Devolver lo que sobra**: con el mismo 2 de 3, una sola transacción atómica con un pago por aporte (hasta 100) devuelve el saldo en proporción a lo que puso cada uno. En el libro aparece como una fila agrupada.
5. **Rendición por WhatsApp**: arma un resumen (recaudado, gastado, devuelto, disponible, último gasto con sus firmas) + enlace verificable y abre `wa.me`; el usuario elige el grupo.
6. **Libro de cuentas**: todo se lee de Horizon (`/accounts/:id/payments`), con enlace a cada transacción en Stellar Expert.

## Qué es real y qué es de demo

| Real (Stellar Testnet) | Simplificación de demo |
| --- | --- |
| Creación de cuenta, multifirma 2 de 3, llave maestra desactivada | Las 3 llaves firmantes se guardan en `localStorage` de un solo navegador |
| Aportes, gastos, devolución proporcional, rechazo `tx_bad_auth` | Se usa XLM de testnet en vez de USDC |
| Datos de la colecta y libro de cuentas leídos de la blockchain | Billeteras de donantes y proveedores creadas automáticamente |

## Código

- `src/lib/stellar.ts`: toda la lógica de Stellar (crear, aportar, proponer/firmar/enviar gasto o devolución, leer colecta y libro).
- `src/lib/store.ts`: llaves de demo y propuestas pendientes en `localStorage`.
- `src/components/`: Landing, CreateCampaign, CampaignPage, DonateCard, TreasuryCard.

Stack: Vite, React, TypeScript, Tailwind CSS v4, `@stellar/stellar-sdk`.
