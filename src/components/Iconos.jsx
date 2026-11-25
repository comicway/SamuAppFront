const BASE = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

function Icono({ children, className = '', ...props }) {
  return (
    <svg {...BASE} className={className} {...props}>
      {children}
    </svg>
  )
}

export function IconoAmbulancia(props) {
  return (
    <Icono {...props}>
      <path d="M2.5 7h12v9h-12z" />
      <path d="M14.5 10h3l3 3v3h-6z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
      <path d="M7 10.5v3M5.5 12h3" />
    </Icono>
  )
}

export function IconoHelicoptero(props) {
  return (
    <Icono {...props}>
      <path d="M4 5h16M12 5v3" />
      <path d="M6 8h8a4 4 0 0 1 4 4v2H9a3 3 0 0 1-3-3V8Z" />
      <path d="M17 14v2h4M9 14v2H5" />
      <path d="M8 18h8" />
    </Icono>
  )
}

export function IconoHospital(props) {
  return (
    <Icono {...props}>
      <path d="M4 21V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16" />
      <path d="M2 21h20" />
      <path d="M12 8v6M9 11h6" />
      <path d="M9 17h6v4H9z" />
    </Icono>
  )
}

export function IconoParamedico(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 21v-2.5A4.5 4.5 0 0 1 10 14h4a4.5 4.5 0 0 1 4.5 4.5V21" />
      <path d="M12 16v4M10 18h4" />
    </Icono>
  )
}

export function IconoAlerta(props) {
  return (
    <Icono {...props}>
      <path d="M12 3 2.8 19.2A1.5 1.5 0 0 0 4.1 21.5h15.8a1.5 1.5 0 0 0 1.3-2.3L12 3Z" />
      <path d="M12 9v5M12 17.5h.01" />
    </Icono>
  )
}

export function IconoCheck(props) {
  return (
    <Icono {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icono>
  )
}

export function IconoInfo(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icono>
  )
}

export function IconoBasura(props) {
  return (
    <Icono {...props}>
      <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </Icono>
  )
}

export function IconoMas(props) {
  return (
    <Icono {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icono>
  )
}

export function IconoChevronAbajo(props) {
  return (
    <Icono {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icono>
  )
}

export function IconoPulso(props) {
  return (
    <Icono {...props}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </Icono>
  )
}

export function IconoDocumento(props) {
  return (
    <Icono {...props}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </Icono>
  )
}

export function IconoSol(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icono>
  )
}

export function IconoLuna(props) {
  return (
    <Icono {...props}>
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a7 7 0 1 0 11.1 11.1Z" />
    </Icono>
  )
}
