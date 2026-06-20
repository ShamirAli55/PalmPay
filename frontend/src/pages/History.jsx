export default function History() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transaction History</h1>

      {[1,2,3].map((t) => (
        <div key={t} className="bg-white p-4 rounded-xl shadow flex justify-between">
          <div>
            <p className="font-semibold">Merchant Payment</p>
            <p className="text-sm text-gray-500">Today</p>
          </div>
          <p className="font-bold">- PKR 500</p>
        </div>
      ))}
    </div>
  );
}

