const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function ServiceCard({ service }) {
  return (
    <article className="flex flex-col rounded-xl bg-white p-6 ring-1 ring-mist">
      <h3 className="font-display text-lg font-bold">{service.title}</h3>
      <p className="mt-1 text-sm text-ink/60">{service.durationMin} minutes</p>
      {service.description && <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">{service.description}</p>}
      <p className="mt-4 font-semibold text-tide">
        {typeof service.price === 'number' ? formatPrice(service.price) : 'Contact for pricing'}
      </p>
    </article>
  );
}
