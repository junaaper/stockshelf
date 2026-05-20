interface Props {
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
}

export default function MovementBadge({ type }: Props) {
  const styles = {
    IN: 'bg-green-100 text-green-700',
    OUT: 'bg-red-100 text-red-700',
    ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${styles[type]}`}>
      {type}
    </span>
  )
}
