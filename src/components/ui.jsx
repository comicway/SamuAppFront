import { IconoChevronAbajo } from './Iconos'

function clasesError(error) {
  return error ? 'md-field__support is-error' : 'md-field__support'
}

function MarcadorObligatorio() {
  return (
    <span className="md-field__required" aria-hidden="true">
      {' '}
      *
    </span>
  )
}

function valorTieneContenido(valor) {
  return valor !== '' && valor !== null && valor !== undefined
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helper,
  required = false,
  forceFloat = false,
  type = 'text',
  className = '',
  ...props
}) {
  const supportId = `${id}-support`
  const flotado = forceFloat || valorTieneContenido(value)
  const claseCaja = [
    'md-field__box',
    flotado ? 'md-field__box--float' : '',
    error ? 'md-field__box--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`md-field ${className}`}>
      <div className={claseCaja}>
        <input
          {...props}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          className="md-field__control"
          aria-invalid={Boolean(error)}
          aria-describedby={supportId}
          aria-required={required}
        />
        <label htmlFor={id} className="md-field__label">
          {label}
          {required ? <MarcadorObligatorio /> : null}
        </label>
      </div>
      <p id={supportId} className={clasesError(error)} aria-live="polite">
        {error || helper || ''}
      </p>
    </div>
  )
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helper,
  required = false,
  disabled = false,
  placeholder = 'Selecciona…',
  className = '',
  children,
  ...props
}) {
  const supportId = `${id}-support`
  const claseCaja = [
    'md-field__box md-field__box--float',
    error ? 'md-field__box--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`md-field ${className}`}>
      <div className={claseCaja}>
        <select
          {...props}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="md-field__control md-field__control--select"
          aria-invalid={Boolean(error)}
          aria-describedby={supportId}
          aria-required={required}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <label htmlFor={id} className="md-field__label">
          {label}
          {required ? <MarcadorObligatorio /> : null}
        </label>
        <IconoChevronAbajo className="md-field__chevron" />
      </div>
      <p id={supportId} className={clasesError(error)} aria-live="polite">
        {error || helper || ''}
      </p>
    </div>
  )
}

export function TextareaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helper,
  required = false,
  className = '',
  rows = 3,
  ...props
}) {
  const supportId = `${id}-support`
  const claseCaja = [
    'md-field__box md-field__box--float',
    error ? 'md-field__box--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`md-field ${className}`}>
      <div className={claseCaja}>
        <textarea
          {...props}
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          className="md-field__control md-field__control--textarea"
          aria-invalid={Boolean(error)}
          aria-describedby={supportId}
          aria-required={required}
        />
        <label htmlFor={id} className="md-field__label">
          {label}
          {required ? <MarcadorObligatorio /> : null}
        </label>
      </div>
      <p id={supportId} className={clasesError(error)} aria-live="polite">
        {error || helper || ''}
      </p>
    </div>
  )
}

export function SegmentedField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helper,
  opciones,
  required = false,
}) {
  const supportId = `${id}-support`

  return (
    <fieldset className="md-field" aria-describedby={supportId} aria-invalid={Boolean(error)}>
      <legend className="md-field__legend">
        {label}
        {required ? <MarcadorObligatorio /> : null}
      </legend>
      <div className="md-segmented">
        {opciones.map((opcion) => (
          <label
            key={opcion.valor}
            className={`md-segment ${value === opcion.valor ? 'is-selected' : ''}`}
          >
            <input
              type="radio"
              name={id}
              value={opcion.valor}
              checked={value === opcion.valor}
              onChange={onChange}
              onBlur={onBlur}
              className="sr-only"
            />
            <span>{opcion.etiqueta}</span>
          </label>
        ))}
      </div>
      <p id={supportId} className={clasesError(error)} aria-live="polite">
        {error || helper || ''}
      </p>
    </fieldset>
  )
}

export function Button({
  variant = 'filled',
  icon = null,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button type={type} className={`md-btn md-btn--${variant} ${className}`} {...props}>
      {icon ? <span className="md-btn__icon">{icon}</span> : null}
      {children}
    </button>
  )
}

export function Chip({ tono = 'neutral', children, className = '' }) {
  return <span className={`md-chip md-chip--${tono} ${className}`}>{children}</span>
}
