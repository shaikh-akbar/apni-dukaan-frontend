import { Link } from 'react-router-dom'

export default function Brand({ to = '/' }) {
  return (
    <Link to={to} className="flex shrink-0 items-center" aria-label="Apni Dukaan home">
      {/* The PNG is square with wide white margins; crop to the wordmark and blend the white away */}
      <span className="block aspect-[9/5] h-10 overflow-hidden sm:h-12">
        <img
          src="/apni-dukaan-logo.png"
          alt="Apni Dukaan"
          className="size-full scale-110 object-cover mix-blend-multiply"
        />
      </span>
    </Link>
  )
}
