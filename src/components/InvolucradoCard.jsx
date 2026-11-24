import { SEXOS, TIPOS_VEHICULO } from '../data/catalogos'
import { Button, Chip, SelectField, TextField } from './ui'
import { IconoBasura } from './Iconos'

export default function InvolucradoCard({
  indice,
  involucrado,
  errores,
  onCambiar,
  onBlur,
  onQuitar,
  puedeQuitar,
}) {
  const numero = indice + 1
  const idBase = `inv-${involucrado.id}`

  return (
    <fieldset className="md-involucrado">
      <legend className="sr-only">Involucrado {numero}</legend>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="md-involucrado__numero" aria-hidden="true">
            {numero}
          </span>
          <span className="text-sm font-medium text-[var(--md-on-surface)]">
            Involucrado {numero}
          </span>
          <Chip tono={numero === 1 ? 'primary' : 'neutral'}>
            {numero === 1 ? 'Obligatorio' : 'Opcional'}
          </Chip>
        </div>

        {puedeQuitar ? (
          <Button
            variant="text"
            onClick={onQuitar}
            icon={<IconoBasura />}
            aria-label={`Quitar involucrado ${numero}`}
          >
            Quitar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id={`${idBase}-sexo`}
          label="Sexo"
          value={involucrado.sexo}
          onChange={(evento) => onCambiar('sexo', evento.target.value)}
          onBlur={() => onBlur('sexo')}
          error={errores.sexo}
          helper="M, F o ND."
          required
        >
          {SEXOS.map((sexo) => (
            <option key={sexo.valor} value={sexo.valor}>
              {sexo.etiqueta}
            </option>
          ))}
        </SelectField>

        <TextField
          id={`${idBase}-edad`}
          label="Edad (0–99)"
          type="number"
          min={0}
          max={99}
          step={1}
          inputMode="numeric"
          value={involucrado.edad}
          onChange={(evento) => onCambiar('edad', evento.target.value)}
          onBlur={() => onBlur('edad')}
          error={errores.edad}
          helper="Entero entre 0 y 99."
          required
        />

        <SelectField
          id={`${idBase}-tipo`}
          label="Tipo de vehículo"
          value={involucrado.tipo}
          onChange={(evento) => onCambiar('tipo', evento.target.value)}
          onBlur={() => onBlur('tipo')}
          error={errores.tipo}
          helper="18 tipos disponibles."
          required
        >
          {TIPOS_VEHICULO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </SelectField>
      </div>
    </fieldset>
  )
}
