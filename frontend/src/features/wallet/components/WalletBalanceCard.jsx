export default function WalletBalanceCard({
  title,
  value,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c1120] p-6">
      <p className="mb-2 text-xs uppercase text-gray-400">
        {title}
      </p>

      <h2 className="text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}